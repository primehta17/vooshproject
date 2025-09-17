// backend/src/services/embeddings.js

require("dotenv").config();
const fetch = require("node-fetch");

const JINA_API_URL = process.env.JINA_EMBEDDINGS_API_URL;
const JINA_API_KEY = process.env.JINA_API_KEY;

async function embedText(text) {
  if (!text) throw new Error("No text provided for embedding");

  // For testing: return a random mock embedding (e.g. length 768)
  if (!JINA_API_URL) {
    console.warn("JINA_API_URL not set — returning mock embedding");
    // mock: vector of zeros
    return Array(768).fill(0);
  }

  const body = {
    model: process.env.JINA_MODEL || "jina-embeddings-v2-base-en",
    input: text,
  };

  const resp = await fetch(`${JINA_API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JINA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Jina embedding error: ${resp.status} ${errText}`);
  }

  const data = await resp.json();

  // Adjust based on actual API response shape
  if (data.embedding) return data.embedding;
  if (data.embeddings && data.embeddings.length > 0) return data.embeddings[0];
  if (data.results && data.results[0] && data.results[0].embedding)
    return data.results[0].embedding;

  throw new Error("Unexpected embedding API response format");
}

module.exports = { embedText };
