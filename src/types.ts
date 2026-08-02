export type ViewName = "today" | "trail" | "settings";

export interface ArticleSummary {
  pageId: number;
  title: string;
  description: string;
  extract: string;
  thumbnailUrl: string | null;
  canonicalUrl: string;
  fetchedAt: string;
}

export type BranchLabel = "A" | "B" | "Root";
export type NodeState = "root" | "current" | "visited" | "available" | "abandoned" | "loading" | "failed";

export interface ArticleNode {
  id: string;
  explorationId: string;
  article: ArticleSummary;
  parentNodeId: string | null;
  branchLabel: BranchLabel;
  visited: boolean;
  depth: number;
  state: NodeState;
  createdAt: string;
}

export interface Exploration {
  id: string;
  rootNodeId: string;
  rootPageId: number;
  activeNodeId: string;
  createdAt: string;
  updatedAt: string;
  nodes: ArticleNode[];
}

export interface AppSettings {
  startWithWindows: boolean;
  notificationsEnabled: boolean;
  dailyTime: string;
  qualityFilterEnabled: boolean;
}

export interface DailyArticleRecord {
  deliveryDate: string;
  pageId: number;
  delivered: boolean;
  deliveredAt: string | null;
}

export interface TrailStats {
  depth: number;
  visitedCount: number;
  totalCount: number;
  startedAt: string | null;
}
