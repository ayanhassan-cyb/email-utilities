const byId = id => document.getElementById(id);
const analyzeButton = byId("analyzeButton");
const form = byId("inspectionForm");
let activeRequest = null;
let requestVersion = 0;
let hasReport = false;

// These are presentation groups only. The backend owns every check and the score.
const groups = [
    { key: "critical", severity: "error", empty: "No critical issues detected." },
    { key: "warning", severity: "warning", empty: "No warnings detected." },
    { key: "passed", severity: "success", empty: "No passed checks were reported." },
    { key: "info", severity: "info", empty: "No additional notes." }
];
const resetIds = [
    "score", "scoreTitle", "scoreDescription", "criticalCount", "warningCount", "passedCount",
    "findingTotal", "reportIntro", "recommendationCount", "recommendationsList",
    ...groups.flatMap(group => [group.key + "GroupCount", group.key + "List"])
];
// Only our initial, trusted template markup is kept here; email HTML is never mounted.
const initialMarkup = new Map(resetIds.map(id => [id, byId(id).innerHTML]));

function setState(text, state = "") {
    byId("inspectionState").textContent = text;
    byId("inspectionState").dataset.state = state;
}
function setLoading(loading) {
    analyzeButton.disabled = loading;
    analyzeButton.firstElementChild.textContent = loading ? "Inspecting…" : "Run inspection";
    byId("results").setAttribute("aria-busy", String(loading));
}
function resetReport(state = "Awaiting inspection") {
    requestVersion += 1;
    if (activeRequest) activeRequest.abort();
    activeRequest = null;
    hasReport = false;
    setLoading(false);
    initialMarkup.forEach((markup, id) => { byId(id).innerHTML = markup; });
    byId("scoreArc").setAttribute("stroke-dashoffset", "100");
    byId("scoreGauge").style.removeProperty("color");
    byId("stats").hidden = true;
    byId("reportIntro").hidden = false;
    byId("infoGroup").hidden = true;
    byId("criticalGroup").open = true;
    byId("warningGroup").open = true;
    byId("passedGroup").open = false;
    byId("requestError").hidden = true;
    setState(state, state === "Source changed · Run again" ? "stale" : "");
    byId("announcement").textContent = state;
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    if (activeRequest) return;
    const subject = byId("subject").value;
    const html = byId("emailHtml").value;
    resetReport();
    const version = requestVersion;
    const controller = new AbortController();
    activeRequest = controller;
    setLoading(true);
    setState("Inspection in progress");
    byId("announcement").textContent = "Inspecting your email.";
    try {
        // Preserve the original endpoint, method, field names and unmodified input values.
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, html }),
            signal: controller.signal
        });
        if (!response.ok) throw new Error("Inspection request failed");
        const data = await response.json();
        if (version !== requestVersion) return;
        displayResults(data);
    } catch (error) {
        if (error.name === "AbortError" || version !== requestVersion) return;
        setState("Inspection unavailable");
        byId("requestError").textContent = "The inspection could not be completed. Check that the server is running, then try again. Your email is still in the editor.";
        byId("requestError").hidden = false;
        byId("announcement").textContent = "Inspection failed. Please try again.";
    } finally {
        if (version === requestVersion) {
            activeRequest = null;
            setLoading(false);
        }
    }
});

function textElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function displayResults(data) {
    // Render the returned score verbatim. Never recompute deductions in the frontend.
    byId("score").textContent = data.score;
    byId("scoreArc").setAttribute("stroke-dashoffset", String(100 - data.score));
    const grouped = {
        critical: data.results.filter(result => result.severity === "error"),
        warning: data.results.filter(result => result.severity === "warning"),
        passed: data.results.filter(result => result.severity === "success"),
        // Preserve informational findings separately; they are not passes or warnings.
        info: data.results.filter(result => !["error", "warning", "success"].includes(result.severity))
    };
    groups.forEach(group => {
        const findings = grouped[group.key];
        const count = byId(group.key + "Count");
        if (count) count.textContent = findings.length;
        byId(group.key + "GroupCount").textContent = findings.length;
        const list = byId(group.key + "List");
        list.replaceChildren();
        if (!findings.length) {
            list.append(textElement("p", "empty-group", group.empty));
        } else {
            findings.forEach(result => {
                const item = document.createElement("div");
                item.className = "result-item";
                item.append(textElement("strong", "", result.category));
                item.append(textElement("p", "", result.message));
                list.append(item);
            });
        }
    });
    byId("criticalGroup").open = true;
    byId("warningGroup").open = true;
    byId("passedGroup").open = !grouped.critical.length && !grouped.warning.length;
    byId("infoGroup").hidden = !grouped.info.length;
    byId("infoGroup").open = true;

    const stats = data.stats;
    byId("linksStat").textContent = stats.links || 0;
    byId("imagesStat").textContent = stats.images || 0;
    // The empty-body response omits stats; keep its visible issue total consistent with its findings.
    byId("issuesStat").textContent = stats.issues ?? (grouped.critical.length + grouped.warning.length);
    byId("sizeStat").textContent = (stats.html_size_kb || 0) + " KB";
    byId("stats").hidden = false;
    byId("reportIntro").hidden = true;
    byId("findingTotal").textContent = data.results.length + " findings";
    const critical = grouped.critical.length;
    const warnings = grouped.warning.length;
    byId("scoreGauge").style.color = critical ? "var(--critical)" : warnings ? "var(--warning)" : "var(--passed)";
    byId("scoreTitle").textContent = critical ? "Resolve critical issues before sending." :
        warnings ? "A few details need your attention." : "No issues detected.";
    byId("scoreDescription").textContent = critical ?
        "Start with critical findings, then review warnings and the recommended next steps." :
        warnings ? "Review the flagged checks below and apply the recommendations relevant to your email." :
        "Your email passed the reported checks. Complete a final review in your target email clients.";
    renderRecommendations([...grouped.critical, ...grouped.warning]);
    hasReport = true;
    setState("Inspection complete", "complete");
    byId("announcement").textContent = "Inspection complete. Score " + data.score + " out of 100. " +
        critical + " critical issues, " + warnings + " warnings, and " + grouped.passed.length + " passed checks.";
}

