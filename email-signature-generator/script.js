"use strict";

const $ = id => document.getElementById(id);
const form = $("signatureForm");
const textFields = ["fullName", "designation", "company", "pronouns", "email", "phone", "website", "linkedin", "address", "imageUrl", "imageAlt", "tagline"];
const fontFamilies = { arial: "Arial, Helvetica, sans-serif", georgia: "Georgia, Times New Roman, serif", verdana: "Verdana, Geneva, sans-serif" };
let generatedHtml = "";
let generatedText = "";
let approvedImage = "";
let isExample = false;
let copyMode = "rich";
let renderedPreview = "";

// User text is always escaped before it reaches the generated markup.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function normalizeUrl(value, kind = "website") {
  if (!value) return "";
  if (/[\u0000-\u0020\u007f]/.test(value)) throw new Error("Use a full web address without spaces.");
  let candidate = value;
  if (candidate.startsWith("//")) candidate = "https:" + candidate;
  else if (!/^[a-z][a-z\d+.-]*:/i.test(candidate)) candidate = "https://" + candidate;
  let url;
  try { url = new URL(candidate); } catch { throw new Error("Enter a valid website address."); }
  if (!["https:", "http:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password) {
    throw new Error("Use a public http:// or https:// address without login details.");
  }
  if (kind === "imageUrl" && url.protocol !== "https:") throw new Error("Use an HTTPS image address.");
  if (kind === "linkedin" && url.hostname !== "linkedin.com" && !url.hostname.endsWith(".linkedin.com")) {
    throw new Error("Enter a linkedin.com profile address.");
  }
  return url.href;
}

