import { Avatar, Dropdown, Label } from "@heroui/react";
import { useAuth } from "@modules/auth/store/authStore";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";

export function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials =
    user?.name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  function handleLogout() {
    logout();
    void navigate({ to: "/login" });
  }

  return (
    <Dropdown>
      <Dropdown.Trigger className="rounded-full">
        <Avatar>
          <Avatar.Fallback delayMs={50}>{initials}</Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <Avatar.Fallback delayMs={50}>{initials}</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <p className="text-sm leading-5 font-medium">
                {user?.name ?? "—"}
              </p>
              <p className="text-xs leading-none text-muted">
                {user?.email ?? "—"}
              </p>
            </div>
          </div>
        </div>
        <Dropdown.Menu>
          <Dropdown.Item id="settings" textValue="Settings">
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Configuración</Label>
              <Settings className="size-3.5 text-muted" />
            </div>
          </Dropdown.Item>
          <Dropdown.Item
            id="logout"
            textValue="Logout"
            variant="danger"
            onAction={handleLogout}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <Label>Cerrar sesión</Label>
              <LogOut className="size-3.5 text-danger" />
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
