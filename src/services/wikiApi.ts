import { fetch } from "@tauri-apps/plugin-http";
import type { ArticleSummary } from "../types";

const API_USER_AGENT = "WikiRabbit/0.1 (RailCoding demo)";
const ACTION_API = "https://en.wikipedia.org/w/api.php";
const SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary";
const MAX_RANDOM_ATTEMPTS = 20;
const MAX_RELATED_SUMMARY_CHECKS = 32;

interface RandomPage {
  id?: number;
  pageid?: number;
  title: string;
}

interface SummaryResponse {
  pageid?: number;
  title?: string;
  displaytitle?: string;
  description?: string;
  extract?: string;
  type?: string;
  namespace?: { id?: number };
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
}

interface LinksPage {
  links?: Array<{ title: string; ns?: number }>;
}

interface LinksResponse {
  query?: {
    pages?: Record<string, LinksPage>;
  };
  continue?: Record<string, string>;
}

export class WikiApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WikiApiError";
  }
}

export function normalizeTitle(title: string): string {
  return title.trim().replace(/_/g, " ").replace(/\s+/g, " ").toLowerCase();
}

export function isLikelyDateOrYearTitle(title: string): boolean {
  const value = title.trim();
  if (/^\d{1,4}$/.test(value)) {
    return true;
  }
  if (/^\d{1,2}\s+[A-Z][a-z]+\s+\d{1,4}$/.test(value)) {
    return true;
  }
  if (/^[A-Z][a-z]+\s+\d{1,2}$/.test(value)) {
    return true;
  }
  return /^[A-Z][a-z]+\s+\d{1,4}$/.test(value);
}

export function isPoorCandidateTitle(title: string): boolean {
  const trimmed = title.trim();
  return (
    trimmed.length < 2 ||
    trimmed.includes(":") ||
    /^List of\b/i.test(trimmed) ||
    isLikelyDateOrYearTitle(trimmed)
  );
}

export function articleFromSummary(summary: SummaryResponse): ArticleSummary | null {
  const pageId = summary.pageid;
  const title = summary.title;
  const extract = summary.extract?.trim() ?? "";
  const namespaceId = summary.namespace?.id;
  const canonicalUrl = summary.content_urls?.desktop?.page;

  if (!pageId || !title || !canonicalUrl || extract.length < 80) {
    return null;
  }
  if (summary.type && summary.type !== "standard") {
    return null;
  }
  if (namespaceId !== undefined && namespaceId !== 0) {
    return null;
  }

  return {
    pageId,
    title,
    description: summary.description?.trim() ?? "",
    extract,
    thumbnailUrl: summary.thumbnail?.source ?? null,
    canonicalUrl,
    fetchedAt: new Date().toISOString(),
  };
}

async function getJson<T>(url: URL): Promise<T> {
  const response = await fetch(url.toString(), {
    headers: {
      "Api-User-Agent": API_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new WikiApiError(`Wikipedia request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchSummary(title: string): Promise<ArticleSummary | null> {
  const url = new URL(`${SUMMARY_API}/${encodeURIComponent(title)}`);
  const summary = await getJson<SummaryResponse>(url);
  return articleFromSummary(summary);
}

async function fetchRandomBatch(limit: number): Promise<RandomPage[]> {
  const url = new URL(ACTION_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("list", "random");
  url.searchParams.set("rnnamespace", "0");
  url.searchParams.set("rnfilterredir", "nonredirects");
  url.searchParams.set("rnlimit", String(limit));

  const data = await getJson<{ query?: { random?: RandomPage[] } }>(url);
  return data.query?.random ?? [];
}

export async function fetchRandomArticle(seenPageIds = new Set<number>()): Promise<ArticleSummary> {
  const rejectedTitles = new Set<string>();

  for (let attempt = 0; attempt < MAX_RANDOM_ATTEMPTS; attempt += 1) {
    const pages = await fetchRandomBatch(5);

    for (const page of pages) {
      const pageId = page.pageid ?? page.id;
      if (!pageId || seenPageIds.has(pageId) || rejectedTitles.has(normalizeTitle(page.title))) {
        continue;
      }

      rejectedTitles.add(normalizeTitle(page.title));
      const article = await fetchSummary(page.title);
      if (article && !seenPageIds.has(article.pageId)) {
        return article;
      }
    }
  }

  throw new WikiApiError("Could not find a usable random Wikipedia article.");
}

async function fetchLinkedTitles(title: string): Promise<string[]> {
  const titles: string[] = [];
  let continuation: Record<string, string> | undefined;

  for (let page = 0; page < 3; page += 1) {
    const url = new URL(ACTION_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("prop", "links");
    url.searchParams.set("plnamespace", "0");
    url.searchParams.set("pllimit", "max");
    url.searchParams.set("titles", title);

    if (continuation) {
      for (const [key, value] of Object.entries(continuation)) {
        url.searchParams.set(key, value);
      }
    }

    const data = await getJson<LinksResponse>(url);
    const pages = Object.values(data.query?.pages ?? {});
    for (const linkedPage of pages) {
      for (const link of linkedPage.links ?? []) {
        if ((link.ns ?? 0) === 0) {
          titles.push(link.title);
        }
      }
    }

    continuation = data.continue;
    if (!continuation) {
      break;
    }
  }

  return titles;
}

export async function fetchRelatedChoices(
  article: ArticleSummary,
  visitedPageIds: Set<number>,
): Promise<ArticleSummary[]> {
  const linkedTitles = await fetchLinkedTitles(article.title);
  const choices: ArticleSummary[] = [];
  const seenTitles = new Set<string>([normalizeTitle(article.title)]);

  for (const title of linkedTitles) {
    const normalized = normalizeTitle(title);
    if (seenTitles.has(normalized) || isPoorCandidateTitle(title)) {
      continue;
    }

    seenTitles.add(normalized);
    if (seenTitles.size > MAX_RELATED_SUMMARY_CHECKS) {
      break;
    }

    const summary = await fetchSummary(title);
    if (!summary || visitedPageIds.has(summary.pageId)) {
      continue;
    }

    const nearDuplicate = choices.some((choice) => normalizeTitle(choice.title) === normalizeTitle(summary.title));
    if (!nearDuplicate) {
      choices.push(summary);
    }

    if (choices.length === 2) {
      break;
    }
  }

  return choices;
}
