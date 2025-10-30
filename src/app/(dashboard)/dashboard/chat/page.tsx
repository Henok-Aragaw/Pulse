"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/auth-client";
import { useJournals } from "@/hooks/useJournals";
import { useDeleteJournal } from "@/hooks/useDeleteJournal";
import { toast } from "sonner";
import { Loader2, Sparkles, Calendar, Trash2 } from "lucide-react";

type AIResponse = {
  mood: string | null;
  summary: string | null;
  advice: string;
};

type Journal = {
  id: string;
  text: string;
  mood: string;
  summary: string;
  advice: string;
  createdAt: string;
};

export default function Home() {
  const { data: session } = useSession();
  const { data: journals, refetch } = useJournals();
  const { mutate: deleteJournal, isPending: isDeleting } = useDeleteJournal();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [displayedSummary, setDisplayedSummary] = useState("");
  const [displayedAdvice, setDisplayedAdvice] = useState("");
  const [currentAnalysis, setCurrentAnalysis] = useState<AIResponse | null>(null);

  const [showMood, setShowMood] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [dotCount, setDotCount] = useState(0);
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setDotCount(0);
    }
  }, [loading]);

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedId) return;
    deleteJournal(selectedId, {
      onSuccess: () => {
        refetch();
        setOpenDialog(false);
      },
      onError: () => toast.error("Failed to delete journal."),
    });
  };

  const handleAnalyze = async () => {
    if (!session) return toast.error("Please sign in first.");
    if (!text.trim()) return toast.warning("Please write something first!");

    try {
      setLoading(true);
      setAiResponse(null);
      setDisplayedSummary("");
      setDisplayedAdvice("");
      setCurrentAnalysis(null);
      setShowMood(false);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("AI analysis failed");
      const analysis: AIResponse = await res.json();

      // Check if this is a validation error (mood is null)
      if (analysis.mood === null) {
        // Show validation message with animation
        setCurrentAnalysis(analysis);
        await animateValidationMessage(analysis.advice);
        setLoading(false);
        return;
      }

      setCurrentAnalysis(analysis);

      await animateLineByLine(analysis);

      const saveRes = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mood: analysis.mood,
          summary: analysis.summary,
          advice: analysis.advice,
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save journal");
      const savedJournal: Journal = await saveRes.json();

      setAiResponse(savedJournal);
      refetch();
      setText("");
      toast.success("journal saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const animateValidationMessage = async (message: string) => {
    setDisplayedAdvice("");
    for (let i = 0; i < message.length; i++) {
      setDisplayedAdvice((prev) => prev + message[i]);
      await new Promise((r) => setTimeout(r, 20));
    }
  };

  const animateLineByLine = async (data: AIResponse) => {
    const typeLines = async (
      text: string,
      setter: React.Dispatch<React.SetStateAction<string>>,
      lineDelay = 200,
      charDelay = 15
    ) => {
      const lines = text.split("\n").filter(Boolean);
      for (const line of lines) {
        for (let i = 0; i < line.length; i++) {
          setter((prev) => prev + line[i]);
          await new Promise((r) => setTimeout(r, charDelay));
        }
        setter((prev) => prev + "\n");
        await new Promise((r) => setTimeout(r, lineDelay));
      }
    };

    if (data.summary) {
      await typeLines(data.summary, setDisplayedSummary);
      await new Promise((r) => setTimeout(r, 400));
    }
    
    if (data.mood) {
      setShowMood(true);
    }
    
    await typeLines(data.advice, setDisplayedAdvice, 300, 20);
  };

  const getMoodColor = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return "#10B981";
      case "sad":
        return "#3B82F6";
      case "angry":
        return "#EF4444";
      case "anxious":
        return "#F59E0B";
      case "neutral":
        return "#6B7280";
      default:
        return "#026652";
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return "😊";
      case "sad":
        return "😢";
      case "angry":
        return "😠";
      case "anxious":
        return "😰";
      case "excited":
        return "🤩";
      case "relaxed":
        return "😌";
      case "confused":
        return "😕";
      case "grateful":
        return "🙏";
      case "neutral":
        return "😐";
      default:
        return "🤔";
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-neutral-100 mb-4">
            <Sparkles className="w-8 h-8 text-neutral-50 dark:text-neutral-900" />
          </div>
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Pulse Journal
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Reflect on your thoughts with AI-powered insights
          </p>
        </div>

        {/* Input Card */}
        <Card className="mb-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="p-6">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind today?"
              className="min-h-[140px] resize-none text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent rounded-lg"
            />
            <Button
              onClick={handleAnalyze}
              className="cursor-pointer mt-4 w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-neutral-50 dark:text-neutral-900 font-medium transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing your entry{".".repeat(dotCount)}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze with Pulse AI
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* AI Response */}
        {loading && (
          <motion.div
            className="bg-neutral-900 dark:bg-neutral-800 text-neutral-50 dark:text-neutral-200 p-6 rounded-xl text-sm font-mono mb-8 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>🤖 Pulse is analyzing your thoughts</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-neutral-50 dark:bg-neutral-200"
                  animate={{
                    y: ["0%", "-50%", "0%"],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "loop",
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {currentAnalysis && (
          <motion.div
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {currentAnalysis.mood ? (
              <>
                <h2 className="text-lg font-semibold mb-3 text-neutral-800 dark:text-neutral-100">
                  Pulse Summary
                </h2>
                <pre className="text-sm whitespace-pre-wrap leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">
                  {displayedSummary}
                </pre>

                {showMood && currentAnalysis.mood && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4"
                  >
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${getMoodColor(currentAnalysis.mood)}20`,
                        color: getMoodColor(currentAnalysis.mood),
                      }}
                    >
                      <span>Detected Mood:</span>
                      <span className="font-semibold capitalize">{currentAnalysis.mood}</span>
                      <span>{getMoodEmoji(currentAnalysis.mood)}</span>
                    </div>
                  </motion.div>
                )}

                <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <pre className="text-sm whitespace-pre-wrap leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {displayedAdvice}
                  </pre>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-3 text-neutral-800 dark:text-neutral-100">
                  AI Response
                </h2>
                <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <pre className="text-sm whitespace-pre-wrap leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {displayedAdvice}
                  </pre>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Previous Journals */}
        {journals?.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Previous Entries
              </h2>
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                ({journals.length})
              </span>
            </div>

            {journals.map((j: Journal) => (
              <Card
                key={j.id}
                className="relative border-l-4 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                style={{ borderLeftColor: getMoodColor(j.mood) }}
              >
                <div className="p-5 space-y-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 text-neutral-400 cursor-pointer hover:text-red-500"
                    onClick={() => handleDelete(j.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="flex items-start justify-between gap-4">
                    <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed flex-1 whitespace-pre-wrap break-words">
                      {j.text}
                    </p>
                    <span className="text-2xl flex-shrink-0">{getMoodEmoji(j.mood)}</span>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
                      AI INSIGHTS
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {j.summary}
                    </p>
                    <div className="bg-neutral-50 dark:bg-neutral-950 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                        {j.advice}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-600 pt-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(j.createdAt).toLocaleString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}