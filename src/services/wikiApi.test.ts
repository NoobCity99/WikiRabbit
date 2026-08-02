import { describe, expect, it } from "vitest";
import { articleFromSummary, isLikelyDateOrYearTitle, isPoorCandidateTitle } from "./wikiApi";

describe("wikiApi filtering", () => {
  it("rejects date and year titles", () => {
    expect(isLikelyDateOrYearTitle("1945")).toBe(true);
    expect(isLikelyDateOrYearTitle("January 12")).toBe(true);
    expect(isLikelyDateOrYearTitle("Mechanical clock")).toBe(false);
  });

  it("rejects poor related titles", () => {
    expect(isPoorCandidateTitle("List of clocks")).toBe(true);
    expect(isPoorCandidateTitle("File:Clock.jpg")).toBe(true);
    expect(isPoorCandidateTitle("Marine chronometer")).toBe(false);
  });

  it("converts usable page summaries into app articles", () => {
    const article = articleFromSummary({
      pageid: 42,
      title: "Clockwork automaton",
      description: "mechanical device",
      extract: "Clockwork automatons are mechanical devices that perform actions. They are historically notable and have a meaningful introduction.",
      type: "standard",
      namespace: { id: 0 },
      thumbnail: { source: "https://upload.wikimedia.org/example.jpg" },
      content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Clockwork_automaton" } },
    });

    expect(article?.pageId).toBe(42);
    expect(article?.thumbnailUrl).toContain("example.jpg");
  });
});
