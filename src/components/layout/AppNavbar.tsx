import { useRouterState } from "@tanstack/react-router";
import { Home, PanelLeft } from "lucide-react";
import { UserDropdown } from "./UserDropdown";

interface AppNavbarProps {
  onSidebarToggle?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/analytics/overview": "Overview",
  "/analytics/reports": "Reports",
  "/analytics/conversions": "Conversions",
  "/tracker": "Tracker",
  "/settings": "Settings",
};

export function AppNavbar({ onSidebarToggle }: AppNavbarProps) {
  const state = useRouterState();
  const pathname = state.location.pathname;
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4">
      <button
        onClick={onSidebarToggle}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={20} />
      </button>

      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Home size={16} className="text-gray-400" />
        <span className="text-gray-400">/</span>
        <span>{title}</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <UserDropdown />
      </div>
    </header>
  );
}
