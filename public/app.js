const searchForm = document.getElementById("search-form");
const queryInput = document.getElementById("query-input");
const sourceTabsEl = document.getElementById("source-tabs");
const queryLabelEl = document.getElementById("query-label");
const manualToggleBtn = document.getElementById("manual-toggle-btn");
const manualPanelEl = document.getElementById("manual-panel");
const manualTitleEl = document.getElementById("manual-title");
const manualFormEl = document.getElementById("manual-form");
const manualFieldsEl = document.getElementById("manual-fields");
const resultsPanelEl = document.getElementById("results-panel");
const resultsEl = document.getElementById("results");
const outputPanelEl = document.getElementById("output-panel");
const backToResultsBtn = document.getElementById("back-to-results");
const outputEl = document.getElementById("output");

let latestResults = [];
let currentSourceId = "webpage";
let manualMode = false;
let lastViewBeforeOutput = "results";

const SOURCE_CONFIG = {
  webpage: {
    label: "Webpage URL",
    placeholder: "https://example.com/article",
    manualTitle: "Website - Manual Entry"
  },
  book: {
    label: "Book Search",
    placeholder: "Book title, author, or ISBN",
    manualTitle: "Book - Manual Entry"
  },
  article_journal: {
    label: "Journal Article Search",
    placeholder: "Article title, DOI, or author",
    manualTitle: "Journal Article - Manual Entry"
  },
  video: {
    label: "Video Search",
    placeholder: "Video title, channel, or URL",
    manualTitle: "Video - Manual Entry"
  }
};

const MANUAL_FIELD_CONFIG = {
  webpage: [
    { type: "person", key: "author", label: "Webpage author" },
    { type: "person", key: "editor", label: "Editor" },
    { type: "date", key: "issued", label: "Date published" },
    { type: "text", key: "title", label: "Title of article or page" },
    { type: "text", key: "containerTitle", label: "Website name" },
    { type: "text", key: "publisher", label: "Publisher" },
    { type: "text", key: "url", label: "URL" },
    { type: "date", key: "accessed", label: "Date accessed/viewed" },
    { type: "textarea", key: "annote", label: "Annotation" }
  ],
  book: [
    { type: "person", key: "author", label: "Book author" },
    { type: "person", key: "editor", label: "Editor" },
    { type: "person", key: "translator", label: "Translator" },
    { type: "date", key: "issued", label: "Date published" },
    { type: "date", key: "originalDate", label: "Date originally published" },
    { type: "text", key: "title", label: "Title of book" },
    { type: "text", key: "edition", label: "Edition" },
    { type: "text", key: "volume", label: "Volume number" },
    { type: "text", key: "publisher", label: "Publisher" },
    { type: "text", key: "publisherPlace", label: "Publisher place" },
    { type: "text", key: "page", label: "Page range" },
    { type: "text", key: "url", label: "URL" },
    { type: "date", key: "accessed", label: "Date accessed/viewed" },
    { type: "text", key: "isbn", label: "ISBN" },
    { type: "textarea", key: "annote", label: "Annotation" }
  ],
  article_journal: [
    { type: "person", key: "author", label: "Article author" },
    { type: "person", key: "editor", label: "Editor" },
    { type: "date", key: "issued", label: "Date published" },
    { type: "text", key: "title", label: "Title of article" },
    { type: "text", key: "containerTitle", label: "Name of journal" },
    { type: "text", key: "volume", label: "Volume number" },
    { type: "text", key: "issue", label: "Issue number" },
    { type: "text", key: "page", label: "Page range" },
    { type: "text", key: "archive", label: "Database name" },
    { type: "text", key: "url", label: "URL" },
    { type: "date", key: "accessed", label: "Date accessed/viewed" },
    { type: "text", key: "doi", label: "DOI" },
    { type: "textarea", key: "annote", label: "Annotation" }
  ],
  video: [
    { type: "person", key: "author", label: "Video author" },
    { type: "person", key: "editor", label: "Editor" },
    { type: "text", key: "title", label: "Title of video" },
    { type: "date", key: "issued", label: "Date published" },
    { type: "text", key: "containerTitle", label: "Publisher" },
    { type: "text", key: "medium", label: "Format" },
    { type: "text", key: "url", label: "URL" },
    { type: "date", key: "accessed", label: "Date accessed/viewed" },
    { type: "textarea", key: "annote", label: "Annotation" }
  ]
};

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

