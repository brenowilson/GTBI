export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  content: string;
  tags: string[];
}

export interface HelpCategory {
  id: string;
  label: string;
  icon: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: "getting-started", label: "Primeiros Passos", icon: "BookOpen" },
  { id: "performance", label: "Performance", icon: "BarChart3" },
  { id: "reports", label: "Relatórios", icon: "FileText" },
  { id: "reviews", label: "Avaliações", icon: "Star" },
  { id: "tickets", label: "Chamados", icon: "MessageSquare" },
  { id: "financial", label: "Financeiro", icon: "DollarSign" },
  { id: "catalog", label: "Catálogo", icon: "Package" },
  { id: "admin", label: "Administração", icon: "Shield" },
];

import { gettingStartedArticles } from "./getting-started";
import { performanceArticles } from "./performance";
import { reportsArticles } from "./reports";
import { reviewsArticles } from "./reviews";
import { ticketsArticles } from "./tickets";
import { financialArticles } from "./financial";
import { catalogArticles } from "./catalog";
import { adminArticles } from "./admin";

export const allArticles: HelpArticle[] = [
  ...gettingStartedArticles,
  ...performanceArticles,
  ...reportsArticles,
  ...reviewsArticles,
  ...ticketsArticles,
  ...financialArticles,
  ...catalogArticles,
  ...adminArticles,
];

export function getArticleById(id: string): HelpArticle | undefined {
  return allArticles.find((article) => article.id === id);
}

export function getArticlesByCategory(category: string): HelpArticle[] {
  return allArticles.filter((article) => article.category === category);
}
