// packages/shared/metrics.ts - Canonical metric definitions
import type { MetricDefinition } from "./types";

export const METRICS: MetricDefinition[] = [
  {
    id: "health", name: "Health", pillar: "Foundation",
    icon: "dumbbell", color: "#00FF94",
    definition: "Completed the 30-minute morning movement and stayed within nutritional bounds."
  },
  {
    id: "mind", name: "Mind", pillar: "Foundation",
    icon: "brain", color: "#6EE7FF",
    definition: "Protected the morning input window (zero doom-scrolling before 8 AM)."
  },
  {
    id: "launchpad", name: "Launchpad", pillar: "Anti-Gravity",
    icon: "rocket", color: "#9D7AFF",
    definition: "Completed the single Anti-Gravity micro-task for your future business."
  },
  {
    id: "innerCircle", name: "Inner Circle", pillar: "Family",
    icon: "heart", color: "#FF4060",
    definition: "Spent at least 20 minutes of highly focused, uninterrupted time with your son or wife."
  },
  {
    id: "engine", name: "Engine", pillar: "Investments",
    icon: "trending-up", color: "#FFB800",
    definition: "Spent 10 minutes tracking investments, learning a market trend, or planning travel."
  },
  {
    id: "spirit", name: "Spirit", pillar: "Foundation",
    icon: "sparkles", color: "#FF7A3D",
    definition: "Maintained the morning spiritual grounding and evening decompression ritual."
  }
];

export const METRIC_MAP = Object.fromEntries(METRICS.map(m => [m.id, m])) as Record<string, MetricDefinition>;

export const MENTAL_STATES = [
  { label: "Locked In", emoji: "??", color: "#00FF94" },
  { label: "Drained",   emoji: "??", color: "#6EE7FF" },
  { label: "Scattered", emoji: "??", color: "#FFB800" },
  { label: "Wired",     emoji: "?", color: "#FF7A3D" },
  { label: "Flat",      emoji: "??", color: "#5A6A8A" }
];
