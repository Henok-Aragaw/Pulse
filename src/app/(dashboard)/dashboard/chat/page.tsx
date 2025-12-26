"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
import { useChat, Journal } from "@/hooks/useChat";
import { toast } from "sonner";
import { Loader2, Send, Trash2, Bot, Mic, StopCircle, Sparkles } from "lucide-react";

// --- Type Definitions for Speech API (No 'any') ---

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
  [Symbol.iterator](): IterableIterator<SpeechRecognitionResult>;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
}

// Extend Window interface locally
interface IWindow extends Window {
  webkitSpeechRecognition: { new (): SpeechRecognition };
  SpeechRecognition: { new (): SpeechRecognition };
}

export default function Home() {
  const { data: session } = useSession();
  
  // Data Hooks
  const { data: journals, refetch } = useJournals();
  const { mutate: deleteJournal, isPending: isDeleting } = useDeleteJournal();
  
  // Logic Hooks
  const { sendMessage, isAnalyzing } = useChat(refetch);

  // UI State
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check Voice Support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as IWindow;
      if (win.webkitSpeechRecognition || win.SpeechRecognition) {
        setVoiceSupported(true);
      }
    }
  }, []);

  // Sort History
  const chatHistory = journals
    ? [...journals].sort((a: Journal, b: Journal) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory.length, isAnalyzing]);

  // Handlers

  const handleSend = async (textOverride?: string) => {
    if (!session) return toast.error("Please sign in first.");
    
    const content = typeof textOverride === "string" ? textOverride : text;
    if (!content.trim()) return;

    // Optimistically clear UI
    setText(""); 
    
    const success = await sendMessage(content, chatHistory);
    
    if (!success) setText(content);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false); 
      return;
    }

    const win = window as unknown as IWindow;
    const RecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
    
    if (!RecognitionConstructor) return toast.error("Voice recognition not supported.");

    const recognition = new RecognitionConstructor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      setText("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const resultsArray = Array.from(event.results);
      
      const transcript = resultsArray
        .map((result) => result[0]) 
        .map((result) => result.transcript)
        .join("");
        
      finalTranscript = transcript;
      setText(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    
    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim().length > 0) handleSend(finalTranscript);
    };

    recognition.start();
  };

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
      onError: () => toast.error("Failed to delete message."),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Styles 
  const getMoodStyle = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case "happy": return "bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800";
      case "sad": return "bg-sky-50 text-sky-900 border-sky-100 dark:bg-sky-900/20 dark:text-sky-100 dark:border-sky-800";
      case "angry": return "bg-rose-50 text-rose-900 border-rose-100 dark:bg-rose-900/20 dark:text-rose-100 dark:border-rose-800";
      case "anxious": return "bg-amber-50 text-amber-900 border-amber-100 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-800";
      default: return "bg-neutral-50 text-neutral-900 border-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700";
    }
  };

  return (
    <main className="relative flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      
      {/* Chat Scroll Area */}
      <div className="flex-1 overflow-y-auto pt-8 pb-32 px-4 sm:px-6 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Empty State */}
          {chatHistory.length === 0 && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center mt-20 space-y-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-white dark:from-neutral-900 dark:to-neutral-800 rounded-3xl flex items-center justify-center shadow-sm border border-neutral-200 dark:border-neutral-800">
                <Bot className="w-10 h-10 text-neutral-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">Hi, I&apos;m Pulse.</h3>
                <p className="text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  I&apos;m here to listen, support, and help you process your thoughts. This is a safe space.
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {chatHistory.map((msg: Journal) => (
              <div key={msg.id} className="space-y-2">
                
                {/* User Bubble */}
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end pl-12"
                >
                  <div className="group relative">
                    <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3.5 rounded-[24px] rounded-tr-md shadow-md shadow-neutral-900/5">
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    {/* Delete Action */}
                    <button 
                      onClick={() => handleDelete(msg.id)}
                      className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>

                {/* AI Bubble */}
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-start pr-8"
                >
                  <div className="flex flex-col items-start gap-1">
                    <div className={`px-6 py-4 rounded-[24px] rounded-tl-md border ${getMoodStyle(msg.mood)}`}>
                      <div className="flex items-center gap-2 mb-2 opacity-50">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{msg.mood}</span>
                      </div>
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.advice}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isAnalyzing && (
             <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex justify-start pl-1"
           >
             <div className="px-5 py-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[24px] rounded-tl-md shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                </div>
                <span className="text-xs text-neutral-400 font-medium">Pulse is thinking...</span>
             </div>
           </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Dock */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-neutral-950 dark:via-neutral-950/80 pointer-events-none z-20">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          
          <motion.div 
            layout
            className={`
              relative flex items-end gap-2 p-2 rounded-[32px] shadow-2xl transition-all duration-300 border
              ${isListening 
                ? 'bg-white dark:bg-neutral-900 border-red-500/50 shadow-red-500/10 ring-4 ring-red-500/10' 
                : 'bg-white dark:bg-neutral-900 border-white/20 dark:border-neutral-800 shadow-neutral-200/50 dark:shadow-black/50'
              }
            `}
          >
            {/* Voice Button */}
            {voiceSupported && (
               <Button
               onClick={handleVoiceInput}
               variant="ghost"
               size="icon"
               className={`h-12 w-12 rounded-full flex-shrink-0 transition-all duration-300 ${
                 isListening 
                   ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" 
                   : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
               }`}
             >
               {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
             </Button>
            )}

            {/* Input Field */}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "How are you feeling?"}
              className="min-h-[48px] max-h-[120px] py-3 px-2 resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-[16px] text-neutral-900 dark:text-white placeholder:text-neutral-400"
              style={{ paddingBottom: '12px' }} 
            />

            {/* Send Button */}
            <Button
              onClick={() => handleSend()}
              disabled={isAnalyzing || (!text.trim() && !isListening)}
              size="icon"
              className={`h-12 w-12 rounded-full flex-shrink-0 transition-all duration-300 ${
                 text.trim() 
                 ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md transform hover:scale-105" 
                 : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
              }`}
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </motion.div>
          
          <div className="mt-3 text-center">
            <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 opacity-60">
              {isListening ? "Tap red button to stop" : "AI is helpful, but not a medical professional."}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:rounded-3xl p-6 bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription className="mt-2">
              This will remove this interaction from your therapeutic history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(false)} 
              className="rounded-xl h-11 border-neutral-200 dark:border-neutral-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="rounded-xl h-11 bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}