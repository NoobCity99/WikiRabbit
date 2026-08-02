import type { ArticleNode, ArticleSummary, Exploration, TrailStats } from "../types";
import { fetchRandomArticle, fetchRelatedChoices } from "./wikiApi";
import {
  addChoiceNodes,
  createExploration,
  loadActiveExploration,
  loadChildren,
  loadSeenPageIds,
  recordDisplayedArticle,
  setActiveNode,
} from "./storage";

export function getActiveNode(exploration: Exploration | null): ArticleNode | null {
  if (!exploration) {
    return null;
  }
  return exploration.nodes.find((node) => node.id === exploration.activeNodeId) ?? null;
}

export function getChoices(exploration: Exploration | null, nodeId: string | null): ArticleNode[] {
  if (!exploration || !nodeId) {
    return [];
  }
  return exploration.nodes
    .filter((node) => node.parentNodeId === nodeId)
    .sort((left, right) => left.branchLabel.localeCompare(right.branchLabel));
}

export function getVisitedPageIds(exploration: Exploration | null): Set<number> {
  return new Set(exploration?.nodes.filter((node) => node.visited).map((node) => node.article.pageId) ?? []);
}

export function getActivePath(exploration: Exploration | null): ArticleNode[] {
  if (!exploration) {
    return [];
  }
  const byId = new Map(exploration.nodes.map((node) => [node.id, node]));
  const path: ArticleNode[] = [];
  let current = byId.get(exploration.activeNodeId) ?? null;

  while (current) {
    path.unshift(current);
    current = current.parentNodeId ? byId.get(current.parentNodeId) ?? null : null;
  }

  return path;
}

export function getTrailStats(exploration: Exploration | null): TrailStats {
  const active = getActiveNode(exploration);
  return {
    depth: active?.depth ?? 0,
    visitedCount: exploration?.nodes.filter((node) => node.visited).length ?? 0,
    totalCount: exploration?.nodes.length ?? 0,
    startedAt: exploration?.createdAt ?? null,
  };
}

export async function ensureChoices(exploration: Exploration, node: ArticleNode): Promise<Exploration> {
  const existingChoices = await loadChildren(node.id);
  if (existingChoices.length > 0) {
    return (await loadActiveExploration()) ?? exploration;
  }

  const choices = await fetchRelatedChoices(node.article, getVisitedPageIds(exploration));
  if (choices.length > 0) {
    await addChoiceNodes(node, choices);
  }
  return (await loadActiveExploration()) ?? exploration;
}

export async function startExplorationFromArticle(article: ArticleSummary, source: string): Promise<Exploration> {
  await recordDisplayedArticle(article, source);
  const created = await createExploration(article);
  return ensureChoices(created, created.nodes[0]);
}

export async function startRandomExploration(): Promise<Exploration> {
  const seenPageIds = await loadSeenPageIds();
  const article = await fetchRandomArticle(seenPageIds);
  return startExplorationFromArticle(article, "random");
}

export async function selectExplorationNode(exploration: Exploration, nodeId: string): Promise<Exploration> {
  const selected = exploration.nodes.find((node) => node.id === nodeId);
  if (!selected) {
    return exploration;
  }

  await recordDisplayedArticle(selected.article, "exploration");
  await setActiveNode(exploration.id, nodeId);
  const refreshed = (await loadActiveExploration()) ?? exploration;
  const activeNode = getActiveNode(refreshed);
  return activeNode ? ensureChoices(refreshed, activeNode) : refreshed;
}
