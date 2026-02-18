import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/shared/lib/cn";
import { getArticleById, getArticlesByCategory } from "../articles";
import { ArticleView } from "../components/ArticleView";

export function HelpArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(
    null
  );

  const article = articleId ? getArticleById(articleId) : undefined;

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <HelpCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Artigo não encontrado</h2>
        <p className="text-muted-foreground mb-6">
          O artigo que você procura não existe ou foi removido.
        </p>
        <Button onClick={() => navigate("/help")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a Central de Ajuda
        </Button>
      </div>
    );
  }

  const relatedArticles = getArticlesByCategory(article.category).filter(
    (a) => a.id !== article.id
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/help")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a Central de Ajuda
      </Button>

      {/* Article header */}
      <div>
        <Badge variant="secondary" className="mb-3">
          {article.categoryLabel}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">{article.title}</h1>
      </div>

      <Separator />

      {/* Article content */}
      <ArticleView content={article.content} />

      <Separator />

      {/* Feedback section */}
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm font-medium">Este artigo foi útil?</p>
        <div className="flex gap-2">
          <Button
            variant={feedback === "helpful" ? "default" : "outline"}
            size="sm"
            onClick={() => setFeedback("helpful")}
            className={cn(
              "gap-2",
              feedback === "helpful" && "bg-green-600 hover:bg-green-700"
            )}
          >
            <ThumbsUp className="h-4 w-4" />
            Sim
          </Button>
          <Button
            variant={feedback === "not-helpful" ? "default" : "outline"}
            size="sm"
            onClick={() => setFeedback("not-helpful")}
            className={cn(
              "gap-2",
              feedback === "not-helpful" &&
                "bg-destructive hover:bg-destructive/90"
            )}
          >
            <ThumbsDown className="h-4 w-4" />
            Não
          </Button>
        </div>
        {feedback && (
          <p className="text-xs text-muted-foreground">
            Obrigado pelo feedback!
          </p>
        )}
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Artigos relacionados</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedArticles.map((related) => (
              <button
                key={related.id}
                onClick={() => navigate(`/help/${related.id}`)}
                className="rounded-lg border border-border bg-card p-4 text-left transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-medium text-card-foreground">
                  {related.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
