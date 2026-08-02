import Database from "@tauri-apps/plugin-sql";
import type { AppSettings, ArticleNode, ArticleSummary, BranchLabel, DailyArticleRecord, Exploration, NodeState } from "../types";

const DB_PATH = "sqlite:wikirabbit.db";

let dbPromise: Promise<Database> | null = null;

interface SettingsRow {
  key: string;
  value: string;
}

interface ArticleRow {
  page_id: number;
  title: string;
  description: string | null;
  extract: string;
  thumbnail_url: string | null;
  canonical_url: string;
  fetched_at: string;
}

interface ExplorationRow {
  id: string;
  root_node_id: string;
  root_page_id: number;
  active_node_id: string;
  created_at: string;
  updated_at: string;
}

interface NodeRow extends ArticleRow {
  id: string;
  exploration_id: string;
  parent_node_id: string | null;
  branch_label: BranchLabel | null;
  visited: number;
  depth: number;
  state: NodeState;
  created_at: string;
}

interface DailyRow {
  delivery_date: string;
  page_id: number;
  delivered: number;
  delivered_at: string | null;
}

export async function getDb(): Promise<Database> {
  dbPromise ??= Database.load(DB_PATH);
  return dbPromise;
}

function articleFromRow(row: ArticleRow): ArticleSummary {
  return {
    pageId: row.page_id,
    title: row.title,
    description: row.description ?? "",
    extract: row.extract,
    thumbnailUrl: row.thumbnail_url,
    canonicalUrl: row.canonical_url,
    fetchedAt: row.fetched_at,
  };
}

function nodeFromRow(row: NodeRow): ArticleNode {
  return {
    id: row.id,
    explorationId: row.exploration_id,
    article: articleFromRow(row),
    parentNodeId: row.parent_node_id,
    branchLabel: row.branch_label ?? "Root",
    visited: row.visited === 1,
    depth: row.depth,
    state: row.state,
    createdAt: row.created_at,
  };
}

function booleanValue(rows: SettingsRow[], key: string, fallback: boolean): boolean {
  const value = rows.find((row) => row.key === key)?.value;
  if (value === undefined) {
    return fallback;
  }
  return value === "true";
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.select<SettingsRow[]>("SELECT key, value FROM settings");
  return {
    startWithWindows: booleanValue(rows, "start_with_windows", false),
    notificationsEnabled: booleanValue(rows, "notifications_enabled", true),
    dailyTime: rows.find((row) => row.key === "daily_time")?.value ?? "09:00",
    qualityFilterEnabled: booleanValue(rows, "quality_filter_enabled", true),
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb();
  const entries: Array<[string, string]> = [
    ["start_with_windows", String(settings.startWithWindows)],
    ["notifications_enabled", String(settings.notificationsEnabled)],
    ["daily_time", settings.dailyTime],
    ["quality_filter_enabled", String(settings.qualityFilterEnabled)],
  ];

  for (const [key, value] of entries) {
    await db.execute("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [
      key,
      value,
    ]);
  }
}

export async function saveArticle(article: ArticleSummary): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO articles (page_id, title, description, extract, thumbnail_url, canonical_url, fetched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT(page_id) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       extract = excluded.extract,
       thumbnail_url = excluded.thumbnail_url,
       canonical_url = excluded.canonical_url,
       fetched_at = excluded.fetched_at`,
    [
      article.pageId,
      article.title,
      article.description,
      article.extract,
      article.thumbnailUrl,
      article.canonicalUrl,
      article.fetchedAt,
    ],
  );
}

export async function recordDisplayedArticle(article: ArticleSummary, source: string): Promise<void> {
  const db = await getDb();
  await saveArticle(article);
  const now = new Date().toISOString();
  await db.execute("INSERT INTO article_history (page_id, displayed_at, source) VALUES ($1, $2, $3)", [
    article.pageId,
    now,
    source,
  ]);
  await db.execute(
    `INSERT INTO recent_article (id, page_id, updated_at)
     VALUES (1, $1, $2)
     ON CONFLICT(id) DO UPDATE SET page_id = excluded.page_id, updated_at = excluded.updated_at`,
    [article.pageId, now],
  );
}

export async function loadRecentArticle(): Promise<ArticleSummary | null> {
  const db = await getDb();
  const rows = await db.select<ArticleRow[]>(
    `SELECT a.* FROM recent_article r
     JOIN articles a ON a.page_id = r.page_id
     WHERE r.id = 1`,
  );
  return rows[0] ? articleFromRow(rows[0]) : null;
}

export async function loadSeenPageIds(): Promise<Set<number>> {
  const db = await getDb();
  const rows = await db.select<Array<{ page_id: number }>>("SELECT DISTINCT page_id FROM article_history");
  return new Set(rows.map((row) => row.page_id));
}

export async function createExploration(rootArticle: ArticleSummary): Promise<Exploration> {
  const db = await getDb();
  await saveArticle(rootArticle);
  const now = new Date().toISOString();
  const explorationId = crypto.randomUUID();
  const rootNodeId = crypto.randomUUID();

  await db.execute(
    `INSERT INTO explorations (id, root_node_id, root_page_id, active_node_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [explorationId, rootNodeId, rootArticle.pageId, rootNodeId, now, now],
  );
  await db.execute(
    `INSERT INTO article_nodes (id, exploration_id, page_id, parent_node_id, branch_label, visited, depth, state, created_at)
     VALUES ($1, $2, $3, NULL, 'Root', 1, 0, 'root', $4)`,
    [rootNodeId, explorationId, rootArticle.pageId, now],
  );

  return {
    id: explorationId,
    rootNodeId,
    rootPageId: rootArticle.pageId,
    activeNodeId: rootNodeId,
    createdAt: now,
    updatedAt: now,
    nodes: [
      {
        id: rootNodeId,
        explorationId,
        article: rootArticle,
        parentNodeId: null,
        branchLabel: "Root",
        visited: true,
        depth: 0,
        state: "root",
        createdAt: now,
      },
    ],
  };
}

