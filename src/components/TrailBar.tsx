import { ChevronRight } from "lucide-react";
import type { ArticleNode, ArticleSummary, Exploration } from "../types";
import { getActivePath } from "../services/explorationService";

interface TrailBarProps {
  exploration: Exploration | null;
  activeArticle: ArticleSummary | null;
  onSelectNode: (node: ArticleNode) => void;
}

export function TrailBar({ exploration, activeArticle, onSelectNode }: TrailBarProps) {
  const path = getActivePath(exploration);

  return (
    <footer className="trail-bar">
      <strong>Current Trail</strong>
      <div className="trail-path">
        {path.length > 0 ? (
          path.map((node, index) => (
            <span key={node.id} className="crumb-wrap">
              {index > 0 ? <ChevronRight size={15} aria-hidden /> : null}
              <button className={activeArticle?.pageId === node.article.pageId ? "crumb active" : "crumb"} onClick={() => onSelectNode(node)}>
                {node.article.title}
              </button>
            </span>
          ))
        ) : (
          <span className="trail-placeholder">No active trail</span>
        )}
      </div>
      <span>{exploration ? `${exploration.nodes.length} articles` : "0 articles"}</span>
    </footer>
  );
}
