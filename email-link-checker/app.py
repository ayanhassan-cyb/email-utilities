from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import parse_qs, urljoin, urlparse
import ipaddress
import re
import socket

import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

MAX_HTML_BYTES = 1_000_000
MAX_LIVE_URLS = 50
MAX_REDIRECTS = 5
TIMEOUT = (4, 8)
SHORTENERS = {
    "bit.ly", "buff.ly", "cutt.ly", "goo.gl", "is.gd", "ow.ly", "rebrand.ly",
    "t.co", "tiny.cc", "tinyurl.com", "rb.gy", "shorturl.at"
}
REDIRECT_PARAMS = {"url", "u", "target", "dest", "destination", "redirect", "redirect_url", "redirect_uri", "continue", "next", "out"}
USER_AGENT = "RobustEmail-LinkChecker/1.0 (+https://robust.email/)"


def normalize_base_url(value):
    value = (value or "").strip()
    if not value:
        return ""
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", value) and not value.lower().startswith(("http:", "https:")):
        raise ValueError("Base URL must use HTTP or HTTPS.")
    if "://" not in value:
        value = "https://" + value
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Base URL must be a valid HTTP or HTTPS website address.")
    return value


def public_http_url(value):
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Only public HTTP and HTTPS URLs can be checked.")
    hostname = parsed.hostname.rstrip(".").lower()
    if hostname == "localhost" or hostname.endswith((".localhost", ".local", ".internal")):
        raise ValueError("Local and private network addresses are not checked.")
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)}
    except socket.gaierror as error:
        raise ValueError("The hostname could not be resolved.") from error
    if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
        raise ValueError("Local, private and reserved network addresses are not checked.")
    return parsed


