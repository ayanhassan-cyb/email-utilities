# Email Utilities

A collection of practical, web-based utilities designed to make common
email writing, review, and development tasks faster and easier.

This repository contains multiple email-focused tools developed as part
of my cybersecurity internship work at the National Center for Cyber
Security (NCCS), NED University. Each utility is kept in its own
directory so the collection can be expanded with additional tools over
time.

## Utilities

### 1. AI-Powered Email Grammar Checker

A privacy-focused email grammar checker that uses a locally hosted Large
Language Model (LLM) to review and improve email text.

**Key features:** - Grammar, spelling, and writing corrections -
Corrected email output - Highlights/lists the changes made - Local LLM
processing using Ollama - No external AI API required - Simple
single-page web interface - Copy, clear, word count, character count,
and reading-time utilities

The local AI approach allows email content to be processed on the user's
machine instead of being sent to an external AI service.

See
[`ai-email-grammar-checker/README.md`](ai-email-grammar-checker/README.md)
for setup and usage instructions.

### 2. Email Pre-Send Inspector

A web-based utility for reviewing an email before it is sent. It
performs a series of checks to help identify common issues that may
otherwise be overlooked during a manual review.

**Key features:** - Pre-send email inspection - Automated checks and
warnings - Clear inspection results - Python-based backend -
Browser-based user interface - Designed to make final email review
quicker and more consistent

See
[`email-pre-send-inspector/README.md`](email-pre-send-inspector/README.md)
for setup and usage instructions.

### 3. Email Signature Generator

A single-page signature builder inspired by Robust Email's visual style.
Enter your name, designation and contact information, choose a layout,
and generate an email-friendly HTML signature.

**Key features:**

- Classic, stacked and minimal layouts with a live preview.
- Contact links, optional photo/logo, pronouns, address and tagline.
- Accent color, system-font and text-size controls.
- Copy a formatted signature, copy HTML source, or download an HTML file.
- Browser-only generation with no backend or application dependencies.

Open [`email-signature-generator/index.html`](email-signature-generator/index.html)
to use it, or read its [setup and usage guide](email-signature-generator/README.md).

### 4. HTML-to-Plain-Text Email Converter

A browser-only utility that turns an HTML email into a clean, readable
plain-text alternative while preserving useful structure.

**Key features:**

- Converts headings, paragraphs, lists, tables and block quotes.
- Optionally includes link destinations and image alt text.
- Omits scripts, styles, comments, tracking pixels and hidden elements.
- Shows word count, character count, reading time and output size.
- Copies the result or downloads it as a `.txt` file.

Open [`html-to-plain-text-email-converter/index.html`](html-to-plain-text-email-converter/index.html)
or read its [usage guide](html-to-plain-text-email-converter/README.md).

### 5. Email Link Checker

A local Flask utility that extracts every link from email HTML, reviews
source-level problems and can test public web destinations.

**Key features:**

- Finds empty, relative, insecure, unsafe and duplicate links.
- Flags URL shorteners and redirect-style query parameters.
- Resolves relative destinations using an optional base URL.
- Checks public HTTP/HTTPS links and reports response codes and redirects.
- Blocks checks to local, private and reserved network addresses.

See [`email-link-checker/README.md`](email-link-checker/README.md) for setup
and usage instructions.

## Repository Structure

```text
email-utilities/
├── README.md
├── .gitignore
├── ai-email-grammar-checker/
│   ├── README.md
│   ├── index.html
│   └── requirements.txt
├── email-pre-send-inspector/
│   ├── README.md
│   ├── app.py
│   ├── requirements.txt
│   ├── run.bat
│   ├── static/
│   │   ├── script.js
│   │   └── style.css
│   └── templates/
│       └── index.html
├── email-signature-generator/
│   ├── README.md
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── requirements.txt
├── html-to-plain-text-email-converter/
│   ├── README.md
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── requirements.txt
└── email-link-checker/
    ├── README.md
    ├── app.py
    ├── requirements.txt
    ├── run.bat
    ├── static/
    │   ├── script.js
    │   └── style.css
    └── templates/
        └── index.html
```

## Purpose

The goal of **Email Utilities** is to build a growing collection of
focused tools that simplify repetitive or error-prone email tasks.
Rather than combining everything into one large application, each
utility solves a specific problem and can be developed, tested, and used
independently.

The repository is structured to support additional utilities in the
future, including tools for email HTML, compatibility testing, link
validation, responsive previews, accessibility checks, and other email
development workflows.

## Getting Started

Each utility has its own requirements and setup instructions. Open the
corresponding project directory and follow its `README.md`.

For the AI-powered grammar checker, a locally running Ollama
installation and compatible local model are required. The Pre-Send
Inspector and Email Link Checker use their own Python dependencies as documented
in their project folders. The converter runs directly in a browser.

## Technologies

The utilities in this repository use technologies including:

-   HTML
-   CSS
-   JavaScript
-   Python
-   Flask
-   Ollama
-   Local Large Language Models (LLMs)

## Privacy

Where applicable, the utilities are designed with local processing in
mind. In particular, the AI-Powered Email Grammar Checker uses a locally
hosted LLM rather than an external AI API, helping keep the email text
on the local machine during AI processing.

## Development

This repository is intended to grow as additional email utilities are
developed. New tools can be added as separate directories while sharing
the same overall repository and version history.

## Author

**Ayan Hassan**\
BS Cyber Security Student\
Cyber Security Intern --- National Center for Cyber Security (NCCS), NED
University