function hideResultsPanel() {
  resultsPanelEl.classList.add("hidden");
}

function showResultsPanel() {
  resultsPanelEl.classList.remove("hidden");
}

function hideManualPanel() {
  if (!manualPanelEl) return;
  manualPanelEl.classList.add("hidden");
}

function showManualPanel() {
  if (!manualPanelEl) return;
  manualPanelEl.classList.remove("hidden");
}

function applySourceUi(sourceId) {
  currentSourceId = sourceId;
  const config = SOURCE_CONFIG[sourceId] || SOURCE_CONFIG.webpage;
  if (queryLabelEl) {
    queryLabelEl.textContent = config.label;
  }
  if (queryInput) {
    queryInput.placeholder = config.placeholder;
  }
  if (manualTitleEl) {
    manualTitleEl.textContent = config.manualTitle;
  }
  if (sourceTabsEl) {
    sourceTabsEl.querySelectorAll(".source-tab").forEach((btn) => {
      const isActive = btn.getAttribute("data-source") === sourceId;
      btn.classList.toggle("is-active", isActive);
    });
  }
  if (manualMode && manualFieldsEl) {
    renderManualFields(sourceId);
  }
}

function updateManualToggleButton() {
  if (!manualToggleBtn) return;
  manualToggleBtn.textContent = manualMode ? "Back to search mode" : "Or enter manually";
}

function buildPersonRowHtml(key) {
  return `
    <div class="person-row">
      <input type="text" name="manual_${key}_given" placeholder="First name(s)" />
      <input type="text" name="manual_${key}_family" placeholder="Last name" />
      <button type="button" class="person-remove-btn" data-person-remove="${key}" aria-label="Remove person">-</button>
    </div>
  `;
}

function syncPersonRemoveButtons(rowsEl) {
  const removeButtons = rowsEl.querySelectorAll(".person-remove-btn");
  const disableAll = removeButtons.length <= 1;
  removeButtons.forEach((btn) => {
    btn.disabled = disableAll;
  });
}

function renderManualFields(sourceId) {
  if (!manualFieldsEl) return;
  const fields = MANUAL_FIELD_CONFIG[sourceId] || [];
  manualFieldsEl.innerHTML = fields
    .map((field) => {
      if (field.type === "person") {
        return `
          <div class="manual-field">
            <label>${escapeHtml(field.label)}</label>
            <div class="person-rows" data-person-key="${field.key}">
              ${buildPersonRowHtml(field.key)}
            </div>
            <button type="button" class="person-add-btn" data-person-add="${field.key}">+ Add another person</button>
          </div>
        `;
      }

      if (field.type === "date") {
        return `
          <div class="manual-field">
            <label>${escapeHtml(field.label)}</label>
            <div class="date-inputs">
              <input type="number" name="manual_${field.key}_year" placeholder="YYYY" />
              <input type="number" name="manual_${field.key}_month" placeholder="MM" />
              <input type="number" name="manual_${field.key}_day" placeholder="DD" />
            </div>
          </div>
        `;
      }

      if (field.type === "textarea") {
        return `
          <div class="manual-field">
            <label>${escapeHtml(field.label)}</label>
            <textarea name="manual_${field.key}"></textarea>
          </div>
        `;
      }

      return `
        <div class="manual-field">
          <label>${escapeHtml(field.label)}</label>
          <input type="text" name="manual_${field.key}" />
        </div>
      `;
    })
    .join("");

  manualFieldsEl.querySelectorAll(".person-rows").forEach(syncPersonRemoveButtons);
}

