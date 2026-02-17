import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/cn";
import { useHelpSearch } from "../hooks";

interface HelpSearchProps {
  className?: string;
}

export function HelpSearch({ className }: HelpSearchProps) {
  const navigate = useNavigate();
  const { query, setQuery, results, isSearching } = useHelpSearch();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showResults = isFocused && query.trim().length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleArticleClick(articleId: string) {
    setIsFocused(false);
    setQuery("");
    navigate(`/help/${articleId}`);
  }

  function handleClear() {
    setQuery("");
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar artigos de ajuda..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-border bg-popover shadow-lg">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-2">
              {results.map((article) => (
                <li key={article.id}>
                  <button
                    onClick={() => handleArticleClick(article.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {article.title}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {article.categoryLabel}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum artigo encontrado para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
