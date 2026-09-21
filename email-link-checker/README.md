# Email Link Checker

Extract every anchor from an HTML email, identify source problems, and optionally verify public HTTP/HTTPS destinations.

## Checks

- Empty and placeholder `href` attributes.
- HTTP links that should use HTTPS.
- Duplicate destinations.
- Relative URLs, resolved when a base URL is supplied.
- Unsafe or unsupported URL schemes.
- Known URL shorteners and redirect-style query parameters.
- Live HTTP status, redirect chains and unreachable destinations for up to 50 unique URLs.

Fragment, `mailto:` and `tel:` links are listed but are not sent as web requests. Localhost, private, link-local, loopback and reserved IP destinations are blocked. Each redirect target is validated before it is requested.

## Run

On Windows, double-click `run.bat`. For manual setup:

```sh
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Open `http://127.0.0.1:5001`.

## API

`POST /analyze` accepts JSON with `html`, optional `base_url`, and `check_live`. HTML is limited to 1 MB and live verification is limited to the first 50 unique web URLs. Live requests use short connect/read timeouts and at most five redirects.

## Limitations

Live results are point-in-time observations. Authentication, bot protection, rate limits, geolocation and temporary failures can affect status codes. A successful response does not prove that the page content is correct or safe. The redirect heuristics flag common patterns; they are not a malware or phishing classifier.
