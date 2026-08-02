import type { AppSettings } from "../types";

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isAtOrAfterDailyTime(dailyTime: string, date = new Date()): boolean {
  const [hourText, minuteText] = dailyTime.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return true;
  }
  const scheduled = new Date(date);
  scheduled.setHours(hour, minute, 0, 0);
  return date >= scheduled;
}

export function shouldAttemptDailyDelivery(settings: AppSettings, deliveredToday: boolean, date = new Date()): boolean {
  return settings.notificationsEnabled && !deliveredToday && isAtOrAfterDailyTime(settings.dailyTime, date);
}
