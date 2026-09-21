# HTML-to-Plain-Text Email Converter

A browser-only utility that converts HTML email into a readable plain-text alternative.

## Features

- Preserves useful paragraph, heading, list, quote, line-break and table-row structure.
- Optionally includes link destinations and image alt text.
- Omits scripts, styles, comments, metadata, hidden elements and tracking pixels without alt text.
- Shows word count, character count, reading time and UTF-8 output size.
- Copies the result or downloads it as a `.txt` file.
- Uses HTML, CSS and vanilla JavaScript with no dependencies or backend.

## Run

Open `index.html`, or serve this directory locally:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000`.

## Notes

The conversion is deterministic and takes place entirely in the browser. Review the result before sending: complex visual layouts do not always have one correct textual reading order. Link destinations are preserved as written, including relative URLs.

## Files

`index.html` contains the interface, `style.css` contains the responsive design, and `script.js` contains conversion and export logic. `requirements.txt` is intentionally empty of packages.
