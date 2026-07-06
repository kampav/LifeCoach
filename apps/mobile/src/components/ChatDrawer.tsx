import React, { useState, useRef } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Colors } from "../theme/tokens";
import { Send, Sparkles } from "lucide-react-native";
import { useCoachStore } from "../store/coachStore";
import { GeminiService } from "../services/GeminiService";
import type { ChatMessage } from "../shared/types";

export const ChatDrawer: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const { todayLog } = useCoachStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
      mode: "quick"
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);
    
    // Auto-scroll layout
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const responseText = await GeminiService.askQuickQuery(
        userMsg.content,
        messages,
        todayLog
      );

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
        mode: "quick"
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: e.message === "API_KEY_MISSING" 
          ? "System calibration halted. Please add your Gemini API key in settings."
          : `API Error: ${e.message}`,
        timestamp: new Date().toISOString(),
        mode: "quick"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={16} color={Colors.violet} />
        <Text style={styles.headerTitle}>AI SYSTEM INTERFACE</Text>
      </View>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.msgContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {messages.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Standing by. Ask for agenda revisions, metrics analysis, or strategic pivots.</Text>
          </View>
        )}
        {messages.map(m => (
          <View 
            key={m.id} 
            style={[
              styles.bubble, 
              m.role === "user" ? styles.userBubble : styles.assistantBubble
            ]}
          >
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
        {chatLoading && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={Colors.violet} />
          </View>
        )}
      </ScrollView>
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Command..."
          placeholderTextColor={Colors.textDisabled}
          onSubmitEditing={sendMessage}
        />
        <Pressable onPress={sendMessage} style={styles.sendButton}>
          <Send size={16} color="#000000" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface0,
    borderTopWidth: 1,
    borderColor: Colors.border,
    height: 320,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: "monospace",
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "800",
    marginLeft: 8,
    letterSpacing: 1.5,
  },
  msgContainer: {
    flex: 1,
    marginBottom: 12,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: Colors.textDisabled,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: Colors.surface2,
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "flex-start",
  },
  bubbleText: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  loader: {
    alignSelf: "flex-start",
    padding: 12,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    backgroundColor: Colors.surface1,
    paddingLeft: 16,
    paddingRight: 6,
    height: 44,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    height: "100%",
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
