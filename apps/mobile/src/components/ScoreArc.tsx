import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Colors } from "../theme/tokens";

interface ScoreArcProps {
  score: number;
  total: number;
}

export const ScoreArc: React.FC<ScoreArcProps> = ({ score, total }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score / total,
      duration: 800,
      useNativeDriver: false,
    }).current.start();
  }, [score, total]);

  const percentage = (score / total) * 100;
  
  // Custom HUD color selector
  const getGlowColor = () => {
    if (score === 6) return Colors.win;
    if (score >= 4) return Colors.primary;
    if (score >= 2) return Colors.gold;
    return Colors.miss;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { borderColor: getGlowColor() }]}>
        <Text style={[styles.scoreText, { color: getGlowColor() }]}>
          {score}
        </Text>
        <Text style={styles.totalText}>OF {total}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface0,
    // Telemetry border styling
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  scoreText: {
    fontFamily: "monospace",
    fontSize: 42,
    fontWeight: "900",
  },
  totalText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: -2,
  },
});
