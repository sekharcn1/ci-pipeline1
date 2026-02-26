const express = require("express");
const redis = require("redis");

const app = express();
const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

let redisClient;
let redisReady = false;

async function connectRedis() {
  try {
    redisClient = redis.createClient({ url: REDIS_URL });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err.message);
      redisReady = false;
    });

    redisClient.on("connect", () => {
      console.log("Connected to Redis");
      redisReady = true;
    });

    await redisClient.connect();
  } catch (err) {
    console.error("Redis connection failed:", err.message);
    redisReady = false;
  }
}

connectRedis();

app.get("/", async (req, res) => {
  try {
    let visits = "0";
    if (redisClient && redisReady) {
      visits = await redisClient.incr("visits");
    }
    res.json({
      message: "Hello from ci-pipeline app",
      redis: redisReady ? "connected" : "not connected",
      visits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: "healthy",
    redis: redisReady ? "connected" : "not connected"
  });
});

app.get("/stats", async (req, res) => {
  try {
    let visits = "0";
    if (redisClient && redisReady) {
      visits = await redisClient.get("visits");
    }
    res.json({
      app: "ci-pipeline",
      redis_url: REDIS_URL,
      visits: visits || "0"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});