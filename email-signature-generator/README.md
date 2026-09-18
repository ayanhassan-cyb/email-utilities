# Email Signature Generator

A single-page signature builder for Robust Email. Enter your name, designation and contact details, choose a layout, and generate a formatted signature or email-friendly HTML.

## Run

Open `index.html` in a modern browser. No build step, package installation, API key or backend is required.

For a local web preview, run `python -m http.server 8000 --bind 127.0.0.1` in this folder (or `py -m http.server 8000 --bind 127.0.0.1` on Windows), then open [the generator](http://127.0.0.1:8000).

For hosting, copy this directory to a static path such as `/email-signature-generator/` on robust.email. Keep `index.html`, `style.css` and `script.js` together. HTTPS supports the modern clipboard API; a manual copy dialog is available when copying is blocked.

## Features

- Name, designation, company, pronouns, email, phone, website, LinkedIn and address/location fields.
- Optional hosted photo or logo, image description and short tagline.
- Classic, stacked and minimal layouts, three system-font choices, accent color and text size.
- Live preview inside a sample email and a separate HTML view.
- **Generate signature** validates the form and loads any optional image.
- **Copy signature** copies formatted HTML with a plain-text alternative.
- **Copy HTML** copies just the signature markup, without the surrounding preview email.
- **Download HTML** saves a complete HTML file that can be opened in a browser.
- Example details, clear/reset, keyboard-accessible controls, and layouts for mobile and desktop.

## Usage

1. Replace the clearly labeled example details with your own. Only the name is required.
2. Choose a layout, color, font and size.
3. If using an image, provide a public HTTPS URL to a square PNG/JPG and an appropriate description. The image is displayed at 80 by 80 pixels.
4. Choose **Generate signature** and review the preview.
5. Choose **Copy signature** and paste into your email client's signature settings. Use **Copy HTML** only in an editor that accepts HTML source.
6. Send a test email from the client you actually use and review it on desktop and mobile.

A missing name or an invalid email, phone or web address disables exporting until corrected. Empty optional fields are omitted. Website addresses without a scheme are normalized to HTTPS. Phone links support an extension such as `ext. 42`.

## Email-friendly output

The exported signature uses presentation tables, inline styles, system fonts, ordinary text links and explicit image width/height attributes. It includes no JavaScript, external stylesheets, flexbox, grid, SVG icons, data-URI images or builder UI. These choices use broadly supported email HTML; see the [Can I email table support reference](https://www.caniemail.com/features/html-table/).

Email applications can alter pasted formatting, handle dark mode differently or block remote images. This utility is not an email-client rendering service and does not guarantee identical rendering in every client. Use a square image to avoid distortion, and verify it remains publicly accessible. Image-load failures are shown in the preview; remove or replace the URL before using that image in a signature.

## Add the signature to your client

The page includes installation guidance. Refer to the current instructions for your client:

- [Gmail signature settings](https://support.google.com/mail/answer/8395?hl=en)
- [Outlook signature settings](https://support.microsoft.com/en-us/outlook/mail/how-to-add-and-change-an-email-signature-in-outlook)
- [Apple Mail signatures](https://support.apple.com/guide/mail/create-and-use-email-signatures-mail11943/mac)

## Privacy and safe handling

Generation takes place in the browser. The app does not send form details to an API, store them in local storage, use analytics or create an account. Reloading discards your entries and restores the example.

An optional hosted image is requested directly from the supplied host when you generate, copy or download, and recipients' email clients may later request that image. Typing its URL alone does not load it. The default example uses Ayan Hassan's supplied contact details; no remote assets are needed for the default preview.

Text is escaped before HTML generation. Links are restricted to HTTP/HTTPS (images require HTTPS), credential-bearing URLs are rejected, and LinkedIn links are restricted to LinkedIn hosts. Email and telephone links are generated from their corresponding fields.

## Files

```text
index.html         Accessible page, form, preview and installation guide
style.css          Responsive Robust Email-inspired interface
script.js          Validation, signature generation, preview and export
README.md          Setup, use and compatibility notes
requirements.txt   Notes that no Python packages are required
.gitignore         Excludes local files if used as a standalone repository
```

No frameworks or application dependencies are used. Browser verification covered generation, all three layouts, contact links, escaped input, invalid values, clipboard payloads and fallback, HTML download, optional images, keyboard tabs and widths of 320, 390, 768 and 1280 pixels. Clipboard payloads were verified using a test clipboard; final pasting in actual email clients should be checked with a test message.

