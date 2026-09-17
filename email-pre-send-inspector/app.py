from flask import Flask, render_template, request, jsonify
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

app = Flask(__name__)

SPAM_WORDS = [
    "free",
    "guaranteed",
    "winner",
    "urgent",
    "act now",
    "limited time",
    "click here",
    "buy now",
    "congratulations",
    "100% free"
]


def add_result(results, category, message, severity="warning"):
    results.append({
        "category": category,
        "message": message,
        "severity": severity
    })


def analyze_email(subject, html):
    results = []
    score = 100

    if not subject.strip():
        add_result(results, "Subject", "Email subject is empty.", "error")
        score -= 15
    elif len(subject) > 60:
        add_result(
            results,
            "Subject",
            f"Subject is {len(subject)} characters long. Consider keeping it under 60 characters.",
            "warning"
        )
        score -= 5
    else:
        add_result(
            results,
            "Subject",
            f"Subject length looks good ({len(subject)} characters).",
            "success"
        )

    if subject.count("!") >= 3:
        add_result(
            results,
            "Subject",
            "Subject contains excessive exclamation marks.",
            "warning"
        )
        score -= 5

    words = re.findall(r'\b[A-Za-z]+\b', subject)
    if words:
        uppercase_words = [word for word in words if len(word) > 2 and word.isupper()]
        if len(uppercase_words) >= 2:
            add_result(
                results,
                "Subject",
                "Subject contains multiple ALL CAPS words.",
                "warning"
            )
            score -= 5

    if not html.strip():
        add_result(results, "Content", "Email body is empty.", "error")
        return {
            "score": max(score - 40, 0),
            "results": results,
            "stats": {}
        }

    soup = BeautifulSoup(html, "html.parser")

    scripts = soup.find_all("script")
    if scripts:
        add_result(
            results,
            "Security",
            f"{len(scripts)} JavaScript script tag(s) detected. JavaScript should not be included in email HTML.",
            "error"
        )
        score -= 20
    else:
        add_result(results, "Security", "No JavaScript detected.", "success")

    forms = soup.find_all("form")
    if forms:
        add_result(
            results,
            "Compatibility",
            f"{len(forms)} HTML form(s) detected. Forms have limited support in email clients.",
            "warning"
        )
        score -= 10

    links = soup.find_all("a")
    hrefs = []

    for link in links:
        href = link.get("href")

        if not href or href.strip() in ["", "#"]:
            add_result(
                results,
                "Links",
                "An empty or placeholder link was detected.",
                "error"
            )
            score -= 5
            continue

        hrefs.append(href)
        parsed = urlparse(href)

        if parsed.scheme == "http":
            add_result(
                results,
                "Links",
                f"Insecure HTTP link detected: {href}",
                "warning"
            )
            score -= 3

        if href.lower().startswith("javascript:"):
            add_result(
                results,
                "Security",
                f"JavaScript URL detected: {href}",
                "error"
            )
            score -= 10

    duplicate_links = {href for href in hrefs if hrefs.count(href) > 1}
    if duplicate_links:
        add_result(
            results,
            "Links",
            f"{len(duplicate_links)} duplicate URL(s) detected.",
            "info"
        )

    if links:
        add_result(
            results,
            "Links",
            f"{len(links)} link(s) detected.",
            "success"
        )

    images = soup.find_all("img")
    missing_alt = 0
    missing_dimensions = 0

    for image in images:
        if image.get("alt") is None:
            missing_alt += 1
        if not image.get("width") or not image.get("height"):
            missing_dimensions += 1

    if missing_alt:
        add_result(
            results,
            "Accessibility",
            f"{missing_alt} image(s) are missing alt text.",
            "warning"
        )
        score -= min(missing_alt * 3, 10)
    elif images:
        add_result(
            results,
            "Accessibility",
            "All images contain alt attributes.",
            "success"
        )

    if missing_dimensions:
        add_result(
            results,
            "Images",
            f"{missing_dimensions} image(s) do not have both width and height attributes.",
            "warning"
        )
        score -= min(missing_dimensions * 2, 6)

    preheader = soup.find(attrs={"class": re.compile("preheader", re.I)})
    if not preheader:
        add_result(
            results,
            "Email Design",
            "No obvious preheader element was detected.",
            "warning"
        )
        score -= 5
    else:
        add_result(
            results,
            "Email Design",
            "Preheader detected.",
            "success"
        )

    risky_tags = ["video", "audio", "iframe", "object", "embed"]
    for tag in risky_tags:
        found = soup.find_all(tag)
        if found:
            add_result(
                results,
                "Compatibility",
                f"{len(found)} <{tag}> element(s) detected. Support across email clients may be limited.",
                "warning"
            )
            score -= 5

    plain_text = soup.get_text(" ", strip=True).lower()
    detected_spam_words = []
    combined_content = f"{subject} {plain_text}".lower()

    for word in SPAM_WORDS:
        if word in combined_content:
            detected_spam_words.append(word)

    if detected_spam_words:
        add_result(
            results,
            "Content",
            "Potentially spam-like wording detected: " + ", ".join(detected_spam_words),
            "warning"
        )
        score -= min(len(detected_spam_words) * 2, 10)

    size_bytes = len(html.encode("utf-8"))
    size_kb = round(size_bytes / 1024, 2)

    if size_kb > 100:
        add_result(
            results,
            "Size",
            f"Email HTML is {size_kb} KB. Large emails may be clipped by some clients.",
            "warning"
        )
        score -= 10
    else:
        add_result(
            results,
            "Size",
            f"Email HTML size is {size_kb} KB.",
            "success"
        )

    score = max(0, min(score, 100))

    stats = {
        "links": len(links),
        "images": len(images),
        "html_size_kb": size_kb,
        "issues": len([
            item for item in results
            if item["severity"] in ["warning", "error"]
        ])
    }

    return {
        "score": score,
        "results": results,
        "stats": stats
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    subject = data.get("subject", "")
    html = data.get("html", "")
    result = analyze_email(subject, html)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
