CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  page_id INTEGER PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  extract TEXT NOT NULL,
  thumbnail_url TEXT,
  canonical_url TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_history (
  page_id INTEGER NOT NULL,
  displayed_at TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (page_id, displayed_at)
);

CREATE TABLE IF NOT EXISTS recent_article (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  page_id INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_articles (
  delivery_date TEXT PRIMARY KEY NOT NULL,
  page_id INTEGER NOT NULL,
  delivered INTEGER NOT NULL DEFAULT 0,
  delivered_at TEXT
);

CREATE TABLE IF NOT EXISTS explorations (
  id TEXT PRIMARY KEY NOT NULL,
  root_node_id TEXT NOT NULL,
  root_page_id INTEGER NOT NULL,
  active_node_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_nodes (
  id TEXT PRIMARY KEY NOT NULL,
  exploration_id TEXT NOT NULL,
  page_id INTEGER NOT NULL,
  parent_node_id TEXT,
  branch_label TEXT,
  visited INTEGER NOT NULL DEFAULT 0,
  depth INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'available',
  created_at TEXT NOT NULL,
  FOREIGN KEY (exploration_id) REFERENCES explorations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_nodes_exploration ON article_nodes(exploration_id);
CREATE INDEX IF NOT EXISTS idx_article_nodes_parent ON article_nodes(parent_node_id);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('start_with_windows', 'false'),
  ('notifications_enabled', 'true'),
  ('daily_time', '09:00'),
  ('quality_filter_enabled', 'true');
