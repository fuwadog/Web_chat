"use client";

import { useState, useEffect } from "react";

interface SplashLogoProps {
  onComplete: () => void;
}

export default function SplashLogo({ onComplete }: SplashLogoProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    // Phase timing: enter animation completes at ~400ms, hold for ~1200ms, then exit
    const holdTimer = setTimeout(() => setPhase("exit"), 1400);
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-overlay phase-${phase}`}>
      <div className="splash-logo-content">
        {/* Pulse ring behind logo */}
        <div className="splash-pulse-ring"></div>
        <div
          className="splash-pulse-ring"
          style={{ animationDelay: "0.4s" }}
        ></div>

        {/* Logo icon - pin/droplet shape matching existing app logo */}
        <svg
          className="splash-logo-icon"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <circle
            cx="60"
            cy="48"
            r="35"
            stroke="url(#splashGradient)"
            strokeWidth="4"
            fill="none"
          />
          {/* Pin/droplet shape */}
          <path
            d="M60 20 C60 20 32 52 32 72 C32 87.5 44.5 100 60 100 C75.5 100 88 87.5 88 72 C88 52 60 20 60 20Z"
            fill="url(#splashGradient)"
            opacity="0.15"
          />
          <path
            d="M60 20 C60 20 32 52 32 72 C32 87.5 44.5 100 60 100 C75.5 100 88 87.5 88 72 C88 52 60 20 60 20Z"
            stroke="url(#splashGradient)"
            strokeWidth="3"
            fill="none"
          />
          {/* Inner dot */}
          <circle cx="60" cy="68" r="8" fill="url(#splashGradient)" />
          {/* Gradient definition */}
          <defs>
            <linearGradient
              id="splashGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8839ef" />
              <stop offset="100%" stopColor="#ea76cb" />
            </linearGradient>
          </defs>
        </svg>

        {/* App name */}
        <span className="splash-logo-text">AI Chat</span>

        {/* Loading dots */}
        <div className="splash-loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}
