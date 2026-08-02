import { ArrowRight, Bell, ExternalLink, RefreshCw } from "lucide-react";
import type { ArticleNode, ArticleSummary } from "../types";
import { ChoiceCards } from "./ChoiceCards";

interface ArticleReaderProps {
  article: ArticleSummary | null;
  choices: ArticleNode[];
  isTodayView: boolean;
  isLoading: boolean;
  error: string | null;
  status: string;
  onRetry: () => void;
  onStartRandom: () => void;
  onUseDailyArticle: () => void;
  onSelectChoice: (node: ArticleNode) => void;
  onTestNotification: () => void;
}

function paragraphs(extract: string): string[] {
  const sentences = extract.split(/(?<=\.)\s+/).filter(Boolean);
  if (sentences.length <= 3) {
    return [extract];
  }
  return [sentences.slice(0, 2).join(" "), sentences.slice(2, 5).join(" ")];
}

export function ArticleReader({
  article,
  choices,
  isTodayView,
  isLoading,
  error,
  status,
  onRetry,
  onStartRandom,
  onUseDailyArticle,
  onSelectChoice,
  onTestNotification,
}: ArticleReaderProps) {
  if (!article && isLoading) {
    return (
      <div className="reader-empty">
        <RefreshCw className="spin" size={28} aria-hidden />
        <h2>Loading WikiRabbit</h2>
        <p>{status}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="reader-empty">
        <h2>No article loaded</h2>
        <p>{error ?? "Start a trail to fetch a usable random Wikipedia article."}</p>
        <button className="primary-button" onClick={onStartRandom} disabled={isLoading}>
          <RefreshCw size={18} aria-hidden />
          <span>Find Article</span>
        </button>
      </div>
    );
  }

  return (
    <article className="article-reader">
      <div className="reader-toolbar">
        <button className="ghost-button" onClick={onStartRandom} disabled={isLoading} title="Request another random article">
          <RefreshCw size={18} aria-hidden />
        </button>
        <button className="ghost-button" onClick={onTestNotification} title="Send test notification">
          <Bell size={18} aria-hidden />
        </button>
      </div>

      <header className="article-header">
        <p className="eyebrow">{isTodayView ? "Today" : "Current article"}</p>
        <h1>{article.title}</h1>
        {article.description ? <p className="article-description">{article.description}</p> : null}
      </header>

      {article.thumbnailUrl ? (
        <img className="lead-image" src={article.thumbnailUrl} alt="" />
      ) : (
        <div className="lead-image image-fallback">Text-only article</div>
      )}

      <div className="extract">
        {paragraphs(article.extract).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="reader-actions">
        <a className="text-link" href={article.canonicalUrl} target="_blank" rel="noreferrer">
          <span>Read on Wikipedia</span>
          <ExternalLink size={16} aria-hidden />
        </a>
        {isTodayView ? (
          <button className="primary-button" onClick={onUseDailyArticle} disabled={isLoading}>
            <span>Follow this article</span>
            <ArrowRight size={18} aria-hidden />
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="inline-error">
          <span>{error}</span>
          <button onClick={onRetry}>Retry</button>
        </div>
      ) : null}

      {!isTodayView ? (
        <ChoiceCards choices={choices} isLoading={isLoading} onSelectChoice={onSelectChoice} />
      ) : null}
    </article>
  );
}
