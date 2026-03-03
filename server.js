const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const MYBIB_BASE = "https://www.mybib.com/api/autocite";

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

app.post("/api/mybib/search", async (req, res) => {
  const { url, sourceId = "webpage" } = req.body || {};

  if (!url || !isValidHttpUrl(url)) {
    return res.status(400).json({ error: "Provide a valid http(s) URL in `url`." });
  }

  try {
    const params = new URLSearchParams({ q: url, sourceId });
    const response = await fetch(`${MYBIB_BASE}/search?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "MyBib search failed", details: data });
    }

    return res.json(data);
  } catch (error) {
    return res.status(502).json({ error: "Unable to reach MyBib search API", details: String(error) });
  }
});

app.post("/api/mybib/reference", async (req, res) => {
  const { metadata, sourceId = "webpage", styleId = "apa-7th-edition" } = req.body || {};

  if (!metadata || typeof metadata !== "object") {
    return res.status(400).json({ error: "Provide `metadata` object from search results." });
  }

  try {
    const response = await fetch(`${MYBIB_BASE}/reference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata, sourceId, styleId })
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "MyBib reference failed", details: data });
    }

    return res.json(data);
  } catch (error) {
    return res.status(502).json({ error: "Unable to reach MyBib reference API", details: String(error) });
  }
});

app.post("/api/mybib/apa-from-url", async (req, res) => {
  const { url, sourceId = "webpage", styleId = "apa-7th-edition", index = 0 } = req.body || {};

  if (!url || !isValidHttpUrl(url)) {
    return res.status(400).json({ error: "Provide a valid http(s) URL in `url`." });
  }

  try {
    const params = new URLSearchParams({ q: url, sourceId });
    const searchResponse = await fetch(`${MYBIB_BASE}/search?${params.toString()}`);
    const searchData = await searchResponse.json();

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
    const refData = await refResponse.json();

    if (!refResponse.ok) {
      return res.status(refResponse.status).json({ error: "MyBib reference failed", details: refData });
    }

    return res.json({ search: searchData, reference: refData });
  } catch (error) {
    return res.status(502).json({ error: "Unable to reach MyBib APIs", details: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`APA wrapper listening on http://localhost:${PORT}`);
});
