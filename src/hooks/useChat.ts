import { useState } from "react";
import { toast } from "sonner";

export type Journal = {
  id: string;
  text: string;
  mood: string;
  summary: string;
  advice: string;
  createdAt: string;
};

type AIResponse = {
  mood: string | null;
  summary: string | null;
  advice: string;
};

type ChatHistoryItem = {
  user: string;
  ai: string;
};


export function useChat(onSuccess?: () => Promise<unknown>) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const sendMessage = async (text: string, history: Journal[]) => {
    if (!text.trim()) return false;

    setIsAnalyzing(true);

    try {
      // Prepare Context
      const recentHistory: ChatHistoryItem[] = history
        .slice(-10)
        .map((msg) => ({
          user: msg.text,
          ai: msg.advice,
        }));

      // Analyze with AI
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, history: recentHistory }),
      });

      if (!analyzeRes.ok) throw new Error("AI analysis failed");
      const analysis: AIResponse = await analyzeRes.json();

      const saveRes = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mood: analysis.mood || "Neutral",
          summary: analysis.summary || "Chat",
          advice: analysis.advice,
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save chat");

      if (onSuccess) {
        await onSuccess();
      }
      
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    sendMessage,
    isAnalyzing,
  };
}