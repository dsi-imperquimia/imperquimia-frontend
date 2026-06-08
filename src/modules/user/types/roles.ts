import type { Permission } from "./permission";

export type Role = {
  id: number;
  name: string;
  description?: string;
  permissions?: {
    permission: Permission;
  }[];
  permissionsIds?: number[];
};
