# Email Pre-Send Inspector

A quality assurance dashboard for reviewing email subjects and HTML before sending. Built for Robust Email with a Flask backend and an HTML, CSS and vanilla JavaScript frontend.

## Features

- Large overall inspection score and issue counts.
- Findings grouped into **Critical Issues**, **Warnings** and **Passed Checks**.
- Separate **Inspection Notes** for informational findings, including duplicate URLs.
- Category-based recommendations in a dedicated section.
- Link, image, HTML-size and issue statistics.
- Example email, reset controls, expandable findings and responsive layouts.
- Inline request errors and cancellation of stale reports after source edits.

## What it inspects

The existing backend checks subject length and wording, missing content, script tags and JavaScript URLs, forms and selected embedded elements, empty and insecure links, duplicate URLs, image alt attributes and dimensions, preheader presence, potentially spam-like wording, and HTML size.

The backend score starts at 100 and applies the existing rule-specific deductions with a minimum of 0. Recommendations are presentation guidance based on returned findings; they do not add checks or change the score.

## Requirements

- Python 3 compatible with the packages in `requirements.txt`.
- A modern web browser.
- Flask and BeautifulSoup, installed using `requirements.txt`.

No Node.js, frontend framework, AI model or API key is required.

## Windows quick start

1. Install Python and make it available through `py` or `python`.
2. Double-click `run.bat`.
3. The launcher installs/checks the required packages and starts the local app.
4. Open [the inspector](http://127.0.0.1:5000).

## Manual setup

Open a terminal in this repository.

### Windows

```bat
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

### macOS / Linux

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000). Stop the server with `Ctrl+C`.

## Use

1. Enter a subject and paste the complete email HTML, or choose **Load example**.
2. Select **Run inspection**.
3. Review the score and issue counts. Select a count to jump to its findings.
4. Expand the severity groups and read the original finding messages.
5. Review **Recommendations**, with critical issues first.
6. Edit and inspect again. Editing clears the previous report; **Clear** resets both the source and dashboard.

Empty inputs are submitted to the backend so its existing missing-subject and missing-body checks still run.

## API

`POST /analyze` accepts JSON:

```json
{
  "subject": "Your project update",
  "html": "<p>Hello Alex</p>"
}
```

The response contains `score`, `results` and `stats`. Each result contains `category`, `message` and `severity`. Severities are `error`, `warning`, `success` or `info`. The empty-body response returns an empty `stats` object.

The frontend displays the backend score and messages without recalculating inspections. When statistics are omitted for an empty body, the visible issue total is counted from the returned findings.

## Scope

This is a static inspection tool, not an email sender or an email-client rendering service. It does not guarantee delivery or identical rendering across clients. Submitted HTML is parsed by the backend and is never mounted or executed by the frontend; finding messages are rendered as text.

`app.py` starts Flask's local development server with debug mode enabled. The included launcher is for local use. GitHub Pages alone cannot run the Flask backend.

## Repository structure

```text
app.py                Flask routes and existing inspection logic
requirements.txt      Python dependencies
run.bat               Windows launcher
README.md             Setup, usage and project documentation
.gitignore            Excludes local environments and generated files
static/
  style.css           Dashboard styles
  script.js           Requests, result presentation and UI interactions
templates/
  index.html          Dashboard template
```

The application code, inspection rules, backend dependencies and original launcher are preserved from the existing project.
