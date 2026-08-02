import { ArrowRight } from "lucide-react";
import type { ArticleNode } from "../types";

interface ChoiceCardsProps {
  choices: ArticleNode[];
  isLoading: boolean;
  onSelectChoice: (node: ArticleNode) => void;
}

export function ChoiceCards({ choices, isLoading, onSelectChoice }: ChoiceCardsProps) {
  return (
    <section className="choices-section" aria-label="Article choices">
      <div>
        <h2>Where to next?</h2>
        <p>Choose an article to continue your rabbit hole.</p>
      </div>

      {choices.length === 0 ? (
        <div className="choice-empty">No usable linked articles are ready yet.</div>
      ) : (
        <div className="choice-grid">
          {choices.map((choice) => (
            <button
              key={choice.id}
              className={`choice-card ${choice.branchLabel === "A" ? "branch-a" : "branch-b"}`}
              onClick={() => onSelectChoice(choice)}
              disabled={isLoading}
            >
              {choice.article.thumbnailUrl ? <img src={choice.article.thumbnailUrl} alt="" /> : <div className="choice-fallback" />}
              <span className="choice-copy">
                <strong>{choice.article.title}</strong>
                <small>{choice.article.description || choice.article.extract.slice(0, 94)}</small>
                <em>
                  Follow path {choice.branchLabel}
                  <ArrowRight size={16} aria-hidden />
                </em>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
