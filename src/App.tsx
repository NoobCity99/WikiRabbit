import { listen } from "@tauri-apps/api/event";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import type { AppSettings, ArticleNode, ArticleSummary, Exploration, ViewName } from "./types";
import { shouldAttemptDailyDelivery, localDateKey } from "./services/dailyScheduler";
import {
  clearArticleCache,
  clearExplorationHistory,
  loadActiveExploration,
  loadDailyArticle,
  loadRecentArticle,
  loadSeenPageIds,
  loadSettings,
  markDailyDelivered,
  saveDailyArticle,
  saveSettings,
} from "./services/storage";
import {
  getActiveNode,
  getChoices,
  getTrailStats,
  selectExplorationNode,
  startExplorationFromArticle,
  startRandomExploration,
} from "./services/explorationService";
import { fetchRandomArticle } from "./services/wikiApi";
import { listenForNotificationOpen, notifyArticle } from "./services/notificationService";

const defaultSettings: AppSettings = {
  startWithWindows: false,
  notificationsEnabled: true,
  dailyTime: "09:00",
  qualityFilterEnabled: true,
};

export default function App() {
  const [view, setView] = useState<ViewName>("today");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [exploration, setExploration] = useState<Exploration | null>(null);
  const [dailyArticle, setDailyArticle] = useState<ArticleSummary | null>(null);
  const [recentArticle, setRecentArticle] = useState<ArticleSummary | null>(null);
  const [status, setStatus] = useState("Starting WikiRabbit...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeNode = useMemo(() => getActiveNode(exploration), [exploration]);
  const activeArticle = activeNode?.article ?? dailyArticle ?? recentArticle;
  const choices = useMemo(() => getChoices(exploration, exploration?.activeNodeId ?? null), [exploration]);
  const trailStats = useMemo(() => getTrailStats(exploration), [exploration]);

  async function refreshExploration() {
    const loaded = await loadActiveExploration();
    setExploration(loaded);
    return loaded;
  }

  async function loadInitialState() {
    setIsLoading(true);
    setError(null);
    try {
      const loadedSettings = await loadSettings();
      const autostartEnabled = await isEnabled().catch(() => loadedSettings.startWithWindows);
      const mergedSettings = { ...loadedSettings, startWithWindows: autostartEnabled };
      setSettings(mergedSettings);

      const today = localDateKey();
      const [loadedExploration, recent, daily] = await Promise.all([
        loadActiveExploration(),
        loadRecentArticle(),
        loadDailyArticle(today),
      ]);

      setExploration(loadedExploration);
      setRecentArticle(recent);
      setDailyArticle(daily?.article ?? null);
      await maybeDeliverDailyArticle(
        mergedSettings,
        Boolean(daily?.record.delivered),
        daily?.article ?? null,
        Boolean(loadedExploration),
      );
      setStatus(loadedExploration ? "Trail restored." : "Ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WikiRabbit could not start.");
      setStatus("Startup failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function maybeDeliverDailyArticle(
    currentSettings: AppSettings,
    deliveredToday: boolean,
    existingArticle: ArticleSummary | null,
    hasExploration = Boolean(exploration),
  ) {
    if (!shouldAttemptDailyDelivery(currentSettings, deliveredToday)) {
      return;
    }

    const today = localDateKey();
    const article = existingArticle ?? (await fetchRandomArticle(await loadSeenPageIds()));
    if (!existingArticle) {
      await saveDailyArticle(today, article, false);
      setDailyArticle(article);
    }

    const notified = await notifyArticle(article, "Today's rabbit hole");
    if (notified) {
      await markDailyDelivered(today);
      setStatus("Today's article delivered.");
    }

    if (!hasExploration) {
      const created = await startExplorationFromArticle(article, "daily");
      setExploration(created);
    }
  }

  async function handleStartRandom() {
    setIsLoading(true);
    setError(null);
    setStatus("Finding a random article...");
    try {
      const created = await startRandomExploration();
      setExploration(created);
      setRecentArticle(getActiveNode(created)?.article ?? null);
      setView("trail");
      setStatus("New trail started.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load a random article.");
      setStatus("Random article failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectNode(node: ArticleNode) {
    if (!exploration) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setStatus(`Opening ${node.article.title}...`);
    try {
      const updated = await selectExplorationNode(exploration, node.id);
      setExploration(updated);
      setRecentArticle(node.article);
      setView("trail");
      setStatus("Trail updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that article.");
      setStatus("Branch failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUseDailyArticle() {
    if (!dailyArticle) {
      await handleStartRandom();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const created = await startExplorationFromArticle(dailyArticle, "daily");
      setExploration(created);
      setRecentArticle(dailyArticle);
      setView("trail");
      setStatus("Daily trail started.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start from today's article.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTestNotification() {
    const article = activeArticle;
    if (!article) {
      setError("Load an article before testing notifications.");
      return;
    }
    const sent = await notifyArticle(article, "WikiRabbit test");
    setStatus(sent ? "Notification sent." : "Notifications are not allowed.");
  }

  async function handleSettingsChange(nextSettings: AppSettings) {
    setSettings(nextSettings);
    await saveSettings(nextSettings);
    if (nextSettings.startWithWindows) {
      await enable().catch(() => undefined);
    } else {
      await disable().catch(() => undefined);
    }
    setStatus("Settings saved.");
  }

  async function handleClearExploration() {
    await clearExplorationHistory();
    setExploration(null);
    setStatus("Exploration history cleared.");
  }

  async function handleClearCache() {
    await clearArticleCache();
    setRecentArticle(null);
    setDailyArticle(null);
    setStatus("Article cache cleared.");
  }

  useEffect(() => {
    void loadInitialState();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadDailyArticle(localDateKey()).then((daily) =>
        maybeDeliverDailyArticle(settings, Boolean(daily?.record.delivered), daily?.article ?? null, Boolean(exploration)),
      );
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [settings, exploration]);

  useEffect(() => {
    let unlistenTray: (() => void) | undefined;
    let unlistenNotification: (() => void) | undefined;

    void listen<string>("tray-action", (event) => {
      if (event.payload === "settings") {
        setView("settings");
      } else if (event.payload === "random") {
        void handleStartRandom();
      } else {
        setView("today");
      }
    }).then((listener) => {
      unlistenTray = listener;
    });

    void listenForNotificationOpen((pageId) => {
      if (pageId && exploration) {
        const node = exploration.nodes.find((candidate) => candidate.article.pageId === pageId);
        if (node) {
          void handleSelectNode(node);
          return;
        }
      }
      setView("today");
    }).then((listener) => {
      unlistenNotification = listener;
    }).catch(() => undefined);

    return () => {
      unlistenTray?.();
      unlistenNotification?.();
    };
  }, [exploration]);

  return (
    <AppShell
      view={view}
      settings={settings}
      exploration={exploration}
      activeArticle={activeArticle ?? null}
      dailyArticle={dailyArticle}
      choices={choices}
      trailStats={trailStats}
      isLoading={isLoading}
      error={error}
      status={status}
      onViewChange={setView}
      onStartRandom={handleStartRandom}
      onUseDailyArticle={handleUseDailyArticle}
      onSelectNode={handleSelectNode}
      onRetry={() => void refreshExploration()}
      onTestNotification={handleTestNotification}
      onSettingsChange={handleSettingsChange}
      onClearExploration={handleClearExploration}
      onClearCache={handleClearCache}
    />
  );
}
