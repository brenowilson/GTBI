import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpSearch } from "../components/HelpSearch";
import { HelpSidebar } from "../components/HelpSidebar";
import { ArticleList } from "../components/ArticleList";
import { allArticles, HELP_CATEGORIES } from "../articles";

export function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryLabel = selectedCategory
    ? HELP_CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? ""
    : "Todos os artigos";

  const filteredArticles = selectedCategory
    ? allArticles.filter((a) => a.category === selectedCategory)
    : allArticles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Central de Ajuda
        </h1>
        <p className="text-muted-foreground">
          Encontre respostas sobre como usar o GTBI para gerenciar seu
          restaurante.
        </p>
      </div>

      {/* Search (self-contained dropdown) */}
      <HelpSearch className="max-w-xl" />

      {/* Category browsing */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 rounded-lg border border-border bg-card lg:block">
          <HelpSidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Mobile category selector */}
          <div className="lg:hidden">
            <Select
              value={selectedCategory ?? "all"}
              onValueChange={(value) =>
                setSelectedCategory(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todos os artigos ({allArticles.length})
                </SelectItem>
                {HELP_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label} (
                    {allArticles.filter((a) => a.category === cat.id).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category title */}
          <div>
            <h2 className="text-lg font-semibold">{categoryLabel}</h2>
            <p className="text-sm text-muted-foreground">
              {filteredArticles.length}{" "}
              {filteredArticles.length === 1 ? "artigo" : "artigos"}
            </p>
          </div>

          {/* Article grid */}
          <ArticleList
            articles={allArticles}
            category={selectedCategory ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
