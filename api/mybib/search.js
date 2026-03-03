const { MYBIB_BASE, isValidHttpUrl, getJsonBody, rejectNonPost, safeReadJson } = require("./_utils");

module.exports = async function handler(req, res) {
  if (rejectNonPost(req, res)) return;

  const { query, url, sourceId = "webpage" } = getJsonBody(req);
  const normalizedQuery = (query || url || "").trim();

  if (!normalizedQuery) {
    return res.status(400).json({ error: "Provide a non-empty `query` value." });
  }

  if (sourceId === "webpage" && !isValidHttpUrl(normalizedQuery)) {
    return res.status(400).json({ error: "For `webpage`, provide a valid http(s) URL in `query`." });
  }

  try {
    const params = new URLSearchParams({ q: normalizedQuery, sourceId });
    const response = await fetch(`${MYBIB_BASE}/search?${params.toString()}`);
    const data = await safeReadJson(response);

    if (!response.ok) {
      return res.status(response.status).json({ error: "MyBib search failed", details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ error: "Unable to reach MyBib search API", details: String(error) });
  }
};