function parseNullableInt(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function createBaseMetadata() {
  return {
    author: [],
    collectionEditor: [],
    composer: [],
    containerAuthor: [],
    director: [],
    editor: [],
    editorialDirector: [],
    illustrator: [],
    interviewer: [],
    originalAuthor: [],
    recipient: [],
    reviewedAuthor: [],
    translator: [],
    accessed: { year: null, month: null, day: null },
    eventDate: { year: null, month: null, day: null },
    issued: { year: null, month: null, day: null },
    originalDate: { year: null, month: null, day: null },
    submitted: { year: null, month: null, day: null },
    abstract: null,
    annote: null,
    archive: null,
    archiveLocation: null,
    archivePlace: null,
    authority: null,
    callNumber: null,
    citationLabel: null,
    citationNumber: null,
    collectionTitle: null,
    containerTitle: null,
    containerTitleShort: null,
    dimensions: null,
    doi: null,
    event: null,
    eventPlace: null,
    firstReferenceNoteNumber: null,
    genre: null,
    isbn: null,
    issn: null,
    jurisdiction: null,
    keyword: null,
    locator: null,
    medium: null,
    note: null,
    originalPublisher: null,
    originalPublisherPlace: null,
    originalTitle: null,
    page: null,
    pageFirst: null,
    pmcid: null,
    pmid: null,
    publisher: null,
    publisherPlace: null,
    references: null,
    reviewedTitle: null,
    scale: null,
    section: null,
    source: null,
    status: null,
    title: null,
    titleShort: null,
    url: null,
    version: null,
    yearSuffix: null,
    chapterNumber: null,
    collectionNumber: null,
    edition: null,
    issue: null,
    number: null,
    numberOfPages: null,
    numberOfVolumes: null,
    volume: null,
    rawStr: null
  };
}

function readManualText(formData, key) {
  const value = (formData.get(`manual_${key}`) || "").toString().trim();
  return value || null;
}

function readManualPerson(formData, key) {
  const givenValues = formData
    .getAll(`manual_${key}_given`)
    .map((value) => value.toString().trim());
  const familyValues = formData
    .getAll(`manual_${key}_family`)
    .map((value) => value.toString().trim());
  const count = Math.max(givenValues.length, familyValues.length);
  const people = [];

  for (let i = 0; i < count; i += 1) {
    const given = givenValues[i] || "";
    const family = familyValues[i] || "";
    if (!given && !family) continue;
    people.push({ given: given || null, family: family || null, literal: null });
  }

  return people;
}

function readManualDate(formData, key) {
  return {
    year: parseNullableInt((formData.get(`manual_${key}_year`) || "").toString().trim()),
    month: parseNullableInt((formData.get(`manual_${key}_month`) || "").toString().trim()),
    day: parseNullableInt((formData.get(`manual_${key}_day`) || "").toString().trim())
  };
}

function buildManualMetadata(sourceId, formData) {
  const metadata = createBaseMetadata();

  metadata.author = readManualPerson(formData, "author");
  metadata.editor = readManualPerson(formData, "editor");
  metadata.translator = readManualPerson(formData, "translator");
  metadata.issued = readManualDate(formData, "issued");
  metadata.accessed = readManualDate(formData, "accessed");
  metadata.originalDate = readManualDate(formData, "originalDate");

  [
    "title",
    "containerTitle",
    "publisher",
    "url",
    "annote",
    "edition",
    "volume",
    "publisherPlace",
    "page",
    "isbn",
    "issue",
    "archive",
    "doi",
    "medium"
  ].forEach((key) => {
    metadata[key] = readManualText(formData, key);
  });

  return metadata;
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

function copyRichHtmlLegacy(html) {
  const container = document.createElement("div");
  container.setAttribute("contenteditable", "true");
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.opacity = "0";
  container.innerHTML = html;
  document.body.appendChild(container);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);

  selection.removeAllRanges();
  selection.addRange(range);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  selection.removeAllRanges();
  document.body.removeChild(container);
  return copied;
}

function buildClipboardPayload(node, id) {
  if (!node) return { html: "", text: "" };

  const html = node.innerHTML?.trim() || "";
  const linkedHtml = linkifyUrlsInHtml(html);
  const clipboardHtml =
    id === "gdocs-reference-value" || id === "reference-value"
      ? `<div style="margin:0; line-height:200%;"><span style="display:block; padding-left:36pt; text-indent:-36pt;">${linkedHtml}</span></div>`
      : linkedHtml;

  const text = (node.innerText || node.textContent || "").trim();
  return { html: clipboardHtml, text };
}

function getSelectedCitationSurface() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (!anchorNode || !focusNode) return null;

  const anchorEl = anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement;
  const focusEl = focusNode.nodeType === Node.ELEMENT_NODE ? focusNode : focusNode.parentElement;
  if (!anchorEl || !focusEl) return null;

  const anchorSurface = anchorEl.closest(".citation-surface");
  const focusSurface = focusEl.closest(".citation-surface");
  if (!anchorSurface || anchorSurface !== focusSurface) return null;
  if (!outputEl.contains(anchorSurface)) return null;
  return anchorSurface;
}

