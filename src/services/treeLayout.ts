import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";
import type { ArticleNode, Exploration } from "../types";
import { getActivePath } from "./explorationService";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 104;

export interface RabbitNodeData extends Record<string, unknown> {
  node: ArticleNode;
  isActive: boolean;
  isOnActivePath: boolean;
  state: string;
}

export function buildFlowElements(exploration: Exploration | null): {
  nodes: Node<RabbitNodeData>[];
  edges: Edge[];
} {
  if (!exploration) {
    return { nodes: [], edges: [] };
  }

  const activePathIds = new Set(getActivePath(exploration).map((node) => node.id));
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 78, marginx: 16, marginy: 16 });

  for (const node of exploration.nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const node of exploration.nodes) {
    if (node.parentNodeId) {
      graph.setEdge(node.parentNodeId, node.id);
    }
  }

  dagre.layout(graph);

  const nodes: Node<RabbitNodeData>[] = exploration.nodes.map((node) => {
    const position = graph.node(node.id);
    const isActive = node.id === exploration.activeNodeId;
    const state = node.id === exploration.rootNodeId ? "root" : isActive ? "current" : node.visited ? "visited" : node.state;

    return {
      id: node.id,
      type: "rabbitArticle",
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      data: {
        node,
        isActive,
        isOnActivePath: activePathIds.has(node.id),
        state,
      },
      draggable: false,
    };
  });

  const edges: Edge[] = exploration.nodes
    .filter((node) => node.parentNodeId)
    .map((node) => ({
      id: `${node.parentNodeId}-${node.id}`,
      source: node.parentNodeId as string,
      target: node.id,
      type: "smoothstep",
      animated: activePathIds.has(node.id),
      className: activePathIds.has(node.id) ? "flow-edge-active" : "flow-edge-muted",
    }));

  return { nodes, edges };
}
