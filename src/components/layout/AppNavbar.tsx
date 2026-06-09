import { Breadcrumbs } from "@heroui/react/breadcrumbs";
import { useRouterState } from "@tanstack/react-router";
import { Home, PanelLeft } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import { UserDropdown } from "./UserDropdown";

interface AppNavbarProps {
  onSidebarToggle?: () => void;
}

interface Crumb {
  icon?: React.ElementType;
  label: string;
  to?: string;
}

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === "/") return [{ label: "Dashboard", to: "/", icon: Home }];

  for (const item of NAV_ITEMS) {
    if (item.to === pathname) {
      return [
        { label: "Dashboard", to: "/", icon: Home },
        { label: item.label, to: item.to, icon: item.icon },
      ];
    }
    if (item.children) {
      const child = item.children.find((c) => c.to === pathname);
      if (child) {
        return [
          { label: "Dashboard", to: "/", icon: Home },
          { label: item.label, to: item.to, icon: item.icon },
          { label: child.label, to: child.to, icon: child.icon },
        ];
      }
    }
  }

  return [{ label: "Dashboard", to: "/", icon: Home }];
}

export function AppNavbar({ onSidebarToggle }: AppNavbarProps) {
  const state = useRouterState();
  const pathname = state.location.pathname;
  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4">
      <button
        onClick={onSidebarToggle}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 hidden"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={20} />
      </button>

      <Breadcrumbs>
        {crumbs.map((crumb) => (
          <Breadcrumbs.Item key={crumb.label} href={crumb.to}>
            {crumb.icon && <crumb.icon size={16} className="mr-1" />}
            {crumb.label}
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs>

      <div className="ml-auto flex items-center gap-1">
        <UserDropdown />
      </div>
    </header>
  );
}
