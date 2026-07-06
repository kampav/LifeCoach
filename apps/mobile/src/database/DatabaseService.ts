import type { DailyLog, DailyScores, DayMode, MentalState, UserProfile } from "../shared/types";
import { getDatabase } from "./schema";

export class DatabaseService {
  // DAILY LOGS
  static async saveDailyLog(log: Omit<DailyLog, "totalScore"|"createdAt"|"updatedAt"|"syncedAt">): Promise<void> {
    const db = await getDatabase();
    const score = Object.values(log.scores).reduce((a, b) => a + b, 0);
    const dateStr = log.date;

    await db.runAsync(
      `INSERT INTO daily_logs (
        date, health, mind, launchpad, inner_circle, engine, spirit, 
        total_score, mental_state, mode, raw_dump, coach_response, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(date) DO UPDATE SET
        health=excluded.health,
        mind=excluded.mind,
        launchpad=excluded.launchpad,
        inner_circle=excluded.inner_circle,
        engine=excluded.engine,
        spirit=excluded.spirit,
        total_score=excluded.total_score,
        mental_state=excluded.mental_state,
        mode=excluded.mode,
        raw_dump=excluded.raw_dump,
        coach_response=coalesce(excluded.coach_response, daily_logs.coach_response),
        updated_at=datetime('now')`,
      [
        dateStr,
        log.scores.health,
        log.scores.mind,
        log.scores.launchpad,
        log.scores.innerCircle,
        log.scores.engine,
        log.scores.spirit,
        score,
        log.mentalState,
        log.mode,
        log.rawDump,
        log.coachResponse ? JSON.stringify(log.coachResponse) : null
      ]
    );
    await this.recalculateStreaks();
  }

  static async getDailyLog(date: string): Promise<DailyLog | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM daily_logs WHERE date = ?`,
      [date]
    );
    if (!row) return null;

    return {
      date: row.date,
      scores: {
        health: row.health as 0 | 1,
        mind: row.mind as 0 | 1,
        launchpad: row.launchpad as 0 | 1,
        innerCircle: row.inner_circle as 0 | 1,
        engine: row.engine as 0 | 1,
        spirit: row.spirit as 0 | 1,
      },
      totalScore: row.total_score,
      mentalState: row.mental_state as MentalState,
      mode: row.mode as DayMode,
      rawDump: row.raw_dump,
      coachResponse: row.coach_response ? JSON.parse(row.coach_response) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at
    };
  }

  static async getLogsRange(limit: number = 30): Promise<DailyLog[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM daily_logs ORDER BY date DESC LIMIT ?`,
      [limit]
    );
    return rows.map(row => ({
      date: row.date,
      scores: {
        health: row.health as 0 | 1,
        mind: row.mind as 0 | 1,
        launchpad: row.launchpad as 0 | 1,
        innerCircle: row.inner_circle as 0 | 1,
        engine: row.engine as 0 | 1,
        spirit: row.spirit as 0 | 1,
      },
      totalScore: row.total_score,
      mentalState: row.mental_state as MentalState,
      mode: row.mode as DayMode,
      rawDump: row.raw_dump,
      coachResponse: row.coach_response ? JSON.parse(row.coach_response) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at
    }));
  }

  // PROFILE SETTINGS
  static async getProfile(): Promise<UserProfile | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(`SELECT * FROM user_profile WHERE id = 1`);
    if (!row) return null;
    return {
      uid: row.uid || "local-user",
      email: row.email || "local@user.com",
      displayName: row.display_name || "Executive",
      photoURL: row.photo_url || null,
      birthday: row.birthday || null,
      tier: (row.tier || "free") as any,
      geminiApiKey: row.gemini_api_key || null,
      onboardedAt: row.onboarded_at || new Date().toISOString(),
      settings: {
        dailyReminderTime: row.evening_ritual || "20:30",
        morningWakeTime: row.morning_wake || "04:50",
        enableHealthSync: false,
        enableGmailSync: false,
        enableDriveBackup: false,
        theme: "dark"
      }
    };
  }

  static async saveProfile(profile: Partial<UserProfile>): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE user_profile SET
        uid = coalesce(?, uid),
        email = coalesce(?, email),
        display_name = coalesce(?, display_name),
        photo_url = coalesce(?, photo_url),
        birthday = coalesce(?, birthday),
        tier = coalesce(?, tier),
        gemini_api_key = coalesce(?, gemini_api_key),
        morning_wake = coalesce(?, morning_wake),
        evening_ritual = coalesce(?, evening_ritual)
      WHERE id = 1`,
      [
        profile.uid,
        profile.email,
        profile.displayName,
        profile.photoURL,
        profile.birthday,
        profile.tier,
        profile.geminiApiKey,
        profile.settings?.morningWakeTime,
        profile.settings?.dailyReminderTime
      ]
    );
  }

  // STREAK REC ENGINE
  static async recalculateStreaks(): Promise<void> {
    const db = await getDatabase();
    const logs = await db.getAllAsync<any>(
      `SELECT date, health, mind, launchpad, inner_circle, engine, spirit FROM daily_logs ORDER BY date DESC`
    );

    let overall = 0, health = 0, mind = 0, launchpad = 0, inner = 0, engine = 0, spirit = 0;
    const today = new Date().toISOString().split("T")[0];

    // Check overall streak
    for (let log of logs) {
      const allWins = (log.health + log.mind + log.launchpad + log.inner_circle + log.engine + log.spirit) === 6;
      if (allWins) overall++;
      else break;
    }

    // Health streak
    for (let log of logs) { if (log.health === 1) health++; else break; }
    // Mind streak
    for (let log of logs) { if (log.mind === 1) mind++; else break; }
    // Launchpad streak
    for (let log of logs) { if (log.launchpad === 1) launchpad++; else break; }
    // Inner Circle streak
    for (let log of logs) { if (log.inner_circle === 1) inner++; else break; }
    // Engine streak
    for (let log of logs) { if (log.engine === 1) engine++; else break; }
    // Spirit streak
    for (let log of logs) { if (log.spirit === 1) spirit++; else break; }

    await db.runAsync(
      `UPDATE streak_cache SET
        overall = ?, health = ?, mind = ?, launchpad = ?, inner_circle = ?, engine = ?, spirit = ?, updated_at = datetime('now')
      WHERE id = 1`,
      [overall, health, mind, launchpad, inner, engine, spirit]
    );
  }

  static async getStreaks(): Promise<any> {
    const db = await getDatabase();
    return await db.getFirstAsync<any>(`SELECT * FROM streak_cache WHERE id = 1`);
  }
}
