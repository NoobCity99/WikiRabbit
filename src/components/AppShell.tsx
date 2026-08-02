import { CalendarDays, GitBranch, Plus, Rabbit, Settings, Sparkles } from "lucide-react";
import type { AppSettings, ArticleNode, ArticleSummary, Exploration, TrailStats, ViewName } from "../types";
import { ArticleReader } from "./ArticleReader";
import { RabbitTree } from "./RabbitTree";
import { SettingsView } from "./SettingsView";
import { TrailBar } from "./TrailBar";

interface AppShellProps {
  view: ViewName;
  settings: AppSettings;
  exploration: Exploration | null;
  activeArticle: ArticleSummary | null;
  dailyArticle: ArticleSummary | null;
  choices: ArticleNode[];
  trailStats: TrailStats;
  isLoading: boolean;
  error: string | null;
  status: string;
  onViewChange: (view: ViewName) => void;
  onStartRandom: () => void;
  onUseDailyArticle: () => void;
  onSelectNode: (node: ArticleNode) => void;
  onRetry: () => void;
  onTestNotification: () => void;
  onSettingsChange: (settings: AppSettings) => void;
  onClearExploration: () => void;
  onClearCache: () => void;
}

export function AppShell(props: AppShellProps) {
  const {
    view,
    settings,
    exploration,
    activeArticle,
    dailyArticle,
    choices,
    trailStats,
    isLoading,
    error,
    status,
    onViewChange,
    onStartRandom,
    onUseDailyArticle,
    onSelectNode,
    onRetry,
    onTestNotification,
    onSettingsChange,
    onClearExploration,
    onClearCache,
  } = props;

  const articleForReader = view === "today" ? dailyArticle ?? activeArticle : activeArticle;
  const showTree = view !== "settings";

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <Rabbit size={28} aria-hidden />
          <span>WikiRabbit</span>
        </div>

        <nav className="nav-list" aria-label="Primary">
          <button className={view === "today" ? "nav-item active" : "nav-item"} onClick={() => onViewChange("today")}>
            <CalendarDays size={18} aria-hidden />
            <span>Today</span>
          </button>
          <button className={view === "trail" ? "nav-item active" : "nav-item"} onClick={() => onViewChange("trail")}>
            <GitBranch size={18} aria-hidden />
            <span>Current Trail</span>
          </button>
          <button className={view === "settings" ? "nav-item active" : "nav-item"} onClick={() => onViewChange("settings")}>
            <Settings size={18} aria-hidden />
            <span>Settings</span>
          </button>
        </nav>

        <div className="trail-card">
          <span className="eyebrow">Trail in progress</span>
          <strong>{trailStats.visitedCount} articles</strong>
          <span>Depth {trailStats.depth}</span>
          <span>{trailStats.totalCount} total nodes</span>
        </div>

        <button className="secondary-action" onClick={onStartRandom} disabled={isLoading}>
          <Plus size={18} aria-hidden />
          <span>Start New Trail</span>
        </button>
      </aside>

      {showTree ? (
        <section className="map-panel" aria-label="Rabbit hole map">
          <div className="panel-header">
            <h1>Rabbit Hole Map</h1>
            <button className="icon-text-button" onClick={onStartRandom} disabled={isLoading} title="Show random article">
              <Sparkles size={16} aria-hidden />
              <span>Random</span>
            </button>
          </div>
          <RabbitTree exploration={exploration} onSelectNode={onSelectNode} />
          <div className="legend">
            <span><i className="dot current" /> Current</span>
            <span><i className="dot visited" /> Visited</span>
            <span><i className="dot offered" /> Offered</span>
            <span><i className="dot muted" /> Not chosen</span>
          </div>
        </section>
      ) : null}

      <main className={showTree ? "reader-panel" : "reader-panel settings-only"}>
        {view === "settings" ? (
          <SettingsView
            settings={settings}
            status={status}
            onSettingsChange={onSettingsChange}
            onTestNotification={onTestNotification}
            onClearExploration={onClearExploration}
            onClearCache={onClearCache}
          />
        ) : (
          <ArticleReader
            article={articleForReader}
            choices={view === "trail" ? choices : []}
            isTodayView={view === "today"}
            isLoading={isLoading}
            error={error}
            status={status}
            onRetry={onRetry}
            onStartRandom={onStartRandom}
            onUseDailyArticle={onUseDailyArticle}
            onSelectChoice={onSelectNode}
            onTestNotification={onTestNotification}
          />
        )}
      </main>

      <TrailBar exploration={exploration} activeArticle={activeArticle} onSelectNode={onSelectNode} />
    </div>
  );
}
