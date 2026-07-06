"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const generative_ai_1 = require("@google/generative-ai");
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({ logger: true });
// Initialize Google AI with local configuration keys
const getGenAI = (apiKey) => {
    const key = apiKey || process.env.GEMINI_API_KEY || "";
    if (!key)
        throw new Error("API_KEY_MISSING");
    return new generative_ai_1.GoogleGenerativeAI(key);
};
// HEALTH CHECK
fastify.get("/health", async () => {
    return { status: "UP", timestamp: new Date().toISOString() };
});
// AI CALIBRATION ENDPOINT
fastify.post("/api/coach/brief", async (request, reply) => {
    const { todayLog, last7Days, mode, apiKey } = request.body;
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
    }
    catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ success: false, error: error.message || "Internal Coach execution error." });
    }
});
// DUAL-MODE QUICK CHATBOT ENDPOINT
fastify.post("/api/chat/query", async (request, reply) => {
    const { message, history, todayLog, apiKey } = request.body;
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
    }
    catch (error) {
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
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