function phoneHref(value) {
  const extension = value.match(/(?:ext\.?|x|#)\s*(\d+)\s*$/i);
  const main = extension ? value.slice(0, extension.index) : value;
  const number = main.replace(/[^\d+]/g, "");
  return "tel:" + number + (extension ? ";ext=" + extension[1] : "");
}

function readData(showRequiredError = false) {
  const data = {};
  let valid = true;
  textFields.forEach(id => {
    data[id] = $(id).value.trim();
    $(id).setCustomValidity("");
    $(id).removeAttribute("aria-invalid");
    if ($(id + "Error")) $(id + "Error").textContent = "";
  });
  function error(id, message, show = true) {
    valid = false;
    $(id).setCustomValidity(message);
    if (show) {
      $(id).setAttribute("aria-invalid", "true");
      if ($(id + "Error")) $(id + "Error").textContent = message;
    }
  }
  if (!data.fullName) error("fullName", "Add your name to create a signature.", showRequiredError);
  if (data.email && $("email").validity.typeMismatch) error("email", "Enter a valid email address.");
  if (data.phone && (!/^\+?[\d\s().-]+(?:(?:ext\.?|x|#)\s*\d+)?$/i.test(data.phone) || data.phone.replace(/\D/g, "").length < 3)) {
    error("phone", "Use a phone number, optionally followed by ext. 123.");
  }
  ["website", "linkedin", "imageUrl"].forEach(id => {
    try { data[id] = normalizeUrl(data[id], id); }
    catch (reason) { error(id, reason.message); data[id] = ""; }
  });
  data.layout = form.elements.layout.value;
  if (!["classic", "stacked", "minimal"].includes(data.layout)) data.layout = "classic";
  data.font = Object.hasOwn(fontFamilies, $("font").value) ? $("font").value : "arial";
  data.size = [12, 14, 16].includes(Number($("size").value)) ? Number($("size").value) : 14;
  data.accent = /^#[0-9a-f]{6}$/i.test($("accentColor").value) ? $("accentColor").value : "#087d76";
  return { data, valid };
}

function buildSignature(data) {
  const e = escapeHtml;
  const font = fontFamilies[data.font];
  const base = `font-family:${font};font-size:${data.size}px;line-height:1.5;color:#34443e;`;
  const tableStyle = `border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;${base}`;
  const link = (href, label) => `<a href="${e(href)}" style="${base}color:${data.accent};text-decoration:none;" target="_blank" rel="noopener noreferrer">${e(label)}</a>`;
  const row = (content, padding = "0 0 3px") => `<tr><td style="padding:${padding};${base}word-break:break-word;overflow-wrap:anywhere;">${content}</td></tr>`;
  const contactRows = [];
  const contact = (label, content) => `<tr><td valign="top" style="padding:1px 10px 1px 0;white-space:nowrap;${base}font-size:${Math.max(11, data.size - 2)}px;color:#6b7771;">${label}</td><td style="padding:1px 0;${base}word-break:break-word;overflow-wrap:anywhere;">${content}</td></tr>`;
  if (data.email) contactRows.push(contact("Email", link("mailto:" + encodeURIComponent(data.email).replace(/%40/g, "@"), data.email)));
  if (data.phone) contactRows.push(contact("Phone", link(phoneHref(data.phone), data.phone)));
  if (data.website) contactRows.push(contact("Web", link(data.website, data.website.replace(/^https?:\/\//, "").replace(/\/$/, ""))));
  if (data.address) contactRows.push(contact("Location", e(data.address)));
  const photo = data.imageUrl ? `<img src="${e(data.imageUrl)}" alt="${e(data.imageAlt || data.fullName)}" width="80" height="80" border="0" style="display:block;width:80px;height:80px;border:0;outline:none;text-decoration:none;">` : "";
  let rows = "";
  if (data.layout === "stacked" && photo) rows += row(photo, "0 0 13px");
  rows += row(`<span style="font-family:${font};font-size:${data.size + 6}px;line-height:1.3;font-weight:bold;color:#25382f;">${e(data.fullName)}</span>${data.pronouns ? `<br><span style="${base}font-size:${Math.max(11, data.size - 2)}px;color:#6b7771;">${e(data.pronouns)}</span>` : ""}`, "0 0 4px");
  if (data.designation || data.company) {
    rows += row([data.designation && e(data.designation), data.company && `<strong style="font-weight:bold;">${e(data.company)}</strong>`].filter(Boolean).join(" &nbsp;|&nbsp; "), "0 0 10px");
  }
  if (contactRows.length) rows += row(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}">${contactRows.join("")}</table>`);
  if (data.linkedin) rows += row(link(data.linkedin, "LinkedIn"), "8px 0 0");
  if (data.tagline) rows += row(`<span style="${base}font-size:${Math.max(11, data.size - 2)}px;color:#66736c;">${e(data.tagline)}</span>`, "12px 0 0");
  const content = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}">${rows}</table>`;
  const photoCell = data.layout !== "stacked" && photo ? `<td valign="top" width="96" style="width:96px;padding:0 16px 0 0;">${photo}</td>` : "";
  const contentStyle = data.layout === "classic" ? `border-left:3px solid ${data.accent};padding:0 0 0 17px;` : data.layout === "stacked" ? `border-top:3px solid ${data.accent};padding:14px 0 0;` : "padding:0;";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${tableStyle}max-width:480px;"><tr>${photoCell}<td valign="top" style="${contentStyle}${base}">${content}</td></tr></table>`;
}

function plainText(data) {
  return [data.fullName, data.pronouns, [data.designation, data.company].filter(Boolean).join(" | "), data.email, data.phone, data.website, data.address, data.linkedin, data.tagline].filter(Boolean).join("\n");
}

function feedback(message, isError = false) {
  $("feedback").textContent = message;
  $("feedback").classList.toggle("error", isError);
}

function update({ authorizeImage = false, showRequiredError = false } = {}) {
  const { data, valid } = readData(showRequiredError);
  if (authorizeImage && valid) approvedImage = data.imageUrl;
  if (!data.imageUrl) approvedImage = "";
  generatedHtml = valid ? buildSignature(data) : "";
  generatedText = valid ? plainText(data) : "";
  $("htmlCode").value = generatedHtml;
  $("htmlSize").textContent = (new TextEncoder().encode(generatedHtml).length / 1024).toFixed(1) + " KB";
  $("colorLabel").textContent = data.accent.toUpperCase();
  $("layoutLabel").textContent = data.layout.toUpperCase() + " LAYOUT";
  $("previewState").textContent = isExample ? "Example details" : valid ? "Live preview" : "Add your details";
  ["copySignature", "copyHtml", "downloadHtml"].forEach(id => { $(id).disabled = !valid; });
  const pendingImage = Boolean(data.imageUrl && approvedImage !== data.imageUrl);
  const previewHtml = valid ? buildSignature({ ...data, imageUrl: pendingImage ? "" : data.imageUrl }) : '<p class="empty-preview">Your signature starts with your name.<br>Add your details on the left, then make it yours.</p>';
  if (renderedPreview !== previewHtml) {
    $("signaturePreview").innerHTML = previewHtml;
    renderedPreview = previewHtml;
    $("imageStatus").hidden = true;
    const img = $("signaturePreview").querySelector("img");
    if (img) {
      const imageError = () => { if (img !== $("signaturePreview").querySelector("img")) return; $("imageStatus").hidden = false; $("imageStatus").textContent = "This image could not be loaded. Check that the URL is a public image, or remove it before copying."; };
      img.addEventListener("error", imageError);
      if (img.complete && !img.naturalWidth) imageError();
    }
  }
  if (pendingImage) {
    $("imageStatus").hidden = false;
    $("imageStatus").textContent = "Image added. Generate your signature to load it in the preview.";
  }
  if (!valid && data.fullName) {
    $("signaturePreview").textContent = "Check the highlighted fields to preview and export your signature.";
    renderedPreview = "";
  }
  return { data, valid };
}

function prepareExport() {
  const result = update({ authorizeImage: true, showRequiredError: true });
  if (!result.valid) {
    const invalid = form.querySelector(":invalid");
    if (invalid) { const details = invalid.closest("details"); if (details) details.open = true; invalid.focus(); }
    feedback("Check the highlighted fields before generating your signature.", true);
  }
  return result;
}

function switchTab(activeId, moveFocus = false) {
  ["preview", "html"].forEach(name => {
    const active = name === activeId;
    $(name + "Tab").setAttribute("aria-selected", String(active));
    $(name + "Tab").tabIndex = active ? 0 : -1;
    $(name + "Panel").hidden = !active;
  });
  if (moveFocus) $(activeId + "Tab").focus();
}
["preview", "html"].forEach(name => {
  $(name + "Tab").addEventListener("click", () => switchTab(name));
  $(name + "Tab").addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      switchTab(event.key === "Home" ? "preview" : event.key === "End" ? "html" : name === "html" ? "preview" : "html", true);
    }
  });
});

function selectManual() {
  if (copyMode === "html") { $("manualSource").focus(); $("manualSource").select(); return; }
  $("manualRich").focus();
  const range = document.createRange();
  range.selectNodeContents($("manualRich"));
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
function manualCopy(mode, html, text) {
  copyMode = mode;
  $("manualRich").hidden = mode !== "rich";
  $("manualSource").hidden = mode !== "html";
  $("manualRich").innerHTML = mode === "rich" ? html : "";
  $("manualSource").value = mode === "html" ? html : "";
  $("manualCopyTitle").textContent = mode === "rich" ? "Copy your formatted signature" : "Copy your HTML";
  $("manualCopyHelp").textContent = "Your browser blocked automatic copying. The content below is selected. Press Ctrl+C (Windows) or Command+C (Mac) to copy it.";
  $("manualCopyDialog").showModal();
  selectManual();
  feedback("Use the copy dialog to finish copying.");
}

function legacyCopy(html, text) {
  const holder = document.createElement("div");
  holder.contentEditable = "true";
  holder.style.cssText = "position:fixed;left:-10000px;top:0;background:white;";
  holder.innerHTML = html;
  document.body.append(holder);
  const previousFocus = document.activeElement;
  const selection = window.getSelection();
  const oldRanges = Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange());
  const range = document.createRange();
  range.selectNodeContents(holder);
  selection.removeAllRanges(); selection.addRange(range);
  let didCopy = false;
  const onCopy = event => {
    if (!event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData("text/html", html);
    event.clipboardData.setData("text/plain", text);
    didCopy = true;
  };
  document.addEventListener("copy", onCopy);
  try { return document.execCommand("copy") && didCopy; }
  catch { return false; }
  finally {
    document.removeEventListener("copy", onCopy); holder.remove();
    selection.removeAllRanges(); oldRanges.forEach(old => selection.addRange(old));
    if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
  }
}

$("copySignature").addEventListener("click", async () => {
  if (!prepareExport().valid) return;
  const html = generatedHtml, text = generatedText;
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error("Rich clipboard unavailable");
    await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
    feedback("Signature copied. Paste it into your email client’s signature settings.");
  } catch {
    if (legacyCopy(html, text)) feedback("Signature copied. Paste it into your email client’s signature settings.");
    else manualCopy("rich", html, text);
  }
});
$("copyHtml").addEventListener("click", async () => {
  if (!prepareExport().valid) return;
  const html = generatedHtml;
  try { await navigator.clipboard.writeText(html); feedback("HTML copied. Paste it into an HTML signature editor."); }
  catch { manualCopy("html", html, generatedText); }
});
$("downloadHtml").addEventListener("click", () => {
  const { data, valid } = prepareExport();
  if (!valid) return;
  const documentHtml = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + escapeHtml(data.fullName) + ' — Email signature</title>\n</head>\n<body style="margin:0;padding:20px;background-color:#ffffff;">\n' + generatedHtml + '\n</body>\n</html>\n';
  const url = URL.createObjectURL(new Blob([documentHtml], { type: "text/html;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "email-signature-" + (data.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "personal") + ".html";
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  feedback("HTML downloaded. Open the file in a browser to view your signature.");
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!prepareExport().valid) return;
  switchTab("preview");
  $("signaturePreview").focus({ preventScroll: true });
  $("previewTitle").scrollIntoView({ behavior: "auto", block: "nearest" });
  feedback("Your signature is ready. Copy it, or download the HTML.");
});
form.addEventListener("input", () => {
  isExample = false;
  const { valid } = update();
  feedback(valid ? "Preview updated. Generate when you’re ready to use it." : "Complete your name and check any highlighted fields.");
});
form.addEventListener("change", () => { update(); });
$("resetButton").addEventListener("click", () => {
  form.reset();
  textFields.forEach(id => { $(id).value = ""; });
  approvedImage = ""; isExample = false;
  update(); feedback("Start fresh. Add your name to create a new signature.");
  $("fullName").focus();
});
function useExample() {
  form.reset(); approvedImage = ""; isExample = true;
  const example = { fullName: "Ayan Hassan", designation: "Cyber Security Intern", company: "NCCS - NED", pronouns: "he / him", email: "ayanh4ss4n@gmail.com", phone: "+92 340 8653826", website: "example.com", linkedin: "linkedin.com/in/ayanhassan-cyb" };
  textFields.forEach(id => { $(id).value = example[id] || ""; });
  update(); feedback("Example signature. Replace these details with your own.");
}
$("exampleButton").addEventListener("click", useExample);
$("closeDialog").addEventListener("click", () => $("manualCopyDialog").close());
$("selectManual").addEventListener("click", selectManual);
$("manualCopyDialog").addEventListener("close", () => { $("manualRich").replaceChildren(); $("manualSource").value = ""; });
document.querySelector('a[href="#install"]').addEventListener("click", () => { $("install").open = true; });
useExample();


