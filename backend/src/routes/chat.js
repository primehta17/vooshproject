// backend/src/routes/chat.js

const express = require("express");
const router = express.Router();
const { embedText } = require("../services/embeddings");
const { queryVectors } = require("../services/vectorStore");
const { callGeminiStream } = require("../services/geminiClient");

router.post("/stream", async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res
      .status(400)
      .json({ error: "sessionId and message are required" });
  }

  // SSE setup
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  try {
    // 1) embed
    const embedding = await embedText(message);
    // 2) query vector store
    const passages = await queryVectors(embedding, 5);
    // build context
    const contextText = passages.map((p) => p.text).join("\n\n");
    const prompt = `You are an assistant. Use the following context to answer:\n\n${contextText}\n\nUser: ${message}\nAssistant:`;

    // 3) stream Gemini response
    await callGeminiStream(prompt, (chunk) => {
      // send SSE
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    });
    // when done
    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (err) {
    console.error("Error in /stream:", err);
    res.write(
      `event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`
    );
    res.end();
  }
});

module.exports = router;
