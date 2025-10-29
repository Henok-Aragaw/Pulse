"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Smile, Frown, Meh, TrendingUp, Calendar, BookOpen, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import { useJournals } from "@/hooks/useJournals";

const DashboardSummary: React.FC = () => {
  type Journal = {
    id: string;
    userId: string;
    text: string;
    mood: string;
    summary: string;
    advice: string;
    createdAt: string;
  };

  const { data, isLoading, isError } = useJournals();
  const journals: Journal[] = (data as Journal[] | undefined) ?? [];

  const stats = useMemo(() => {
    // Ensure stats exist even if journals are empty
    const moodCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    journals.forEach((j: Journal) => {
      const mood = j.mood?.toLowerCase() || "neutral";
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;

      const date = new Date(j.createdAt).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Default values if no journals
  const typedJournals = journals as { createdAt: string }[];
    const sortedDates: string[] = typedJournals
      .map((j) => new Date(j.createdAt).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    if (sortedDates.length) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) currentStreak++;
          else break;
        }
      }
    }

    const firstEntry = journals.length ? new Date(journals[journals.length - 1].createdAt) : new Date();
    const lastEntry = journals.length ? new Date(journals[0].createdAt) : new Date();
    const weeksDiff = Math.max(1, (lastEntry.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const avgPerWeek = journals.length ? (journals.length / weeksDiff).toFixed(1) : "0";

    const mostCommonMood =
      Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    const recentHappy = journals.filter(
      (j: Journal) =>
        new Date(j.createdAt).getTime() > sevenDaysAgo &&
        j.mood?.toLowerCase() === "happy"
    ).length;

    const previousHappy = journals.filter(
      (j: Journal) =>
        new Date(j.createdAt).getTime() > fourteenDaysAgo &&
        new Date(j.createdAt).getTime() <= sevenDaysAgo &&
        j.mood?.toLowerCase() === "happy"
    ).length;

    const moodTrend = recentHappy >= previousHappy ? "improving" : "declining";

    return {
      moodCounts,
      dailyCounts,
      currentStreak,
      avgPerWeek,
      mostCommonMood,
      moodTrend,
    };
  }, [journals]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-neutral-600" />
        <span className="text-neutral-600">Loading your insights...</span>
      </div>
    );

  if (isError)
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
        <p className="text-red-700 dark:text-red-400">Failed to load journals. Please try again.</p>
      </div>
    );

  const chartData = Object.entries(stats!.moodCounts).length
    ? Object.entries(stats!.moodCounts).map(([mood, count]) => ({
        mood: mood.charAt(0).toUpperCase() + mood.slice(1),
        count,
      }))
    : [
        { mood: "Happy", count: 0 },
        { mood: "Sad", count: 0 },
        { mood: "Neutral", count: 0 },
        { mood: "Anxious", count: 0 },
        { mood: "Excited", count: 0 },
      ];

  const lineData = Object.entries(stats!.dailyCounts)
    .slice(-14)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    }));

  // Fill 14 days with zero if no entries
  if (!lineData.length) {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      lineData.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: 0,
      });
    }
  }

  const gentleColors: Record<string, string> = {
    Happy: "#34D399",
    Sad: "#60A5FA",
    Neutral: "#9CA3AF",
    Anxious: "#FBBF24",
    Excited: "#A78BFA",
  };

  const cardBg = "bg-neutral-50 dark:bg-neutral-800";
  const iconColor = "text-neutral-600 dark:text-neutral-300";

  return (
    <div className="space-y-6">
      {/* Header Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`p-5 ${cardBg} shadow-sm border border-neutral-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Entries</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">{journals.length}</p>
            </div>
            <BookOpen className={`w-6 h-6 ${iconColor}`} />
          </div>
        </Card>

        <Card className={`p-5 ${cardBg} shadow-sm border border-neutral-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Current Streak</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">{stats!.currentStreak} days</p>
            </div>
            <TrendingUp className={`w-6 h-6 ${iconColor}`} />
          </div>
        </Card>

        <Card className={`p-5 ${cardBg} shadow-sm border border-neutral-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Weekly Average</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">{stats!.avgPerWeek}</p>
            </div>
            <Calendar className={`w-6 h-6 ${iconColor}`} />
          </div>
        </Card>

        <Card className={`p-5 ${cardBg} shadow-sm border border-neutral-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Mood Trend</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1 capitalize">{stats!.moodTrend}</p>
            </div>
            <Clock className={`w-6 h-6 ${iconColor}`} />
          </div>
        </Card>
      </div>

      {/* Mood Breakdown Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {chartData.map((entry) => {
          const mood = entry.mood.toLowerCase();
          const count = entry.count;
          const percentage = ((count / (journals.length || 1)) * 100).toFixed(0);
          const MoodIcon = mood === "happy" ? Smile : mood === "sad" ? Frown : Meh;
          const iconColorClass =
            mood === "happy"
              ? "text-green-600 dark:text-green-400"
              : mood === "sad"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400";

          return (
            <Card
              key={mood}
              className="p-5 bg-neutral-50 dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <MoodIcon className={`w-5 h-5 ${iconColorClass}`} />
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{percentage}%</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{count}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize mt-1">{entry.mood}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mood Distribution */}
        <Card className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Mood Distribution</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Overall breakdown of your emotional patterns</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <XAxis dataKey="mood" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={gentleColors[entry.mood] || "#9CA3AF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Journals Over Time */}
        <Card className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Activity Timeline</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Your journaling frequency over the last 14 days</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ fill: "#3B82F6", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insights Card */}
      <Card className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-3">Your Insights</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Most Common Mood</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 capitalize mt-1">{stats!.mostCommonMood}</p>
          </div>
          <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Longest Streak</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mt-1">{stats!.currentStreak} days</p>
          </div>
          <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Days Journaled</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mt-1">{Object.keys(stats!.dailyCounts).length} days</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardSummary;
