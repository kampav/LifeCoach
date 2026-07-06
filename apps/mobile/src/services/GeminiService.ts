import type { DailyLog, DailyScores, DayMode, MentalState, ChatMessage, CoachResponse } from "../shared/types";
import { buildCoachPrompt, buildQuickQueryPrompt } from "../shared/prompts";

export class GeminiService {
  private static async getApiKey(): Promise<string> {
    // Dynamic import to avoid static cycle issues with DatabaseService loading
    const { DatabaseService } = require("../database/DatabaseService");
    const profile = await DatabaseService.getProfile();
    const key = profile?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
    if (!key) {
      throw new Error("API_KEY_MISSING");
    }
    return key;
  }

  static async generateCalibration(today: DailyLog, last7Days: (DailyLog | null)[], mode: DayMode): Promise<CoachResponse> {
    const key = await this.getApiKey();
    const prompt = buildCoachPrompt(today, last7Days, mode);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.88,
          maxOutputTokens: 2400,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response returned from Gemini.");
    }

    return this.parseCoachResponse(text);
  }

  static async askQuickQuery(message: string, history: ChatMessage[], todayLog: DailyLog | null): Promise<string> {
    const key = await this.getApiKey();
    const prompt = buildQuickQueryPrompt(message, history, todayLog);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response returned from Gemini.");
    }

    return text.trim();
  }

  private static parseCoachResponse(rawText: string): CoachResponse {
    const calibrationRegex = /##\s*PSYCHOLOGICAL\s+CALIBRATION\s*([\s\S]*?)(?=##\s*TOMORROW|$)/i;
    const agendaRegex = /##\s*TOMORROW'S\s+EXECUTION\s+AGENDA\s*([\s\S]*?)(?=##\s*MORNING|$)/i;
    const scriptRegex = /##\s*MORNING\s+PRIMING\s+SCRIPT\s*([\s\S]*?)$/i;

    const calMatch = rawText.match(calibrationRegex);
    const agMatch = rawText.match(agendaRegex);
    const scrMatch = rawText.match(scriptRegex);

    const calibration = calMatch ? calMatch[1].trim() : "Calibration matching parse failed. See raw logs.";
    const rawAgenda = agMatch ? agMatch[1].trim() : "";
    const primingScript = scrMatch ? scrMatch[1].trim() : "Priming script matching parse failed.";

    // Parse unstructured schedule string into items
    const agenda = rawAgenda.split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        // Matches "HH:MM -- Description [PILLAR]" or "HH:MM - Description [PILLAR]"
        const cleanLine = line.replace(/^[-*]\s*/, "");
        const match = cleanLine.match(/^(\d{1,2}:\d{2}(?:\s*[-\u2013\u2014]\s*\d{1,2}:\d{2})?)\s*[\u2014\u2013\-]+\s*(.*)/);
        
        if (match) {
          const [, time, rest] = match;
          const tags: string[] = [];
          const description = rest.replace(/\[([^\]]+)\]/g, (_, tag) => {
            tags.push(tag.trim());
            return "";
          }).trim();
          
          return {
            time,
            description,
            tags,
            pillar: tags[0] || "General"
          };
        }
        return {
          time: "00:00",
          description: cleanLine,
          tags: [],
          pillar: "General"
        };
      });

    return {
      calibration,
      agenda,
      primingScript,
      generatedAt: new Date().toISOString(),
      modelUsed: "gemini-2.5-flash"
    };
  }
}
