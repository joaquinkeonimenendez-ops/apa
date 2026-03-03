const searchForm = document.getElementById("search-form");
const urlInput = document.getElementById("url-input");
const resultsEl = document.getElementById("results");
const outputPanelEl = document.getElementById("output-panel");
const outputEl = document.getElementById("output");

let latestResults = [];

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setResultsMessage(message) {
  resultsEl.classList.add("empty");
  resultsEl.innerHTML = `<p>${escapeHtml(message)}</p>`;
}

function setOutputMessage(message) {
  outputEl.classList.add("empty");
  outputEl.innerHTML = `<p>${escapeHtml(message)}</p>`;
}

function hideOutputPanel() {
  outputPanelEl.classList.add("hidden");
}

function showOutputPanel() {
  outputPanelEl.classList.remove("hidden");
}

function linkifyUrlsInHtml(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  const textNodes = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    textNodes.push(current);
    current = walker.nextNode();
  }

  const urlRegex = /(https?:\/\/[^\s<]+)/g;

  textNodes.forEach((node) => {
    if (node.parentElement && node.parentElement.closest("a")) return;

    const text = node.nodeValue || "";
    if (!urlRegex.test(text)) return;

    urlRegex.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match = urlRegex.exec(text);

    while (match) {
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const url = match[0];
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.textContent = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      frag.appendChild(anchor);

      lastIndex = match.index + url.length;
      match = urlRegex.exec(text);
    }

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.parentNode.replaceChild(frag, node);
  });

  return container.innerHTML;
}

async function copyNodeTextById(id, triggerButton) {
  const node = document.getElementById(id);
  if (!node) return;

  const text = node.textContent?.trim() || "";
  const html = node.innerHTML?.trim() || "";
  const linkedHtml = linkifyUrlsInHtml(html);
  const clipboardHtml =
    id === "gdocs-reference-value" || id === "reference-value"
      ? `<div style="margin:0; line-height:200%;"><span style="display:block; padding-left:36pt; text-indent:-36pt;">${linkedHtml}</span></div>`
      : linkedHtml;
  if (!text) return;

  try {
    if (window.ClipboardItem && clipboardHtml) {
      const item = new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([clipboardHtml], { type: "text/html" })
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(text);
    }

    const original = triggerButton.textContent;
    triggerButton.textContent = "Copied";
    setTimeout(() => {
      triggerButton.textContent = original;
    }, 1200);
  } catch {
    triggerButton.textContent = "Copy failed";
    setTimeout(() => {
      triggerButton.textContent = "Copy";
    }, 1200);
  }
}

function parseAuthor(author = {}) {
  if (author.literal) return author.literal;
  const given = author.given || "";
  const family = author.family || "";
  return `${given} ${family}`.trim() || "Unknown Author";
}

function renderResults(results) {
  if (!results.length) {
    setResultsMessage("No matches returned.");
    return;
  }

  resultsEl.classList.remove("empty");
  resultsEl.innerHTML = results
    .map((item, index) => {
      const md = item.metadata || {};
      const authors = Array.isArray(md.author) ? md.author.map(parseAuthor).join(", ") : "Unknown Author";
      const title = md.title || "(No title)";
      const website = md.containerTitle || md.url || "";
      const year = md.issued?.year || "n.d.";
      return `
        <article class="result-item">
          <h3>${escapeHtml(title)}</h3>
          <p><strong>Author(s):</strong> ${escapeHtml(authors)}</p>
          <p><strong>Site:</strong> ${escapeHtml(website)}</p>
          <p><strong>Year:</strong> ${escapeHtml(String(year))}</p>
          <button type="button" data-index="${index}" class="generate-btn">Generate APA</button>
        </article>
      `;
    })
    .join("");
}

async function generateReferenceFromIndex(index) {
  const selected = latestResults[index];
  if (!selected?.metadata) {
    showOutputPanel();
    setOutputMessage("Selected result does not include metadata.");
    return;
  }

  showOutputPanel();
  setOutputMessage("Generating citation...");

  try {
    const response = await fetch("/api/mybib/reference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metadata: selected.metadata,
        sourceId: selected.sourceId || "webpage",
        styleId: "apa-7th-edition"
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Reference request failed");
    }

    const result = data.result || {};
    const reference = result.formattedReferenceStr || "No formatted reference returned.";
    const inText = result.formattedInTextCitationStr || "No in-text citation returned.";
    const referenceLinked = linkifyUrlsInHtml(reference);
    const inTextLinked = linkifyUrlsInHtml(inText);

    outputEl.classList.remove("empty");
    outputEl.innerHTML = `
      <div class="citation-block">
        <h3>APA Citation</h3>
        <div id="apa-reference-value" class="citation-value">${referenceLinked}</div>
      </div>
      <div class="citation-block">
        <h3>Google Docs Ready APA Citation</h3>
        <div id="gdocs-reference-value" class="reference-preview citation-value">${referenceLinked}</div>
        <div class="citation-actions">
          <button type="button" class="copy-btn" data-copy-target="gdocs-reference-value">Copy</button>
        </div>
      </div>
      <div class="citation-block">
        <h3>In-text Citation</h3>
        <div id="intext-value" class="citation-value">${inTextLinked}</div>
        <div class="citation-actions">
          <button type="button" class="copy-btn" data-copy-target="intext-value">Copy</button>
        </div>
      </div>
    `;
  } catch (error) {
    setOutputMessage(error.message || "Unable to generate citation.");
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();
  if (!url) return;

  setResultsMessage("Searching...");
  hideOutputPanel();

  try {
    const response = await fetch("/api/mybib/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, sourceId: "webpage" })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Search request failed");
    }

    latestResults = Array.isArray(data.results) ? data.results : [];
    renderResults(latestResults);
  } catch (error) {
    latestResults = [];
    setResultsMessage(error.message || "Unable to search for URL.");
  }
});

resultsEl.addEventListener("click", (event) => {
  const btn = event.target.closest(".generate-btn");
  if (!btn) return;

  const index = Number(btn.getAttribute("data-index"));
  if (Number.isNaN(index)) return;
  generateReferenceFromIndex(index);
});

outputEl.addEventListener("click", (event) => {
  const btn = event.target.closest(".copy-btn");
  if (!btn) return;

  const targetId = btn.getAttribute("data-copy-target");
  if (!targetId) return;
  copyNodeTextById(targetId, btn);
});
