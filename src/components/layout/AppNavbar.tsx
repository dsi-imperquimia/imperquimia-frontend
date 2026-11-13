import { Breadcrumbs } from "@heroui/react/breadcrumbs";
import { contarAlertasNoLeidas } from "@modules/alertas/api/alertas";
import { useAuth, userActions } from "@modules/auth/store/authStore";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Home, PanelLeft } from "lucide-react";
import { useEffect, useRef } from "react";
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

const PAGE_LABELS: Record<string, string> = {
  "/alertas": "Alertas",
  "/users/create": "Crear usuario",
  "/users/roles/create": "Crear rol",
  "/empleados/create": "Crear empleado",
  "/cargo-empleado/create": "Crear cargo",
  "/cotizaciones/create": "Crear cotización",
  "/proyectos/create": "Crear proyecto",
  "/materiales/gestion": "Gestionar materiales",
};

function findCrumbs(pathname: string): Crumb[] | null {
  if (pathname === "/") return [{ label: "Dashboard", to: "/", icon: Home }];

  const pageLabel = PAGE_LABELS[pathname];
  if (pageLabel) {
    const parentPath = pathname.slice(0, pathname.lastIndexOf("/"));
    if (!parentPath) {
      return [
        { label: "Dashboard", to: "/", icon: Home },
        { label: pageLabel },
      ];
    }
    const parentCrumbs = findCrumbs(parentPath);
    if (parentCrumbs) return [...parentCrumbs, { label: pageLabel }];
  }

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
  return null;
}

function getBreadcrumbs(pathname: string): Crumb[] {
  const exact = findCrumbs(pathname);
  if (exact) return exact;

  let path = pathname;
  while (path) {
    const lastSlash = path.lastIndexOf("/");
    if (lastSlash <= 0) break;
    path = path.slice(0, lastSlash);
    const crumbs = findCrumbs(path);
    if (crumbs) return [...crumbs, { label: "Actual" }];
  }

  return [{ label: "Dashboard", to: "/", icon: Home }, { label: "Actual" }];
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
        <AlertasShortcut />
        <UserDropdown />
      </div>
    </header>
  );
}

function AlertasShortcut() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const avisoMostradoPara = useRef<number | null>(null);
  const tieneAcceso = userActions.hasAnyPermission([
    "ALERTA_READ",
    "ALERTA_CREATE",
    "ALERTA_CONFIGURE",
  ]);
  const puedeConsultar = userActions.hasPermission("ALERTA_READ");
  const {
    data = 0,
    isSuccess,
    isFetchedAfterMount,
  } = useQuery({
    queryKey: ["alertas", "no-leidas", user?.id],
    queryFn: contarAlertasNoLeidas,
    enabled: !!user?.id && puedeConsultar,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!user?.id || avisoMostradoPara.current === user.id) {
      return;
    }
    if (puedeConsultar && !isFetchedAfterMount) return;

    avisoMostradoPara.current = user.id;
    if (isSuccess && data > 0) {
      toast.info(
        data === 1
          ? "Tienes una notificación pendiente"
          : `Tienes ${data} notificaciones pendientes`,
        {
          description: "Revisa tu bandeja de alertas.",
          indicator: <Bell className="size-4" />,
          actionProps: {
            children: "Ver alertas",
            onPress: () => void navigate({ to: "/alertas" }),
          },
          timeout: 10_000,
        },
      );
    }
    toast.success(`¡Bienvenido, ${user.name}!`, {
      description: "Has iniciado sesión correctamente.",
      timeout: 5_000,
    });
  }, [
    data,
    isFetchedAfterMount,
    isSuccess,
    navigate,
    puedeConsultar,
    user?.id,
    user?.name,
  ]);

  if (!tieneAcceso) return null;
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={data ? `Alertas, ${data} sin leer` : "Alertas"}
      onPress={() => void navigate({ to: "/alertas" })}
      className="relative text-gray-600"
    >
      <Bell className="size-5" />
      {data > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-xs font-semibold text-white">
          {data > 99 ? "99+" : data}
        </span>
      )}
    </Button>
  );
}
