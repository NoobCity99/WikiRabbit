import { memo, useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Node,
  type NodeProps,
  type NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import type { ArticleNode, Exploration } from "../types";
import { buildFlowElements, type RabbitNodeData } from "../services/treeLayout";

interface RabbitTreeProps {
  exploration: Exploration | null;
  onSelectNode: (node: ArticleNode) => void;
}

type RabbitFlowNode = Node<RabbitNodeData, "rabbitArticle">;

const RabbitArticleNode = memo(function RabbitArticleNode({ data }: NodeProps<RabbitFlowNode>) {
  const node = data.node;
  return (
    <div className={`rabbit-node ${data.state} ${data.isOnActivePath ? "active-path" : ""}`}>
      {node.article.thumbnailUrl ? <img src={node.article.thumbnailUrl} alt="" /> : <div className="node-fallback" />}
      <div>
        <small>{node.branchLabel}</small>
        <strong>{node.article.title}</strong>
        <span>{node.visited ? "Visited" : "Offered"}</span>
      </div>
    </div>
  );
});

function RabbitTreeInner({ exploration, onSelectNode }: RabbitTreeProps) {
  const { nodes, edges } = useMemo(() => buildFlowElements(exploration), [exploration]);
  const flow = useReactFlow();
  const nodeTypes = useMemo<NodeTypes>(() => ({ rabbitArticle: RabbitArticleNode }), []);

  if (!exploration) {
    return (
      <div className="tree-empty">
        <strong>No trail yet</strong>
        <span>Start with today&apos;s article or request a random one.</span>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.35}
      maxZoom={1.5}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesFocusable={false}
      onNodeClick={(_, node) => onSelectNode((node.data as RabbitNodeData).node)}
      onPaneClick={() => flow.fitView({ padding: 0.2, duration: 250 })}
    >
      <Background color="rgba(255,255,255,0.08)" gap={22} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function RabbitTree(props: RabbitTreeProps) {
  return (
    <ReactFlowProvider>
      <RabbitTreeInner {...props} />
    </ReactFlowProvider>
  );
}
