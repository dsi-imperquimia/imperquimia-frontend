import type { Permission } from "./permission";
import type { Role } from "./roles";

export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  password?: string;
  roleId?: number;
  role?: Role;
  permissions?: Permission[];
  permissionsIds?: number[];
}