def request_once(session, url, method):
    public_http_url(url)
    return session.request(method, url, timeout=TIMEOUT, allow_redirects=False, stream=True,
                           headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,*/*;q=0.5"})


def check_url(url):
    session = requests.Session()
    current = url
    redirects = []
    method = "HEAD"
    try:
        for _ in range(MAX_REDIRECTS + 1):
            response = request_once(session, current, method)
            status = response.status_code
            if method == "HEAD" and status in {400, 403, 405, 501}:
                response.close()
                method = "GET"
                response = request_once(session, current, method)
                status = response.status_code
            if 300 <= status < 400:
                location = response.headers.get("Location")
                response.close()
                if not location:
                    return {"state": "broken", "status": status, "final_url": current, "redirects": redirects,
                            "message": "Redirect response has no Location header."}
                next_url = urljoin(current, location)
                public_http_url(next_url)
                redirects.append({"status": status, "url": next_url})
                current = next_url
                method = "HEAD"
                continue
            response.close()
            state = "broken" if status >= 400 else "ok"
            return {"state": state, "status": status, "final_url": current, "redirects": redirects,
                    "message": "HTTP request succeeded." if state == "ok" else f"Server returned HTTP {status}."}
        return {"state": "broken", "status": None, "final_url": current, "redirects": redirects,
                "message": f"More than {MAX_REDIRECTS} redirects."}
    except (requests.RequestException, ValueError) as error:
        return {"state": "blocked" if isinstance(error, ValueError) else "broken", "status": None,
                "final_url": current, "redirects": redirects, "message": str(error)}
    finally:
        session.close()


def suspicious_reasons(url):
    parsed = urlparse(url)
    reasons = []
    hostname = (parsed.hostname or "").lower()
    if hostname in SHORTENERS or any(hostname.endswith("." + item) for item in SHORTENERS):
        reasons.append("Known URL shortener")
    query_keys = {key.lower() for key in parse_qs(parsed.query, keep_blank_values=True)}
    if query_keys & REDIRECT_PARAMS:
        reasons.append("Contains a redirect-style query parameter")
    if "@" in parsed.netloc:
        reasons.append("Contains user information before the hostname")
    return reasons


def extract_links(html, base_url):
    soup = BeautifulSoup(html, "html.parser")
    anchors = soup.find_all("a")
    links = []
    normalized_counts = {}
    for index, anchor in enumerate(anchors, start=1):
        raw = anchor.get("href")
        href = raw.strip() if isinstance(raw, str) else ""
        label = " ".join(anchor.get_text(" ", strip=True).split())
        item = {"index": index, "text": label, "href": href, "resolved_url": "", "issues": [], "kind": "web", "live": None}
        if not href or href == "#":
            item["kind"] = "empty"
            item["issues"].append("Empty or placeholder href")
        elif href.startswith("#"):
            item["kind"] = "fragment"
        elif href.lower().startswith("mailto:"):
            item["kind"] = "email"
        elif href.lower().startswith("tel:"):
            item["kind"] = "phone"
        elif href.lower().startswith(("javascript:", "data:", "vbscript:")):
            item["kind"] = "unsafe"
            item["issues"].append("Unsafe link scheme")
        elif href.startswith("//"):
            item["resolved_url"] = "https:" + href
            item["issues"].append("Protocol-relative URL; use an explicit https:// URL")
        else:
            parsed = urlparse(href)
            if parsed.scheme in {"http", "https"}:
                item["resolved_url"] = href
            elif parsed.scheme:
                item["kind"] = "other"
                item["issues"].append(f"Unsupported {parsed.scheme}: link scheme")
            elif base_url:
                item["resolved_url"] = urljoin(base_url, href)
                item["issues"].append("Relative URL resolved with the supplied base URL")
            else:
                item["kind"] = "relative"
                item["issues"].append("Relative URL needs a base URL before it can be checked")
        if item["resolved_url"]:
            parsed = urlparse(item["resolved_url"])
            if parsed.scheme == "http":
                item["issues"].append("Uses HTTP instead of HTTPS")
            item["issues"].extend(suspicious_reasons(item["resolved_url"]))
            duplicate_key = item["resolved_url"].split("#", 1)[0]
            normalized_counts[duplicate_key] = normalized_counts.get(duplicate_key, 0) + 1
            item["duplicate_key"] = duplicate_key
        links.append(item)
    for item in links:
        key = item.pop("duplicate_key", "")
        if key and normalized_counts[key] > 1:
            item["issues"].append(f"Duplicate destination used {normalized_counts[key]} times")
    return links


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    html = data.get("html", "")
    if not isinstance(html, str):
        return jsonify({"error": "HTML must be text."}), 400
    if len(html.encode("utf-8")) > MAX_HTML_BYTES:
        return jsonify({"error": "HTML is larger than the 1 MB limit."}), 413
    try:
        base_url = normalize_base_url(data.get("base_url", ""))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    links = extract_links(html, base_url)
    check_live = bool(data.get("check_live", True))
    unique_urls = list(dict.fromkeys(item["resolved_url"] for item in links if item["resolved_url"]))
    skipped = max(0, len(unique_urls) - MAX_LIVE_URLS) if check_live else 0
    if check_live:
        targets = unique_urls[:MAX_LIVE_URLS]
        with ThreadPoolExecutor(max_workers=min(8, max(1, len(targets)))) as executor:
            futures = {executor.submit(check_url, url): url for url in targets}
            checks = {futures[future]: future.result() for future in as_completed(futures)}
        for item in links:
            if item["resolved_url"] in checks:
                item["live"] = checks[item["resolved_url"]]
    issue_count = sum(bool(item["issues"]) or bool(item["live"] and item["live"]["state"] != "ok") for item in links)
    broken_count = sum(bool(item["live"] and item["live"]["state"] == "broken") for item in links)
    return jsonify({"links": links, "summary": {"total": len(links), "unique_web": len(unique_urls),
                    "issues": issue_count, "broken": broken_count, "skipped_live": skipped}})


if __name__ == "__main__":
    app.run(debug=True, port=5001)



