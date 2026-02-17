import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Star,
  MessageSquare,
  DollarSign,
  UtensilsCrossed,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/reviews", label: "Avaliações", icon: Star },
  { to: "/tickets", label: "Chamados", icon: MessageSquare },
  { to: "/financial", label: "Financeiro", icon: DollarSign },
  { to: "/catalog", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <img src="/favicon.svg" alt="GTBI" className="h-8 w-8" />
        <span className="text-lg font-bold text-sidebar-foreground">GTBI</span>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
