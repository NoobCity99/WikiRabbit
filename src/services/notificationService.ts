import {
  isPermissionGranted,
  onAction,
  requestPermission,
  sendNotification,
  type Options,
} from "@tauri-apps/plugin-notification";
import type { ArticleSummary } from "../types";

export async function ensureNotificationPermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  return granted;
}

export async function notifyArticle(article: ArticleSummary, title = "WikiRabbit"): Promise<boolean> {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return false;
  }

  sendNotification({
    id: article.pageId,
    title: `${title}: ${article.title}`,
    body: article.description || article.extract.slice(0, 160),
    extra: { pageId: article.pageId },
    autoCancel: true,
  });
  return true;
}

export async function listenForNotificationOpen(onOpen: (pageId: number | null) => void): Promise<() => void> {
  const listener = await onAction((notification: Options) => {
    const pageId = Number(notification.extra?.pageId);
    onOpen(Number.isFinite(pageId) ? pageId : null);
  });
  return () => {
    void listener.unregister();
  };
}
