// packages/shared/types.ts - Single source of truth for all shared types

export type MetricId = 'health' | 'mind' | 'launchpad' | 'innerCircle' | 'engine' | 'spirit';
export type DayMode = 'standard' | 'travel';
export type MentalState = 'Locked In' | 'Drained' | 'Scattered' | 'Wired' | 'Flat';
export type SubscriptionTier = 'free' | 'pro' | 'ultra';

export interface MetricDefinition {
  id: MetricId; name: string; pillar: string; icon: string; color: string; definition: string;
}

export interface DailyScores { health: 0|1; mind: 0|1; launchpad: 0|1; innerCircle: 0|1; engine: 0|1; spirit: 0|1; }

export interface DailyLog {
  date: string; scores: DailyScores; mentalState: MentalState | null;
  mode: DayMode; rawDump: string; coachResponse: CoachResponse | null;
  totalScore: number; createdAt: string; updatedAt: string; syncedAt: string | null;
}

export interface CoachResponse {
  calibration: string; agenda: AgendaBlock[]; primingScript: string;
  generatedAt: string; modelUsed: string;
}

export interface AgendaBlock { time: string; description: string; tags: string[]; pillar: string; }

export interface ChatMessage { id: string; role: 'user'|'assistant'; content: string; timestamp: string; mode: 'coach'|'quick'; }

export interface StreakData { overall: number; health: number; mind: number; launchpad: number; innerCircle: number; engine: number; spirit: number; lastUpdated: string; }

export interface UserProfile {
  uid: string; email: string; displayName: string; photoURL: string | null;
  birthday: string | null; tier: SubscriptionTier; geminiApiKey: string | null;
  onboardedAt: string; settings: UserSettings;
}

export interface UserSettings {
  dailyReminderTime: string; morningWakeTime: string;
  enableHealthSync: boolean; enableGmailSync: boolean; enableDriveBackup: boolean;
}

export interface HeatmapDay { date: string; score: number; isToday: boolean; isFuture: boolean; }

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; code: string };
