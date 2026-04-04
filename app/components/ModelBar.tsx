"use client";

interface ModelBarProps {
  modelName: string;
  temperature: number;
  mode: "auto" | "manual";
  messageCount: number;
}

export default function ModelBar({
  modelName,
  temperature,
  mode,
  messageCount,
}: ModelBarProps) {
  const formatModelName = (name: string): string => {
    const modelMap: Record<string, string> = {
      auto: "Auto Select",
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
      "gemini-3-flash": "Gemini 3 Flash",
      "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
    };
    return (
      modelMap[name] ||
      name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  return (
    <div className="model-bar">
      <div className="model-bar-content">
        <div className="model-bar-item">
          <svg
            className="model-bar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 2a7 7 0 017 7c0 3-3 7-7 7s-7-4-7-7a7 7 0 017-7z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="14" r="3" />
            <path
              d="M6 20v-2M12 22v-2M18 20v-2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="model-bar-label">Model</span>
          <span className="model-bar-value model-bar-value-accent">
            {formatModelName(modelName)}
          </span>
        </div>

        <div className="model-bar-divider" />

        <div className="model-bar-item">
          <svg
            className="model-bar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="model-bar-label">Temperature</span>
          <span className="model-bar-value">{temperature.toFixed(1)}</span>
        </div>

        <div className="model-bar-divider" />

        <div className="model-bar-item">
          <svg
            className="model-bar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 20V10M6 20V4M18 20v-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="model-bar-label">Mode</span>
          <span
            className={`model-bar-value ${mode === "auto" ? "model-bar-value-pink" : "model-bar-value-teal"}`}
          >
            {mode === "auto" ? "Auto" : "Manual"}
          </span>
        </div>

        <div className="model-bar-divider" />

        <div className="model-bar-item">
          <svg
            className="model-bar-icon"
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
          <span className="model-bar-label">Messages</span>
          <span className="model-bar-value">{messageCount}</span>
        </div>
      </div>
    </div>
  );
}
