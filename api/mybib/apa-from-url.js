const { MYBIB_BASE, isValidHttpUrl, getJsonBody, rejectNonPost, safeReadJson } = require("./_utils");

module.exports = async function handler(req, res) {
  if (rejectNonPost(req, res)) return;

  const { url, sourceId = "webpage", styleId = "apa-7th-edition", index = 0 } = getJsonBody(req);

  if (!url || !isValidHttpUrl(url)) {
    return res.status(400).json({ error: "Provide a valid http(s) URL in `url`." });
  }

  try {
    const params = new URLSearchParams({ q: url, sourceId });
    const searchResponse = await fetch(`${MYBIB_BASE}/search?${params.toString()}`);
    const searchData = await safeReadJson(searchResponse);

    if (!searchResponse.ok) {
      return res.status(searchResponse.status).json({ error: "MyBib search failed", details: searchData });
    }

    const results = Array.isArray(searchData.results) ? searchData.results : [];
    const selected = results[index];

    if (!selected?.metadata) {
      return res.status(404).json({ error: "No search result metadata found for this URL", search: searchData });
    }

    const refResponse = await fetch(`${MYBIB_BASE}/reference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata: selected.metadata, sourceId, styleId })
    });
    const refData = await safeReadJson(refResponse);

    if (!refResponse.ok) {
      return res.status(refResponse.status).json({ error: "MyBib reference failed", details: refData });
    }

    return res.status(200).json({ search: searchData, reference: refData });
  } catch (error) {
    return res.status(502).json({ error: "Unable to reach MyBib APIs", details: String(error) });
  }
};
