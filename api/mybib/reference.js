const { MYBIB_BASE, getJsonBody, rejectNonPost, safeReadJson } = require("./_utils");

module.exports = async function handler(req, res) {
  if (rejectNonPost(req, res)) return;

  const { metadata, sourceId = "webpage", styleId = "apa-7th-edition" } = getJsonBody(req);

  if (!metadata || typeof metadata !== "object") {
    return res.status(400).json({ error: "Provide `metadata` object from search results." });
  }

  try {
    const response = await fetch(`${MYBIB_BASE}/reference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata, sourceId, styleId })
    });
    const data = await safeReadJson(response);

    if (!response.ok) {
      return res.status(response.status).json({ error: "MyBib reference failed", details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ error: "Unable to reach MyBib reference API", details: String(error) });
  }
};
