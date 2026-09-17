# AI Email Grammar Checker

A browser-based email grammar checker powered by a local Ollama model. Paste a draft, compare the original and corrected email, and review explanations for individual changes.

## Features

- Grammar, spelling, punctuation, capitalization and sentence-structure corrections.
- Side-by-side original and corrected emails.
- Red highlights for removed or replaced text and blue highlights for additions.
- Expandable correction details with explanations.
- Word count, character count and estimated reading time.
- Sample email, clear and copy controls.
- Responsive interface using HTML, CSS and vanilla JavaScript.

## Requirements

- A modern web browser.
- [Ollama](https://docs.ollama.com/quickstart) running locally.
- The [qwen2.5:3b model](https://ollama.com/library/qwen2.5:3b).
- Python 3 only if using the simple local web-server command below.

There are no Python package or npm dependencies. `requirements.txt` intentionally contains comments only: Ollama and its model are installed separately.

## Setup and run

1. Install Ollama and open the Ollama application.
2. Download the model in a terminal:

   ```sh
   ollama pull qwen2.5:3b
   ```

3. If the Ollama server is not already running, start it in a separate terminal:

   ```sh
   ollama serve
   ```

4. Open a terminal in this repository and serve the frontend locally:

   ```sh
   python -m http.server 8000 --bind 127.0.0.1
   ```

   On Windows, use `py -m http.server 8000 --bind 127.0.0.1` if Python is available through the `py` launcher.

5. Open [the local application](http://127.0.0.1:8000) in your browser.
6. Paste an email or choose **Try Sample**, then select **Check Grammar**.
7. Review the corrections and choose **Copy** to copy the corrected email.

The web-server command uses Python's standard library; no `pip install` step is needed. An equivalent local static-file server may also be used.

## How it works

All frontend code is in `index.html`. It sends the draft to `http://localhost:11434/api/generate`, requesting JSON from `qwen2.5:3b`. The interface displays the corrected text and model explanations, then compares the actual texts to highlight edits.

The request uses a temperature of `0.2`, a generation limit of `700` tokens and a 90-second timeout. These values and the endpoint/model are configured in the JavaScript inside `index.html`.

## Troubleshooting

- **Unable to process the email:** Check that Ollama is running and `qwen2.5:3b` has been downloaded.
- **Request exceeded 90 seconds:** Try a shorter draft and allow the local model time to load.
- **Invalid JSON or missing corrected text:** Retry with a shorter draft; long responses can exceed the configured generation limit.
- **Browser connection or origin error:** Use the local web-server URL above. See the [Ollama origin configuration documentation](https://docs.ollama.com/faq) for other origins.

## Scope

The app sends draft text to the configured local Ollama service. It has no email-sending feature, account system or application database. Review generated corrections before using them.

This repository contains the frontend, not Ollama or model weights. Uploading the files to GitHub does not provide a hosted AI service; each user needs the local Ollama setup.

## Repository structure

```text
index.html         Complete application, stylesheet and JavaScript
README.md          Setup, usage and project documentation
requirements.txt   Documents that no Python packages are required
.gitignore         Excludes local environments, caches and editor files
```