async function copyNodeTextById(id, triggerButton) {
  const node = document.getElementById(id);
  if (!node) return;

  const { html: clipboardHtml, text: clipboardText } = buildClipboardPayload(node, id);
  if (!clipboardHtml) return;

  try {
    let copied = false;

    if (
      typeof ClipboardItem !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === "function"
    ) {
      const clipboardItemData = {
        "text/html": new Blob([clipboardHtml], { type: "text/html" })
      };
      if (clipboardText) {
        clipboardItemData["text/plain"] = new Blob([clipboardText], { type: "text/plain" });
      }
      const item = new ClipboardItem(clipboardItemData);
      await navigator.clipboard.write([item]);
      copied = true;
    }

    if (!copied) {
      copied = copyRichHtmlLegacy(clipboardHtml);
    }

    if (!copied) {
      throw new Error("Copy failed");
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

  showResultsPanel();
  resultsEl.classList.remove("empty");
  resultsEl.innerHTML = results
    .map((item, index) => {
      const md = item.metadata || {};
      const authors = Array.isArray(md.author) ? md.author.map(parseAuthor).join(", ") : "Unknown Author";
      const title = md.title || "(No title)";
      const sourceText = md.containerTitle || md.publisher || md.url || "";
      const year = md.issued?.year || "n.d.";
      return `
        <article class="result-item">
          <h3>${escapeHtml(title)}</h3>
          <p><strong>Author(s):</strong> ${escapeHtml(authors)}</p>
          <p><strong>Source:</strong> ${escapeHtml(sourceText)}</p>
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
    lastViewBeforeOutput = "results";
    hideResultsPanel();
    hideManualPanel();
    showOutputPanel();
    setOutputMessage("Selected result does not include metadata.");
    return;
  }

  lastViewBeforeOutput = "results";
  hideResultsPanel();
  hideManualPanel();
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

    renderReferenceOutput(data.result || {});
  } catch (error) {
    setOutputMessage(error.message || "Unable to generate citation.");
  }
}

function renderReferenceOutput(result) {
  const reference = result.formattedReferenceStr || "No formatted reference returned.";
  const referenceLinked = linkifyUrlsInHtml(reference);

  outputEl.classList.remove("empty");
  outputEl.innerHTML = `
    <div class="citation-block">
      <h3>Google Docs Ready APA Citation</h3>
      <div
        class="citation-copy-box"
        style="border:2px dashed #94a3b8;border-radius:10px;background:#fff;padding:10px 12px;margin-bottom:12px;box-shadow:0 2px 8px rgba(15,23,42,.08);"
      >
        <div id="gdocs-reference-value" class="reference-preview citation-value citation-surface">${referenceLinked}</div>
      </div>
      <div class="citation-actions">
        <button type="button" class="copy-btn" data-copy-target="gdocs-reference-value">Copy</button>
      </div>
    </div>
  `;
}

async function generateManualReference() {
  if (!manualFormEl) return;
  const formData = new FormData(manualFormEl);
  const metadata = buildManualMetadata(currentSourceId, formData);

  lastViewBeforeOutput = "manual";
  hideManualPanel();
  hideResultsPanel();
  showOutputPanel();
  setOutputMessage("Generating citation...");

  try {
    const response = await fetch("/api/mybib/reference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metadata,
        sourceId: currentSourceId,
        styleId: "apa-7th-edition"
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Manual reference request failed");
    }

    renderReferenceOutput(data.result || {});
  } catch (error) {
    setOutputMessage(error.message || "Unable to generate citation.");
  }
}

if (searchForm) {
  searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = queryInput.value.trim();
  const sourceId = currentSourceId;
  if (!query) return;

  manualMode = false;
  updateManualToggleButton();
  hideManualPanel();
  setResultsMessage("Searching...");
  showResultsPanel();
  hideOutputPanel();

  try {
    const response = await fetch("/api/mybib/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, sourceId })
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
}

if (resultsEl) {
  resultsEl.addEventListener("click", (event) => {
  const btn = event.target.closest(".generate-btn");
  if (!btn) return;

  const index = Number(btn.getAttribute("data-index"));
  if (Number.isNaN(index)) return;
  generateReferenceFromIndex(index);
});
}

if (outputEl) {
  outputEl.addEventListener("click", (event) => {
  const btn = event.target.closest(".copy-btn");
  if (!btn) return;

  const targetId = btn.getAttribute("data-copy-target");
  if (!targetId) return;
  copyNodeTextById(targetId, btn);
});
}

if (outputEl) {
  outputEl.addEventListener("copy", (event) => {
  const surface = getSelectedCitationSurface();
  if (!surface) return;

  const { html, text } = buildClipboardPayload(surface, surface.id || "");
  if (!html) return;

  if (event.clipboardData) {
    event.preventDefault();
    event.clipboardData.setData("text/html", html);
    if (text) {
      event.clipboardData.setData("text/plain", text);
    }
  }
});
}

if (manualFieldsEl) {
  manualFieldsEl.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-person-add]");
    if (addBtn) {
      const key = addBtn.getAttribute("data-person-add");
      if (!key) return;
      const rowsEl = manualFieldsEl.querySelector(`.person-rows[data-person-key="${key}"]`);
      if (!rowsEl) return;
      rowsEl.insertAdjacentHTML("beforeend", buildPersonRowHtml(key));
      syncPersonRemoveButtons(rowsEl);
      return;
    }

    const removeBtn = event.target.closest("[data-person-remove]");
    if (removeBtn) {
      const key = removeBtn.getAttribute("data-person-remove");
      if (!key) return;
      const rowsEl = manualFieldsEl.querySelector(`.person-rows[data-person-key="${key}"]`);
      const row = removeBtn.closest(".person-row");
      if (!rowsEl || !row) return;
      if (rowsEl.querySelectorAll(".person-row").length <= 1) return;
      row.remove();
      syncPersonRemoveButtons(rowsEl);
    }
  });
}

if (sourceTabsEl) {
  sourceTabsEl.addEventListener("click", (event) => {
  const btn = event.target.closest(".source-tab");
  if (!btn) return;
  const sourceId = btn.getAttribute("data-source");
  if (!sourceId) return;
  latestResults = [];
  setResultsMessage("No results yet.");
  hideOutputPanel();
  if (manualMode) {
    hideResultsPanel();
    showManualPanel();
  } else {
    showResultsPanel();
    hideManualPanel();
  }
  applySourceUi(sourceId);
});
}

if (backToResultsBtn) {
  backToResultsBtn.addEventListener("click", () => {
  hideOutputPanel();
  if (lastViewBeforeOutput === "manual") {
    showManualPanel();
    hideResultsPanel();
  } else {
    hideManualPanel();
    showResultsPanel();
  }
});
}

if (manualToggleBtn) {
  manualToggleBtn.addEventListener("click", () => {
    manualMode = !manualMode;
    updateManualToggleButton();

    if (manualMode) {
      renderManualFields(currentSourceId);
      hideResultsPanel();
      hideOutputPanel();
      showManualPanel();
    } else {
      hideManualPanel();
      hideOutputPanel();
      showResultsPanel();
    }
  });
}

if (manualFormEl) {
  manualFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    await generateManualReference();
  });
}

applySourceUi(currentSourceId);
updateManualToggleButton();
