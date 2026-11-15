import logo from "@/assets/iq_isologo_1.png";
import isotipo from "@/assets/iq_isotipo_1.png";
import { authActions, useAuth, userActions } from "@modules/auth/store/authStore";
import { Dropdown } from "@heroui/react/dropdown";
import { Drawer } from "@heroui/react/drawer";
import { Header } from "@heroui/react/header";
import { Tooltip } from "@heroui/react/tooltip";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { isNavItemVisible, NAV_ITEMS, type NavItem, type SubItem } from "./navItems";

interface AppSidebarProps {
  collapsed?: boolean;
}

export function AppSidebar({ collapsed = false }: AppSidebarProps) {
  return (
    <aside
      className={`hidden min-h-screen shrink-0 flex-col border-r border-gray-100 bg-white transition-[width] duration-200 md:flex ${
        collapsed ? "w-18" : "w-70"
      }`}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function MobileSidebar({ isOpen, onOpenChange }: MobileSidebarProps) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="left">
        <Drawer.Dialog
          aria-label="Menú de navegación"
          className="flex w-70 max-w-[85vw] flex-col overflow-x-hidden p-0"
        >
          <Drawer.CloseTrigger />
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function SidebarContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const activeParentLabel = NAV_ITEMS.find((item) =>
    item.children?.some((sub) => sub.to === pathname),
  )?.label;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    activeParentLabel ? { [activeParentLabel]: true } : {},
  );

  useEffect(() => {
    if (!activeParentLabel) return;
    setExpanded((prev) =>
      prev[activeParentLabel] ? prev : { ...prev, [activeParentLabel]: true },
    );
  }, [activeParentLabel]);

  const toggleExpand = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  function handleLogout() {
    authActions.logout();
    void navigate({ to: "/login" });
  }

  return (
    <>
      <div
        className={`flex h-14 items-center gap-2.5 border-b border-gray-100 ${
          collapsed ? "justify-center px-2" : "px-4"
        }`}
      >
        <img
          src={collapsed ? isotipo : logo}
          alt="Imperquimia"
          className={collapsed ? "h-8 w-8 object-contain" : "h-11"}
        />
      </div>

      <nav className="flex-1 overflow-x-hidden overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          if (!isNavItemVisible(item, user, userActions.hasAnyPermission)) {
            return null;
          }
          return item.children ? (
            <CollapsibleItem
              key={item.label}
              item={item}
              open={!!expanded[item.label]}
              onToggle={() => toggleExpand(item.label)}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          ) : (
            <SidebarLink
              key={item.label}
              item={item}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      <div className="border-t border-gray-100 py-2">
        <BottomAction
          icon={LogOut}
          label="Cerrar sesión"
          onClick={handleLogout}
          collapsed={collapsed}
        />
      </div>
    </>
  );
}

function SidebarLink({
  item,
  onNavigate,
  collapsed = false,
}: {
  item: NavItem;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const state = useRouterState();
  const isActive = state.location.pathname === item.to;

  const linkClassName = `flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors ${
    collapsed ? "justify-center" : ""
  } ${
    isActive
      ? "bg-gray-100 text-gray-900"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  }`;

  const linkContent = (
    <>
      <item.icon size={18} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {item.badge}
            </span>
          ) : null}
          {item.hasArrow && <ChevronRight size={16} className="text-gray-400" />}
        </>
      )}
    </>
  );

  if (!collapsed) {
    return (
      <Link to={item.to ?? "/"} onClick={onNavigate} className={`mx-2 ${linkClassName}`}>
        {linkContent}
      </Link>
    );
  }

  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger className="mx-2 block w-[calc(100%-1rem)]">
        <Link to={item.to ?? "/"} onClick={onNavigate} className={`w-full ${linkClassName}`}>
          {linkContent}
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Content className="text-sm font-normal" placement="right" showArrow>
        {item.label}
      </Tooltip.Content>
    </Tooltip>
  );
}

function CollapsibleItem({
  item,
  open,
  onToggle,
  onNavigate,
  collapsed = false,
}: {
  item: NavItem;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const state = useRouterState();
  const navigate = useNavigate();
  const visibleChildren = item.children!.filter((sub) =>
    userActions.hasAnyPermission(sub.permission ?? []),
  );
  const hasActiveChild = visibleChildren.some(
    (sub) => sub.to === state.location.pathname,
  );

  if (collapsed) {
    return (
      <div className="mx-2">
        <Dropdown>
          <Tooltip delay={0}>
            <Dropdown.Trigger
              aria-label={item.label}
              className={`flex w-full items-center justify-center rounded-lg px-3 py-2 transition-colors ${
                hasActiveChild
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={18} className="shrink-0" />
            </Dropdown.Trigger>
            <Tooltip.Content className="text-sm font-normal" placement="right" showArrow>
              {item.label}
            </Tooltip.Content>
          </Tooltip>
          <Dropdown.Popover placement="right top">
            <Dropdown.Menu>
              <Dropdown.Section>
                <Header className="text-sm font-bold">{item.label}</Header>
                {visibleChildren.map((sub) => (
                  <CollapsedSubItem
                    key={sub.to}
                    sub={sub}
                    isActive={state.location.pathname === sub.to}
                    onSelect={() => {
                      onNavigate?.();
                      void navigate({ to: sub.to });
                    }}
                  />
                ))}
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    );
  }

  return (
    <div className="mx-2">
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors ${
          hasActiveChild
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <item.icon size={18} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {item.badge}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-300 pl-2">
          {visibleChildren.map((sub) => {
            const isActive = state.location.pathname === sub.to;
            return (
              <Link
                key={sub.label}
                to={sub.to}
                onClick={onNavigate}
                className={`flex items-center rounded-lg px-2 py-1.5 text-base transition-colors ${
                  isActive
                    ? "font-medium text-gray-900 bg-gray-100"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                {sub.icon && <sub.icon size={16} className="mr-2" />}
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CollapsedSubItem({
  sub,
  isActive,
  onSelect,
}: {
  sub: SubItem;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <Dropdown.Item id={sub.to} textValue={sub.label} onAction={onSelect}>
      <div
        className={`flex items-center gap-2 ${isActive ? "font-medium text-gray-900" : ""}`}
      >
        {sub.icon && <sub.icon size={16} />}
        {sub.label}
      </div>
    </Dropdown.Item>
  );
}

function BottomAction({
  icon: Icon,
  label,
  onClick,
  collapsed = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const buttonClassName =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900";

  if (!collapsed) {
    return (
      <button
        onClick={onClick}
        className={`mx-2 w-[calc(100%-1rem)] ${buttonClassName}`}
      >
        <Icon size={18} className="shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger className="mx-2 block w-[calc(100%-1rem)]">
        <button
          onClick={onClick}
          className={`w-full justify-center ${buttonClassName}`}
        >
          <Icon size={18} className="shrink-0" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content className="text-sm font-normal" placement="right" showArrow>
        {label}
      </Tooltip.Content>
    </Tooltip>
  );
}
