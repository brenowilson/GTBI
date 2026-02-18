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
  HelpCircle,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/common";

const NAV_ITEMS = [
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/reviews", label: "Avaliações", icon: Star },
  { to: "/tickets", label: "Chamados", icon: MessageSquare },
  { to: "/financial", label: "Financeiro", icon: DollarSign },
  { to: "/catalog", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
  { to: "/help", label: "Ajuda", icon: HelpCircle },
];

export function MobileSidebar() {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Logo size="sm" />
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
    </div>
  );
}
