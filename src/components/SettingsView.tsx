import { Bell, Database, Eraser, Power, TimerReset } from "lucide-react";
import type { AppSettings } from "../types";

interface SettingsViewProps {
  settings: AppSettings;
  status: string;
  onSettingsChange: (settings: AppSettings) => void;
  onTestNotification: () => void;
  onClearExploration: () => void;
  onClearCache: () => void;
}

export function SettingsView({
  settings,
  status,
  onSettingsChange,
  onTestNotification,
  onClearExploration,
  onClearCache,
}: SettingsViewProps) {
  return (
    <section className="settings-view">
      <header>
        <p className="eyebrow">Preferences</p>
        <h1>Settings</h1>
      </header>

      <div className="settings-list">
        <label className="setting-row">
          <span>
            <TimerReset size={20} aria-hidden />
            <strong>Daily notification time</strong>
          </span>
          <input
            type="time"
            value={settings.dailyTime}
            onChange={(event) => onSettingsChange({ ...settings, dailyTime: event.target.value })}
          />
        </label>

        <label className="setting-row">
          <span>
            <Power size={20} aria-hidden />
            <strong>Start with Windows</strong>
          </span>
          <input
            type="checkbox"
            checked={settings.startWithWindows}
            onChange={(event) => onSettingsChange({ ...settings, startWithWindows: event.target.checked })}
          />
        </label>

        <label className="setting-row">
          <span>
            <Bell size={20} aria-hidden />
            <strong>Notifications</strong>
          </span>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(event) => onSettingsChange({ ...settings, notificationsEnabled: event.target.checked })}
          />
        </label>

        <label className="setting-row">
          <span>
            <Database size={20} aria-hidden />
            <strong>Article quality filtering</strong>
          </span>
          <input
            type="checkbox"
            checked={settings.qualityFilterEnabled}
            onChange={(event) => onSettingsChange({ ...settings, qualityFilterEnabled: event.target.checked })}
          />
        </label>
      </div>

      <div className="settings-actions">
        <button className="secondary-button" onClick={onTestNotification}>
          <Bell size={18} aria-hidden />
          <span>Test Notification</span>
        </button>
        <button className="danger-button" onClick={onClearExploration}>
          <Eraser size={18} aria-hidden />
          <span>Clear Trails</span>
        </button>
        <button className="danger-button" onClick={onClearCache}>
          <Database size={18} aria-hidden />
          <span>Clear Cache</span>
        </button>
      </div>

      <p className="status-line">{status}</p>
    </section>
  );
}
