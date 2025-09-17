// backend/src/server.js

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { initRedis } = require("./cache/redisClient");
const chatRouter = require("./routes/chat");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

initRedis()
  .then(() => {
    app.use("/api/chat", chatRouter);

    app.listen(PORT, () => {
      console.log(`Backend server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init redis:", err);
  });
