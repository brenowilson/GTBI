import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HelpArticle } from "../articles";

interface ArticleListProps {
  articles: HelpArticle[];
  category?: string;
}

function getExcerpt(content: string, maxLength = 120): string {
  // Remove markdown headers and formatting
  const cleaned = content
    .replace(/^#{1,3}\s+.+$/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.slice(0, maxLength).trim() + "...";
}

export function ArticleList({ articles, category }: ArticleListProps) {
  const navigate = useNavigate();

  const filteredArticles = useMemo(() => {
    if (!category) return articles;
    return articles.filter((article) => article.category === category);
  }, [articles, category]);

  if (filteredArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Nenhum artigo encontrado nesta categoria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredArticles.map((article) => (
        <Card
          key={article.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => navigate(`/help/${article.id}`)}
        >
          <CardHeader className="pb-2">
            <div className="mb-2">
              <Badge variant="secondary" className="text-[10px]">
                {article.categoryLabel}
              </Badge>
            </div>
            <CardTitle className="text-base leading-snug">
              {article.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getExcerpt(article.content)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