export async function loadActiveExploration(): Promise<Exploration | null> {
  const db = await getDb();
  const explorationRows = await db.select<ExplorationRow[]>("SELECT * FROM explorations ORDER BY updated_at DESC LIMIT 1");
  const exploration = explorationRows[0];
  if (!exploration) {
    return null;
  }

  const nodeRows = await db.select<NodeRow[]>(
    `SELECT n.*, a.title, a.description, a.extract, a.thumbnail_url, a.canonical_url, a.fetched_at
     FROM article_nodes n
     JOIN articles a ON a.page_id = n.page_id
     WHERE n.exploration_id = $1
     ORDER BY n.depth ASC, n.created_at ASC`,
    [exploration.id],
  );

  return {
    id: exploration.id,
    rootNodeId: exploration.root_node_id,
    rootPageId: exploration.root_page_id,
    activeNodeId: exploration.active_node_id,
    createdAt: exploration.created_at,
    updatedAt: exploration.updated_at,
    nodes: nodeRows.map(nodeFromRow),
  };
}

export async function addChoiceNodes(parent: ArticleNode, choices: ArticleSummary[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  for (const [index, article] of choices.entries()) {
    await saveArticle(article);
    const label: BranchLabel = index === 0 ? "A" : "B";
    await db.execute(
      `INSERT OR IGNORE INTO article_nodes
       (id, exploration_id, page_id, parent_node_id, branch_label, visited, depth, state, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, $6, 'available', $7)`,
      [crypto.randomUUID(), parent.explorationId, article.pageId, parent.id, label, parent.depth + 1, now],
    );
  }
}

export async function setActiveNode(explorationId: string, nodeId: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute("UPDATE article_nodes SET visited = 1, state = 'visited' WHERE id = $1", [nodeId]);
  await db.execute("UPDATE explorations SET active_node_id = $1, updated_at = $2 WHERE id = $3", [nodeId, now, explorationId]);
}

export async function loadChildren(parentNodeId: string): Promise<ArticleNode[]> {
  const db = await getDb();
  const rows = await db.select<NodeRow[]>(
    `SELECT n.*, a.title, a.description, a.extract, a.thumbnail_url, a.canonical_url, a.fetched_at
     FROM article_nodes n
     JOIN articles a ON a.page_id = n.page_id
     WHERE n.parent_node_id = $1
     ORDER BY n.branch_label ASC`,
    [parentNodeId],
  );
  return rows.map(nodeFromRow);
}

export async function saveDailyArticle(date: string, article: ArticleSummary, delivered: boolean): Promise<void> {
  const db = await getDb();
  await saveArticle(article);
  await db.execute(
    `INSERT INTO daily_articles (delivery_date, page_id, delivered, delivered_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(delivery_date) DO UPDATE SET
       page_id = excluded.page_id,
       delivered = excluded.delivered,
       delivered_at = excluded.delivered_at`,
    [date, article.pageId, delivered ? 1 : 0, delivered ? new Date().toISOString() : null],
  );
}

export async function loadDailyArticle(date: string): Promise<{ record: DailyArticleRecord; article: ArticleSummary } | null> {
  const db = await getDb();
  const rows = await db.select<Array<DailyRow & ArticleRow>>(
    `SELECT d.delivery_date, d.page_id, d.delivered, d.delivered_at,
            a.title, a.description, a.extract, a.thumbnail_url, a.canonical_url, a.fetched_at
     FROM daily_articles d
     JOIN articles a ON a.page_id = d.page_id
     WHERE d.delivery_date = $1`,
    [date],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    record: {
      deliveryDate: row.delivery_date,
      pageId: row.page_id,
      delivered: row.delivered === 1,
      deliveredAt: row.delivered_at,
    },
    article: articleFromRow(row),
  };
}

export async function markDailyDelivered(date: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE daily_articles SET delivered = 1, delivered_at = $1 WHERE delivery_date = $2", [
    new Date().toISOString(),
    date,
  ]);
}

export async function clearExplorationHistory(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM article_nodes");
  await db.execute("DELETE FROM explorations");
}

export async function clearArticleCache(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM article_history");
  await db.execute("DELETE FROM recent_article");
  await db.execute("DELETE FROM daily_articles");
  await db.execute("DELETE FROM articles WHERE page_id NOT IN (SELECT page_id FROM article_nodes)");
}
