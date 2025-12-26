"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare, Activity, Calendar, TrendingUp, LucideIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useJournals } from "@/hooks/useJournals";

type Journal = {
  id: string;
  userId: string;
  text: string;
  mood: string;
  summary: string;
  advice: string;
  createdAt: string;
};

const DashboardSummary: React.FC = () => {
  const { data, isLoading, isError } = useJournals();
  
  const journals: Journal[] = useMemo(() => (data as Journal[] | undefined) ?? [], [data]);

  const stats = useMemo(() => {
    // Initialize Defaults
    const moodCounts: Record<string, number> = {
      Happy: 0,
      Sad: 0,
      Neutral: 0,
      Anxious: 0,
      Excited: 0,
      Angry: 0,
    };
    const dailyCounts: Record<string, number> = {};
    let totalMessages = 0;

    // Process Real Data
    journals.forEach((j) => {
      totalMessages++;
      
      const rawMood = j.mood || "Neutral";
      const normalizedMood = rawMood.charAt(0).toUpperCase() + rawMood.slice(1).toLowerCase();
      
      moodCounts[normalizedMood] = (moodCounts[normalizedMood] || 0) + 1;

      const dateKey = new Date(j.createdAt).toDateString();
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    });

    // Calculate Streak
    const activeDates = Object.keys(dailyCounts)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    if (activeDates.length > 0) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastActive = activeDates[0];
      lastActive.setHours(0,0,0,0);

      if (lastActive.getTime() === today.getTime() || lastActive.getTime() === yesterday.getTime()) {
        currentStreak = 1;
        for (let i = 0; i < activeDates.length - 1; i++) {
          const curr = activeDates[i];
          const next = activeDates[i+1];
          const diffTime = Math.abs(curr.getTime() - next.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate Averages
    const firstEntryDate = journals.length 
      ? new Date(journals[journals.length - 1].createdAt).getTime() 
      : Date.now();
    const daysSinceStart = Math.max(1, (Date.now() - firstEntryDate) / (1000 * 60 * 60 * 24));
    const avgPerWeek = totalMessages === 0 ? "0" : ((totalMessages / daysSinceStart) * 7).toFixed(1);

    // Find Most Common Mood
    let mostCommonMood = "Neutral";
    let maxCount = -1;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = mood;
      }
    });
    if (totalMessages === 0) mostCommonMood = "No Data";

    return {
      moodCounts,
      dailyCounts,
      totalMessages,
      currentStreak,
      avgPerWeek,
      mostCommonMood,
    };
  }, [journals]);

  // Mood Data
  const rawChartData = Object.entries(stats.moodCounts).map(([mood, count]) => ({
    mood,
    count,
  }));
  const chartData = stats.totalMessages > 0 
    ? rawChartData.filter(d => d.count > 0).sort((a,b) => b.count - a.count)
    : rawChartData.slice(0, 5); 

  // Timeline Data (Last 14 Days)
  const lineData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toDateString();
    lineData.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: stats.dailyCounts[dateKey] || 0,
    });
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20 h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );

  if (isError)
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
        <p className="text-red-600 dark:text-red-400">Unable to load dashboard data.</p>
      </div>
    );

  // Colors
  const getBarColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case "happy": return "#34D399";
      case "excited": return "#A78BFA";
      case "sad": return "#60A5FA";
      case "angry": return "#F87171";
      case "anxious": return "#FBBF24";
      default: return "#9CA3AF";
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Messages" value={stats.totalMessages} icon={MessageSquare} />
        <StatCard title="Current Streak" value={`${stats.currentStreak} days`} icon={Activity} />
        <StatCard title="Avg. Weekly Msgs" value={stats.avgPerWeek} icon={Calendar} />
        <StatCard title="Overall Vibe" value={stats.mostCommonMood} icon={TrendingUp} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mood Distribution */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Emotional Spectrum</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Detected moods from your chats</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="mood" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.mood)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Over Time */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Chat Activity</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Your interaction volume (Last 14 Days)</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: "#6B7280" }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 12, fill: "#6B7280" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#14b8a6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#0d9488" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {stats.totalMessages === 0 && (
        <div className="text-center py-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Start chatting to see your activity timeline pulse!
          </p>
        </div>
      )}
    </div>
  );
};


const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: LucideIcon }) => (
  <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{title}</p>
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">{value}</p>
      </div>
      <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
        <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
      </div>
    </div>
  </Card>
);

export default DashboardSummary;