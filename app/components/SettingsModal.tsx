"use client";

import { useState } from "react";
import { AppSettings, AVAILABLE_MODELS } from "../types/chat";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  apiKey: string;
  onSave: (settings: AppSettings, apiKey: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  apiKey,
  onSave,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const handleSave = () => {
    onSave(localSettings, localApiKey);
    onClose();
  };

  const handleSettingsChange = (
    field: keyof AppSettings,
    value: string | number,
  ) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="modal-close">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-content">
          <div className="setting-group">
            <label className="setting-label">API Key</label>
            <input
              type="password"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="setting-input"
            />
            <p className="setting-help">
              Stored in session storage - cleared when you close the tab
            </p>
          </div>
          <div className="setting-group">
            <label className="setting-label">Model</label>
            <select
              value={localSettings.model}
              onChange={(e) => handleSettingsChange("model", e.target.value)}
              className="setting-select"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <div className="setting-group">
            <label className="setting-label">
              Temperature: {localSettings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) =>
                handleSettingsChange("temperature", parseFloat(e.target.value))
              }
              className="setting-range"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="modal-button modal-button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="modal-button modal-button-primary"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