// Editorial guidance for categories already returned by the backend.
// This never inspects the source, adds findings, changes severities, or affects scoring.
const recommendationCopy = {
    Subject: {
        error: "Add a clear subject line that describes the email, then run the inspection again.",
        warning: "Review the flagged subject details. Keep the subject concise and use restrained punctuation and capitalization."
    },
    Content: {
        error: "Add the email body HTML, then run the inspection again.",
        warning: "Review the flagged wording in context. Use clear, specific language and avoid exaggerated claims."
    },
    Security: { all: "Remove the reported script tags or JavaScript URLs. Use ordinary links for actions in the email." },
    Compatibility: { all: "Review the reported elements and provide email-compatible alternatives, such as a static image or a link to a web page. Test in your target clients." },
    Links: { all: "Review the flagged links. Replace empty or placeholder destinations and use HTTPS where available." },
    Accessibility: { all: "Add descriptive alt text to informative images. Use an empty alt attribute for purely decorative images." },
    Images: { all: "Set appropriate width and height attributes on the flagged images to reserve their intended space." },
    "Email Design": { all: "Add a short preheader with a class containing “preheader” so this check can identify the inbox preview text." },
    Size: { all: "Reduce unnecessary HTML and repeated markup to bring the email below the reported size threshold. Recheck the final email." }
};
function renderRecommendations(findings) {
    const list = byId("recommendationsList");
    list.replaceChildren();
    const seen = new Set();
    const items = findings.filter(result => {
        const key = result.severity + ":" + result.category;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    byId("recommendationCount").textContent = items.length + (items.length === 1 ? " action" : " actions");
    if (!items.length) {
        list.append(textElement("p", "recommendations-empty", "No fixes recommended by these checks. Preview your final email in the clients your recipients use."));
        return;
    }
    items.forEach((result, index) => {
        const critical = result.severity === "error";
        const item = document.createElement("article");
        item.className = "recommendation " + (critical ? "critical" : "warning");
        item.append(textElement("span", "recommendation-number", String(index + 1).padStart(2, "0")));
        const content = document.createElement("div");
        content.className = "recommendation-content";
        const heading = document.createElement("div");
        heading.className = "recommendation-header";
        heading.append(textElement("h3", "", result.category));
        heading.append(textElement("span", "recommendation-priority", critical ? "Resolve first" : "Review"));
        const copy = Object.hasOwn(recommendationCopy, result.category) ? recommendationCopy[result.category] : {};
        content.append(heading, textElement("p", "", copy[result.severity] || copy.all || "Review the related finding and address it before running another inspection."));
        item.append(content);
        list.append(item);
    });
}

[byId("subject"), byId("emailHtml")].forEach(input => {
    input.addEventListener("input", () => {
        if (hasReport || activeRequest) resetReport("Source changed · Run again");
        byId("requestError").hidden = true;
    });
});
byId("clearButton").addEventListener("click", () => {
    form.reset();
    resetReport();
    byId("subject").focus();
});
byId("sampleButton").addEventListener("click", () => {
    resetReport("Example loaded");
    byId("subject").value = "Your September update";
    byId("emailHtml").value = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<body>',
        '  <div class="preheader" style="display:none;">Here is what is new this month.</div>',
        '  <table role="presentation" width="600">',
        '    <tr><td>',
        '      <img src="https://example.com/header.jpg" width="600">',
        '      <h1>Your September update</h1>',
        '      <p>Explore the latest news from our team.</p>',
        '      <a href="#">Read the update</a>',
        '      <p><a href="https://example.com/preferences">Email preferences</a></p>',
        '    </td></tr>',
        '  </table>',
        '</body>',
        '</html>'
    ].join("\n");
    byId("subject").focus();
});
document.querySelectorAll(".count-card").forEach(link => {
    link.addEventListener("click", () => {
        const group = document.querySelector(link.getAttribute("href"));
        group.open = true;
        group.querySelector("summary").focus({ preventScroll: true });
    });
});

