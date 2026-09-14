import {
  BriefcaseBusiness,
  FileText,
  Layers,
  LayoutDashboard,
  ShieldUser,
  UserPlus,
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
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
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
        label: "Crear empleado",
        to: "/empleados/create",
        permission: ["EMPLEADO_CREATE"],
      },
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
      {
        label: "Crear cotización",
        to: "/cotizaciones/create",
        permission: ["COTIZACIONES_CREATE"],
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
    label: "Herramientas",
    icon: Wrench,
    to: "/herramientas",
    children: [{ label: "Lista de herramientas", to: "/herramientas" }],
    permission: ["HERRAMIENTA_READ"],
  },
  {
    label: "Materiales",
    icon: Layers,
    to: "/materiales",
    children: [
      { label: "Lista de materiales", to: "/materiales" },
      { label: "Agregar material", to: "/materiales/gestion" },
    ],
  },
];
