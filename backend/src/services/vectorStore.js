// backend/src/services/vectorStore.js

require("dotenv").config();
const { QdrantClient } = require("@qdrant/js-client-rest");

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION || "news_passages";

let client;

function initClient() {
  if (!client) {
    client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
    });
  }
  return client;
}

async function queryVectors(embedding, topK = 5) {
  if (!embedding) throw new Error("No embedding passed to queryVectors");
  const cli = initClient();

  // Optionally create the collection if not exists (skip in prod)
  await cli.ensureCollection(COLLECTION, {
    vector: { size: embedding.length, distance: "Cosine" },
  });

  const searchResult = await cli.search({
    collection_name: COLLECTION,
    vector: embedding,
    limit: topK,
    with_payload: true,
  });

  // searchResult.points or searchResult (depending on version)
  // map to a uniform object
  const results = searchResult.map((pt) => {
    return {
      id: pt.id,
      score: pt.score,
      text: (pt.payload && pt.payload.text) || "[no text]",
      metadata: (pt.payload && pt.payload.metadata) || {},
    };
  });
  return results;
}

async function upsertVectors(vectors) {
  // vectors: array of { id, vector: [...], payload: { text, metadata } }
  const cli = initClient();
  await cli.ensureCollection(COLLECTION, {
    vector: { size: vectors[0].vector.length, distance: "Cosine" },
  });
  await cli.upsert({
    collection_name: COLLECTION,
    points: vectors,
  });
}

module.exports = { queryVectors, upsertVectors };
