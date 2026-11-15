import type { User } from "@modules/user/types/user";
import {
  BriefcaseBusiness,
  TriangleAlert,
  ClipboardList,
  FileText,
  HardHat,
  Layers,
  LayoutDashboard,
  ShieldUser,
  Users,
  Wrench,
} from "lucide-react";

export interface SubItem {
  label: string;
  to: string;
  icon?: React.ElementType;
  permission?: string[];
}

export interface NavItem {
  label: string;
  icon: React.ElementType;
  to?: string;
  badge?: string;
  children?: SubItem[];
  hasArrow?: boolean;
  permission?: string[];
  /** Solo visible para usuarios vinculados a un empleado (ver `user.empleadoId`). */
  requiresEmpleado?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  {
    label: "Mis proyectos",
    icon: HardHat,
    to: "/mis-proyectos",
    requiresEmpleado: true,
  },
  {
    label: "Usuarios",
    icon: Users,
    to: "/users",
    children: [
      {
        label: "Lista de usuarios",
        to: "/users",
        icon: Users,
        permission: ["USER_READ"],
      },
      {
        label: "Roles",
        to: "/users/roles",
        icon: ShieldUser,
        permission: ["ROLE_READ"],
      },
    ],
    permission: ["USER_READ", "ROLE_READ"],
  },
  {
    label: "Empleados",
    icon: BriefcaseBusiness,
    to: "/empleados",
    children: [
      {
        label: "Lista de empleados",
        to: "/empleados",
        permission: ["EMPLEADO_READ"],
      },
      {
        label: "Asignaciones",
        to: "/empleados/asignaciones",
        permission: ["EMPLEADO_READ"],
      },
      {
        label: "Lista de cargos",
        to: "/cargo-empleado",
        permission: ["CARGO_EMPLEADO_READ"],
      },
      {
        label: "Catálogo Habilidades",
        to: "/empleados/habilidades",
      },
    ],
    permission: ["EMPLEADO_READ", "CARGO_EMPLEADO_READ"],
  },
  // {
  //   label: "Cargos de empleado",
  //   icon: IdCardLanyard,
  //   to: "/cargo-empleado",
  //   children: [
  //     {
  //       label: "Lista de cargos",
  //       to: "/cargo-empleado",
  //       permission: ["CARGO_EMPLEADO_READ"],
  //     },
  //     {
  //       label: "Crear cargo",
  //       to: "/cargo-empleado/create",
  //       permission: ["CARGO_EMPLEADO_CREATE"],
  //     },
  //     {
  //       label: "Catálogo Habilidades",
  //       to: "/empleados/habilidades",
  //     },
  //   ],
  //   permission: ["CARGO_EMPLEADO_READ"],
  // },
  // {
  //   label: "Asignaciones",
  //   icon: IdCardLanyard,
  //   to: "/asignaciones",
  //   children: [
  //     {
  //       label: "Catálogo Habilidades",
  //       to: "/empleados/habilidades",
  //     },
  //   ],
  // },
  {
    label: "Cotizaciones",
    icon: FileText,
    to: "/cotizaciones",
    children: [
      {
        label: "Lista de cotizaciones",
        to: "/cotizaciones",
        permission: ["COTIZACIONES_READ"],
      },
    ],
    permission: ["COTIZACIONES_READ"],
  },
  {
    label: "Proyectos",
    icon: BriefcaseBusiness,
    to: "/proyectos",
    children: [{ label: "Lista de proyectos", to: "/proyectos" }],
    permission: ["PROYECTO_READ"],
  },
  {
    label: "Actividades diarias",
    icon: ClipboardList,
    to: "/actividades-diarias",
    children: [
      {
        label: "Lista de actividades",
        to: "/actividades-diarias",
        permission: ["ACTIVIDAD_READ", "ACTIVIDAD_CREATE", "ACTIVIDAD_UPDATE"],
      },
    ],
    permission: ["ACTIVIDAD_CREATE", "ACTIVIDAD_READ", "ACTIVIDAD_UPDATE"],
  },
  {
    label: "Incidencias",
    icon: TriangleAlert,
    to: "/incidencias",
    children: [
      {
        label: "Lista de incidencias",
        to: "/incidencias",
        permission: [
          "INCIDENCIA_READ",
          "INCIDENCIA_CREATE",
          "INCIDENCIA_UPDATE",
        ],
      },
    ],
    permission: ["INCIDENCIA_READ", "INCIDENCIA_CREATE", "INCIDENCIA_UPDATE"],
  },
  {
    label: "Herramientas",
    icon: Wrench,
    to: "/herramientas",
    children: [
      {
        label: "Lista de herramientas",
        to: "/herramientas",
        permission: ["HERRAMIENTA_READ"],
      },
      {
        label: "Tipos de herramientas",
        to: "/herramientas/tipos",
        permission: ["HERRAMIENTA_CREATE", "HERRAMIENTA_UPDATE"],
      },
      {
        label: "Marcas de herramientas",
        to: "/herramientas/marcas",
        permission: ["HERRAMIENTA_CREATE", "HERRAMIENTA_UPDATE"],
      },
      {
        label: "Verificación de jornada",
        to: "/jornada-herramientas",
        permission: ["JORNADA_HERRAMIENTA_READ", "JORNADA_HERRAMIENTA_VERIFY"],
      },
    ],
    permission: [
      "HERRAMIENTA_READ",
      "HERRAMIENTA_CREATE",
      "HERRAMIENTA_UPDATE",
      "JORNADA_HERRAMIENTA_READ",
      "JORNADA_HERRAMIENTA_VERIFY",
    ],
  },
  {
    label: "Materiales",
    icon: Layers,
    to: "/materiales",
    children: [
      { label: "Lista de materiales", to: "/materiales" },
      {
        label: "Inventario de materiales",
        to: "/materiales/inventario",
        permission: ["INVENTARIO_MATERIAL_READ"],
      },
    ],
  },
];

export function isNavItemVisible(
  item: Pick<NavItem, "permission" | "requiresEmpleado">,
  user: Pick<User, "empleadoId"> | null | undefined,
  hasAnyPermission: (permissions: string[]) => boolean,
): boolean {
  if (item.requiresEmpleado && !user?.empleadoId) return false;
  return hasAnyPermission(item.permission ?? []);
}
