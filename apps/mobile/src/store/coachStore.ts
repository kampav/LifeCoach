import { create } from "zustand";
import type { DailyLog, DailyScores, DayMode, MentalState, UserProfile } from "../shared/types";
import { DatabaseService } from "../database/DatabaseService";
import { GeminiService } from "../services/GeminiService";

interface CoachState {
  todayLog: DailyLog;
  profile: UserProfile | null;
  streaks: { overall: number; health: number; mind: number; launchpad: number; innerCircle: number; engine: number; spirit: number } | null;
  loading: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  toggleMetric: (metricId: keyof DailyScores) => Promise<void>;
  setDayMode: (mode: DayMode) => Promise<void>;
  setMentalState: (state: MentalState) => Promise<void>;
  setRawDump: (dump: string) => void;
  saveProfile: (profile: Partial<UserProfile>) => Promise<void>;
  submitBrief: () => Promise<void>;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const defaultScores = (): DailyScores => ({
  health: 0, mind: 0, launchpad: 0, innerCircle: 0, engine: 0, spirit: 0
});

export const useCoachStore = create<CoachState>((set, get) => ({
  todayLog: {
    date: getTodayDateString(),
    scores: defaultScores(),
    mentalState: null,
    mode: "standard",
    rawDump: "",
    coachResponse: null,
    totalScore: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: null,
  },
  profile: null,
  streaks: null,
  loading: false,
  error: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const today = getTodayDateString();
      const profile = await DatabaseService.getProfile();
      let log = await DatabaseService.getDailyLog(today);
      if (!log) {
        log = {
          date: today,
          scores: defaultScores(),
          mentalState: null,
          mode: "standard",
          rawDump: "",
          coachResponse: null,
          totalScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncedAt: null
        };
      }
      const streaks = await DatabaseService.getStreaks();
      set({ profile, todayLog: log, streaks, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Init failed", loading: false });
    }
  },

  toggleMetric: async (metricId) => {
    const { todayLog } = get();
    const updatedScores = {
      ...todayLog.scores,
      [metricId]: todayLog.scores[metricId] === 1 ? 0 : 1
    };
    const nextLog = {
      ...todayLog,
      scores: updatedScores,
      totalScore: Object.values(updatedScores).reduce((a, b) => a + b, 0)
    };

    set({ todayLog: nextLog });
    await DatabaseService.saveDailyLog(nextLog);
    const streaks = await DatabaseService.getStreaks();
    set({ streaks });
  },

  setDayMode: async (mode) => {
    const { todayLog } = get();
    const nextLog = { ...todayLog, mode };
    set({ todayLog: nextLog });
    await DatabaseService.saveDailyLog(nextLog);
  },

  setMentalState: async (mentalState) => {
    const { todayLog } = get();
    const nextLog = { ...todayLog, mentalState };
    set({ todayLog: nextLog });
    await DatabaseService.saveDailyLog(nextLog);
  },

  setRawDump: (rawDump) => {
    set(state => ({
      todayLog: { ...state.todayLog, rawDump }
    }));
  },

  saveProfile: async (partialProfile) => {
    await DatabaseService.saveProfile(partialProfile);
    const profile = await DatabaseService.getProfile();
    set({ profile });
  },

  submitBrief: async () => {
    const { todayLog } = get();
    if (!todayLog.mentalState) {
      throw new Error("MENTAL_STATE_REQUIRED");
    }

    set({ loading: true, error: null });
    try {
      // Get last 7 days history logs
      const historyRange = await DatabaseService.getLogsRange(7);
      
      // Calculate and save response from AI Studio
      const response = await GeminiService.generateCalibration(todayLog, historyRange, todayLog.mode);
      
      const nextLog = {
        ...todayLog,
        coachResponse: response
      };
      
      await DatabaseService.saveDailyLog(nextLog);
      set({ todayLog: nextLog, loading: false });
    } catch (e: any) {
      set({ error: e.message || "Failed to brief coach", loading: false });
      throw e;
    }
  }
}));
