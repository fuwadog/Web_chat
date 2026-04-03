"use client";

import { useState, useEffect } from "react";

interface StatsPanelProps {
  totalMessages: number;
  totalApiCalls: number;
  tokenUsage: number;
  avgResponseTime: number;
  sessionMessageCount: number;
  startTime?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accentColor: string;
}

function StatCard({ icon, label, value, accentColor }: StatCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div
      className="stat-card"
      style={{ "--stat-accent": accentColor } as React.CSSProperties}
    >
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value">
          {typeof value === "number" ? formatNumber(value) : value}
        </span>
      </div>
    </div>
  );
}

export default function StatsPanel({
  totalMessages,
  totalApiCalls,
  tokenUsage,
  avgResponseTime,
  sessionMessageCount,
  startTime,
}: StatsPanelProps) {
  const [uptime, setUptime] = useState("00:00:00");

  useEffect(() => {
    const start = startTime ? new Date(startTime).getTime() : Date.now();

    const updateUptime = () => {
      const elapsed = Date.now() - start;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      setUptime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <svg
          className="stats-header-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M18 20V10M12 20V4M6 20v-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3>Statistics</h3>
      </div>
      <div className="stats-grid">
        <StatCard
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          label="Messages"
          value={totalMessages}
          accentColor="var(--sky)"
        />
        <StatCard
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          label="API Calls"
          value={totalApiCalls}
          accentColor="var(--teal)"
        />
        <StatCard
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          label="Tokens"
          value={tokenUsage}
          accentColor="var(--green)"
        />
        <StatCard
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path
                d="M12 6v6l4 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          label="Avg Response"
          value={`${avgResponseTime}ms`}
          accentColor="var(--lavender)"
        />
        <StatCard
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          label="Session Msgs"
          value={sessionMessageCount}
          accentColor="var(--peach)"
        />
        <StatCard
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M5 22h14M5 18h14M5 14h14M5 10h14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 2v4M15 2v4M3 6h18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          label="Uptime"
          value={uptime}
          accentColor="var(--sapphire)"
        />
      </div>
    </div>
  );
}
