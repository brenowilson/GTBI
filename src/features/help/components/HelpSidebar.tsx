import {
  BookOpen,
  BarChart3,
  FileText,
  Star,
  MessageSquare,
  DollarSign,
  Package,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HELP_CATEGORIES, allArticles } from "../articles";

interface HelpSidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  BarChart3,
  FileText,
  Star,
  MessageSquare,
  DollarSign,
  Package,
  Shield,
};

function getArticleCount(categoryId: string): number {
  return allArticles.filter((a) => a.category === categoryId).length;
}

export function HelpSidebar({
  selectedCategory,
  onSelectCategory,
}: HelpSidebarProps) {
  return (
    <ScrollArea className="h-full">
      <nav className="space-y-1 p-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
            selectedCategory === null
              ? "bg-accent text-accent-foreground"
              : "text-foreground hover:bg-accent/50"
          )}
        >
          <span className="flex items-center gap-3">
            <BookOpen className="h-4 w-4" />
            Todos os artigos
          </span>
          <span className="text-xs text-muted-foreground">
            {allArticles.length}
          </span>
        </button>

        <div className="my-2 border-t border-border" />

        {HELP_CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.icon] ?? BookOpen;
          const count = getArticleCount(category.id);

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                selectedCategory === category.id
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {category.label}
              </span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
