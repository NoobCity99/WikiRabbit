import { describe, expect, it } from "vitest";
import { isAtOrAfterDailyTime, localDateKey, shouldAttemptDailyDelivery } from "./dailyScheduler";
import type { AppSettings } from "../types";

const settings: AppSettings = {
  startWithWindows: false,
  notificationsEnabled: true,
  dailyTime: "09:00",
  qualityFilterEnabled: true,
};

describe("dailyScheduler", () => {
  it("formats local date keys", () => {
    expect(localDateKey(new Date(2026, 7, 2, 8, 30))).toBe("2026-08-02");
  });

  it("checks daily delivery time", () => {
    expect(isAtOrAfterDailyTime("09:00", new Date(2026, 7, 2, 8, 59))).toBe(false);
    expect(isAtOrAfterDailyTime("09:00", new Date(2026, 7, 2, 9, 0))).toBe(true);
  });

  it("does not deliver twice in one day", () => {
    expect(shouldAttemptDailyDelivery(settings, false, new Date(2026, 7, 2, 9, 1))).toBe(true);
    expect(shouldAttemptDailyDelivery(settings, true, new Date(2026, 7, 2, 9, 1))).toBe(false);
  });
});
