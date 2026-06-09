import {
  BriefcaseBusiness,
  FileText,
  IdCardLanyard,
  LayoutDashboard,
  ShieldUser,
  UserPlus,
  Users,
  Wrench,
  Layers,
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
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  {
    label: "Usuarios",
    icon: Users,
    children: [
      {
        label: "Lista de usuarios",
        to: "/users",
        icon: Users,
        permission: ["USER_READ"],
      },
      {
        label: "Crear usuario",
        to: "/users/create",
        icon: UserPlus,
        permission: ["USER_CREATE"],
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
    label: "Cotizaciones",
    icon: FileText,
    children: [
      {
        label: "Lista de cotizaciones",
        to: "/cotizaciones",
        permission: ["COTIZACIONES_READ"],
      },
      {
        label: "Crear cotización",
        to: "/cotizaciones/create",
        permission: ["COTIZACIONES_CREATE"],
      },
    ],
    permission: ["COTIZACIONES_READ"],
  },
  {
    label: "Empleados",
    icon: BriefcaseBusiness,
    children: [
      {
        label: "Lista de empleados",
        to: "/empleados",
        permission: ["EMPLEADO_READ"],
      },
      {
        label: "Crear empleado",
        to: "/empleados/create",
        permission: ["EMPLEADO_CREATE"],
      },
    ],
    permission: ["EMPLEADO_READ"],
  },
  {
    label: "Cargos de empleado",
    icon: IdCardLanyard,
    children: [
      {
        label: "Lista de cargos",
        to: "/cargo-empleado",
        permission: ["CARGO_EMPLEADO_READ"],
      },
      {
        label: "Crear cargo",
        to: "/cargo-empleado/create",
        permission: ["CARGO_EMPLEADO_CREATE"],
      },
    ],
    permission: ["CARGO_EMPLEADO_READ"],
  },
  {
    label: "Asignaciones",
    icon: IdCardLanyard,
    children: [
      {
        label: "Catálogo Habilidades",
        to: "/empleados/habilidades",
      },
    ],
  },
  {
    label: "Herramientas",
    icon: Wrench,
    children: [{ label: "Lista de herramientas", to: "/herramientas" }],
    permission: ["HERRAMIENTA_READ"],
  },
  {
    label: "Materiales",
    icon: Layers,
    children: [
      { label: "Lista de materiales", to: "/materiales" },
      { label: "Agregar material", to: "/materiales/gestion" },
    ],
  },
];
