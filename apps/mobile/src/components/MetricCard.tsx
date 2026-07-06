import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "../theme/tokens";
import type { MetricDefinition } from "../shared/types";
import { Check, X } from "lucide-react-native";

interface MetricCardProps {
  metric: MetricDefinition;
  isWon: boolean;
  onPress: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, isWon, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isWon ? styles.winCard : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.meta}>
          <Text style={styles.title}>{metric.name}</Text>
          <Text style={styles.pillar}>{metric.pillar.toUpperCase()}</Text>
        </View>
        <View style={[styles.indicator, { backgroundColor: isWon ? Colors.win : Colors.surface3 }]}>
          {isWon ? (
            <Check size={14} color="#000000" strokeWidth={3} />
          ) : (
            <X size={12} color={Colors.textSecondary} strokeWidth={2.5} />
          )}
        </View>
      </View>
      <Text style={styles.definition}>{metric.definition}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  winCard: {
    borderColor: "rgba(0,255,148,0.22)",
    backgroundColor: "rgba(0,255,148,0.02)",
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  meta: {},
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pillar: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 2,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  definition: {
    fontSize: 12.5,
    color: Colors.textData,
    lineHeight: 18,
  },
});
