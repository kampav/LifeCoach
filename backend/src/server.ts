import Fastify from "fastify";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const fastify = Fastify({ logger: true });

// Initialize Google AI with local configuration keys
const getGenAI = (apiKey?: string) => {
  const key = apiKey || process.env.GEMINI_API_KEY || "";
  if (!key) throw new Error("API_KEY_MISSING");
  return new GoogleGenerativeAI(key);
};

// HEALTH CHECK
fastify.get("/health", async () => {
  return { status: "UP", timestamp: new Date().toISOString() };
});

// AI CALIBRATION ENDPOINT
fastify.post("/api/coach/brief", async (request, reply) => {
  const { todayLog, last7Days, mode, apiKey } = request.body as any;

  if (!todayLog || !mode) {
    return reply.status(400).send({ success: false, error: "Missing required daily telemetry fields." });
  }

  try {
    const ai = getGenAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build the coach prompt dynamically using shared formats
    const { buildCoachPrompt } = require("../../apps/mobile/src/shared/prompts");
    const prompt = buildCoachPrompt(todayLog, last7Days || [], mode);

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Invalid response format received from model engine.");
    }

    return { success: true, data: responseText };
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || "Internal Coach execution error." });
  }
});

// DUAL-MODE QUICK CHATBOT ENDPOINT
fastify.post("/api/chat/query", async (request, reply) => {
  const { message, history, todayLog, apiKey } = request.body as any;

  if (!message) {
    return reply.status(400).send({ success: false, error: "Message input is required." });
  }

  try {
    const ai = getGenAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { buildQuickQueryPrompt } = require("../../apps/mobile/src/shared/prompts");
    const prompt = buildQuickQueryPrompt(message, history || [], todayLog || null);

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();
    return { success: true, data: responseText.trim() };
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || "Internal chatbot connection error." });
  }
});

// START SERVER
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "8080");
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
