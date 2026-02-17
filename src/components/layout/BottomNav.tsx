import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Star,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

const MOBILE_NAV_ITEMS = [
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/reviews", label: "Avaliações", icon: Star },
  { to: "/tickets", label: "Chamados", icon: MessageSquare },
  { to: "/financial", label: "Financeiro", icon: DollarSign },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
