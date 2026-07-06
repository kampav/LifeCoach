import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from "react-native";
import { getDatabase, runMigrations } from "./src/database/schema";
import { useCoachStore } from "./src/store/coachStore";
import { Colors } from "./src/theme/tokens";
import { METRICS, MENTAL_STATES } from "./src/shared/metrics";
import { ScoreArc } from "./src/components/ScoreArc";
import { MetricCard } from "./src/components/MetricCard";
import { ChatDrawer } from "./src/components/ChatDrawer";
import { Settings, Calendar, Award, Compass, RefreshCw } from "lucide-react-native";

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [bdayInput, setBdayInput] = useState("");
  const [countdownText, setCountdownText] = useState("Calculating...");

  const {
    todayLog,
    streaks,
    loading,
    error,
    init,
    toggleMetric,
    setDayMode,
    setMentalState,
    setRawDump,
    saveProfile,
    submitBrief
  } = useCoachStore();

  useEffect(() => {
    async function setupDb() {
      try {
        const db = await getDatabase();
        await runMigrations(db);
        setDbReady(true);
      } catch (err) {
        console.error("Migration failed:", err);
      }
    }
    setupDb();
  }, []);

  useEffect(() => {
    if (dbReady) {
      init().then(() => {
        const key = useCoachStore.getState().profile?.geminiApiKey || "";
        const bday = useCoachStore.getState().profile?.birthday || "";
        setApiKeyInput(key);
        setBdayInput(bday);
      });
    }
  }, [dbReady]);

  // Update countdown clock
  useEffect(() => {
    const birthdayStr = useCoachStore.getState().profile?.birthday;
    if (!birthdayStr) {
      setCountdownText("Set 50th Birthday in Settings");
      return;
    }
    const interval = setInterval(() => {
      const t = new Date(birthdayStr);
      const diff = t.getTime() - Date.now();
      if (diff <= 0) {
        setCountdownText("MISSION ACCOMPLISHED!");
        clearInterval(interval);
      } else {
        const days = Math.ceil(diff / 86400000);
        setCountdownText(`${days.toLocaleString()} DAYS TO CEO@50`);
      }
    }, 60000);

    // Initial calculation
    const t = new Date(birthdayStr);
    const diff = t.getTime() - Date.now();
    if (diff <= 0) {
      setCountdownText("MISSION ACCOMPLISHED!");
    } else {
      const days = Math.ceil(diff / 86400000);
      setCountdownText(`${days.toLocaleString()} DAYS TO CEO@50`);
    }

    return () => clearInterval(interval);
  }, [useCoachStore.getState().profile?.birthday]);

  const handleSaveSettings = async () => {
    await saveProfile({
      geminiApiKey: apiKeyInput,
      birthday: bdayInput || null
    });
    setShowSettings(false);
    Alert.alert("Configuration Saved", "Settings synchronized successfully.");
  };

  if (!dbReady) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>BOOTING CORE DB...</Text>
      </View>
    );
  }

  const currentScore = Object.values(todayLog.scores).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Telemetry Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>COMMAND CENTER</Text>
              <Text style={styles.subtitle}>AI LIFESTYLE SYSTEMS ARCHITECT</Text>
            </View>
            <Pressable onPress={() => setShowSettings(!showSettings)} style={styles.iconBtn}>
              <Settings size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Countdown tele block */}
          <View style={styles.countdownBox}>
            <Text style={styles.countdownVal}>{countdownText}</Text>
          </View>

          {/* Settings panel */}
          {showSettings && (
            <View style={styles.settingsPanel}>
              <Text style={styles.sectionHeader}>SYSTEM CONFIGURATION</Text>
              <View style={styles.field}>
                <Text style={styles.label}>GEMINI API KEY (PRO FREE QUOTA)</Text>
                <TextInput
                  style={styles.input}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  secureTextEntry
                  placeholder="AIzaSy..."
                  placeholderTextColor={Colors.textDisabled}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>50TH BIRTHDAY (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={bdayInput}
                  onChangeText={setBdayInput}
                  placeholder="1983-05-15"
                  placeholderTextColor={Colors.textDisabled}
                />
              </View>
              <Pressable onPress={handleSaveSettings} style={styles.primaryBtn}>
                <Text style={styles.btnText}>SYNC CONFIG</Text>
              </Pressable>
            </View>
          )}

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCell}>
              <Award size={14} color={Colors.gold} />
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statValue}>{streaks?.overall || 0}d</Text>
            </View>
            <View style={styles.statCell}>
              <Calendar size={14} color={Colors.primary} />
              <Text style={styles.statLabel}>DAY MODE</Text>
              <View style={styles.modeToggle}>
                <Pressable 
                  onPress={() => setDayMode("standard")} 
                  style={[styles.miniBtn, todayLog.mode === "standard" && styles.miniBtnActive]}
                >
                  <Text style={[styles.miniBtnText, todayLog.mode === "standard" && styles.miniBtnTextActive]}>STD</Text>
                </Pressable>
                <Pressable 
                  onPress={() => setDayMode("travel")} 
                  style={[styles.miniBtn, todayLog.mode === "travel" && styles.miniBtnActive]}
                >
                  <Text style={[styles.miniBtnText, todayLog.mode === "travel" && styles.miniBtnTextActive]}>TRV</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Score tracker section */}
          <View style={styles.dashboardGrid}>
            <View style={styles.arcContainer}>
              <ScoreArc score={currentScore} total={6} />
            </View>
            <View style={styles.cardsContainer}>
              {METRICS.map(m => (
                <MetricCard
                  key={m.id}
                  metric={m}
                  isWon={todayLog.scores[m.id] === 1}
                  onPress={() => toggleMetric(m.id)}
                />
              ))}
            </View>
          </View>

          {/* Brain-dump submission sheet */}
          <View style={styles.ritualContainer}>
            <Text style={styles.sectionHeader}>EVENING BRIEFING RITUAL (20:30)</Text>
            <Text style={styles.label}>CURRENT MENTAL TELEMETRY</Text>
            <View style={styles.chips}>
              {MENTAL_STATES.map(s => {
                const isSelected = todayLog.mentalState === s.label;
                return (
                  <Pressable
                    key={s.label}
                    onPress={() => setMentalState(s.label as any)}
                    style={[styles.chip, isSelected && { borderColor: s.color, backgroundColor: s.color + "12" }]}
                  >
                    <Text style={[styles.chipText, isSelected && { color: s.color }]}>
                      {s.emoji} {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>RAW BRAIN DUMP</Text>
            <TextInput
              style={styles.textArea}
              value={todayLog.rawDump}
              onChangeText={setRawDump}
              multiline
              maxLength={280}
              placeholder="Friction encountered? Optimization loops? Clear it here."
              placeholderTextColor={Colors.textDisabled}
            />

            <Pressable 
              onPress={submitBrief} 
              disabled={loading || !todayLog.mentalState}
              style={[styles.submitBtn, (!todayLog.mentalState || loading) && styles.disabledBtn]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Compass size={16} color="#000000" />
                  <Text style={styles.submitBtnText}>BRIEF SYSTEM ARCHITECT</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Calibrations and AI responses */}
          {todayLog.coachResponse && (
            <View style={styles.coachResponseBox}>
              <View style={styles.block}>
                <Text style={[styles.blockHeader, { color: Colors.miss }]}>PSYCHOLOGICAL CALIBRATION</Text>
                <Text style={styles.coachText}>{todayLog.coachResponse.calibration}</Text>
              </View>

              <View style={styles.block}>
                <Text style={[styles.blockHeader, { color: Colors.primary }]}>TOMORROW'S AGENDA</Text>
                {todayLog.coachResponse.agenda.map((item, idx) => (
                  <View key={idx} style={styles.agendaItem}>
                    <Text style={styles.agendaTime}>{item.time}</Text>
                    <Text style={styles.agendaDesc}>{item.description}</Text>
                    {item.pillar && <Text style={styles.agendaTag}>{item.pillar}</Text>}
                  </View>
                ))}
              </View>

              <View style={styles.block}>
                <Text style={[styles.blockHeader, { color: Colors.gold }]}>60-SEC MORNING PRIMING SCRIPT</Text>
                <View style={styles.scriptBox}>
                  <Text style={styles.scriptText}>{todayLog.coachResponse.primingScript}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        <ChatDrawer />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countdownBox: {
    backgroundColor: Colors.surface0,
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  countdownVal: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 1,
  },
  settingsPanel: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#000000",
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  statCell: {
    flex: 1,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: "monospace",
    fontSize: 15,
    fontWeight: "800",
    color: Colors.gold,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface2,
    borderRadius: 6,
    padding: 2,
  },
  miniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  miniBtnActive: {
    backgroundColor: Colors.primary,
  },
  miniBtnText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textSecondary,
  },
  miniBtnTextActive: {
    color: "#000000",
  },
  dashboardGrid: {
    marginBottom: 16,
  },
  arcContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  cardsContainer: {},
  ritualContainer: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: Colors.surface2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  textArea: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.textPrimary,
    padding: 12,
    height: 80,
    fontSize: 13,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: Colors.textDisabled,
    opacity: 0.6,
  },
  submitBtnText: {
    fontWeight: "800",
    fontSize: 13,
    color: "#000000",
    letterSpacing: 0.5,
  },
  coachResponseBox: {
    marginBottom: 16,
  },
  block: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  blockHeader: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  coachText: {
    fontSize: 13.5,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  agendaItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: "center",
  },
  agendaTime: {
    fontFamily: "monospace",
    width: 60,
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  agendaDesc: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  agendaTag: {
    fontSize: 8,
    fontWeight: "800",
    color: Colors.textSecondary,
    backgroundColor: Colors.surface2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scriptBox: {
    backgroundColor: Colors.surface2,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,184,0,0.1)",
  },
  scriptText: {
    fontStyle: "italic",
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});
// Trigger timestamp: 2026-07-06 12:24:06
