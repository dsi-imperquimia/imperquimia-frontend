import logo from "@/assets/iq_isologo_1.png";
import { authActions } from "@modules/auth/store/authStore";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

interface SubItem {
  label: string;
  to: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  to?: string;
  badge?: string;
  children?: SubItem[];
  hasArrow?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  {
    label: "Usuarios",
    icon: Users,
    children: [
      { label: "Lista de usuarios", to: "/users" },
      { label: "Crear usuario", to: "/users/create" },
    ],
  },
  { label: "Tracker", icon: ListChecks, to: "/tracker", badge: "New" },
  { label: "Settings", icon: Settings, to: "/settings", hasArrow: true },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Analytics: true,
  });

  const toggleExpand = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  function handleLogout() {
    authActions.logout();
    void navigate({ to: "/login" });
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-4">
        <img src={logo} alt="Imperquimia" className="h-11" />
        {/* <span className="font-semibold text-gray-900">Imperquimia</span> */}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <CollapsibleItem
              key={item.label}
              item={item}
              open={!!expanded[item.label]}
              onToggle={() => toggleExpand(item.label)}
            />
          ) : (
            <SidebarLink key={item.label} item={item} />
          ),
        )}
      </nav>

      <div className="border-t border-gray-100 py-2">
        <BottomAction
          icon={LogOut}
          label="Cerrar sesión"
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const state = useRouterState();
  const isActive = state.location.pathname === item.to;

  return (
    <Link
      to={item.to ?? "/"}
      className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <item.icon size={18} className="shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          {item.badge}
        </span>
      )}
      {item.hasArrow && <ChevronRight size={16} className="text-gray-400" />}
    </Link>
  );
}

function CollapsibleItem({
  item,
  open,
  onToggle,
}: {
  item: NavItem;
  open: boolean;
  onToggle: () => void;
}) {
  const state = useRouterState();

  return (
    <div className="mx-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <item.icon size={18} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-gray-100 pl-3">
          {item.children!.map((sub) => {
            const isActive = state.location.pathname === sub.to;
            return (
              <Link
                key={sub.label}
                to={sub.to}
                className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "font-medium text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BottomAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
    >
      <Icon size={18} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}
