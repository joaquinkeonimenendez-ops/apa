const MYBIB_BASE = "https://www.mybib.com/api/autocite";

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getJsonBody(req) {
  if (!req || req.body == null) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function rejectNonPost(req, res) {
  if (req.method === "POST") return false;
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "Method not allowed. Use POST." });
  return true;
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return { error: "Invalid JSON response from upstream API" };
  }
}

module.exports = {
  MYBIB_BASE,
  isValidHttpUrl,
  getJsonBody,
  rejectNonPost,
  safeReadJson
};
