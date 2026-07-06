// packages/shared/prompts.ts - All Gemini prompt builders
import { METRICS } from "./metrics";
import type { DailyLog, DailyScores, DayMode, MentalState, ChatMessage } from "./types";

const SYSTEM_CONTEXT = `You are an aggressive, no-excuses AI Executive Coach and Lifestyle Systems Architect.

CLIENT PROFILE:
Age: 43. Target: Corporate tech exec to high-scale entrepreneur/CEO by age 50.
4 Macro-Pillars: Launchpad (Anti-Gravity business), Foundation (Health/Mind/Spirit), Inner Circle (Family), Engine (Investments/Travel).
Daily anchors: 04:50 AM wake-up, 20:30 PM brain-dump ritual.
Biggest threats: procrastination, optimization paralysis, doom-scrolling, schedule overload.
Core directive: Eliminate excuses. Identify patterns. Build deterministic execution habits.`;

export function buildCoachPrompt(
  today: DailyLog,
  last7Days: (DailyLog | null)[],
  mode: DayMode
): string {
  const score = Object.values(today.scores).reduce((a, b) => a + b, 0);
  const breakdown = METRICS.map(m =>
    `  - ${m.name} (${m.pillar}): ${today.scores[m.id as keyof DailyScores] === 1 ? "WIN" : "MISS"} -- "${m.definition}"`
  ).join("\n");

  const history = last7Days.map((log, i) => {
    if (!log) return `Day -${i + 1}: No data`;
    const t = Object.values(log.scores).reduce((a, b) => a + b, 0);
    return `${log.date} [${log.mode}, ${log.mentalState || "?"}, ${t}/6] ${METRICS.map(m => `${m.name}:${log.scores[m.id as keyof DailyScores]}`).join(" ")}`;
  }).join("\n");

  return `${SYSTEM_CONTEXT}

TODAY:
Date: ${today.date} | Day Type: ${mode.toUpperCase()} | Mental State: ${today.mentalState}
Score: ${score}/6

METRIC BREAKDOWN:
${breakdown}

RAW BRAIN DUMP: "${today.rawDump || "Nothing provided."}"

LAST 7 DAYS:
${history}

RESPONSE FORMAT (use EXACTLY these headers, no extra markdown):

## PSYCHOLOGICAL CALIBRATION

3-5 bullets. Direct. No softening. Name missed metrics explicitly. Identify patterns. Reference the 7-day trend.

## TOMORROW'S EXECUTION AGENDA

Time-blocked for a ${mode.toUpperCase()} DAY. ${mode === "standard" ? "Start 04:50, end 22:00." : "Start 05:00, compressed blocks."}
Max 3 [DEEP WORK] blocks. No meetings before 10:00 AM unless travel forces it.
Prioritize pillars with lowest scores. Include buffer + recovery.
Format: HH:MM -- Description [PILLAR TAG]

## MORNING PRIMING SCRIPT

60-second first-person script. Open with "I am." Reference today's score of ${score}/6. Name the single most critical action for tomorrow. Close with the age-50 CEO mission. No asterisks, no markdown, no stage directions. Plain prose only.`;
}

export function buildQuickQueryPrompt(
  message: string,
  recentHistory: ChatMessage[],
  todayLog: DailyLog | null
): string {
  const contextMessages = recentHistory.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const todayContext = todayLog
    ? `Today (${todayLog.date}): Score ${Object.values(todayLog.scores).reduce((a, b) => a + b, 0)}/6, Mental state: ${todayLog.mentalState}, Mode: ${todayLog.mode}`
    : "No data logged today yet.";

  return `${SYSTEM_CONTEXT}

TODAY CONTEXT: ${todayContext}

CONVERSATION HISTORY:
${contextMessages}

USER: ${message}

Respond as the executive coach. Be direct, specific, and actionable. 2-4 sentences max unless a detailed response is warranted. No fluff.`;
}
