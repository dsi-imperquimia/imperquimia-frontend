import { useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "imperquimia-sidebar-collapsed";

export function useSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // El valor persistido solo se lee en el cliente para no romper el SSR
  // (TanStack Start renderiza en servidor, donde no existe localStorage)
  // ni generar un mismatch de hidratación.
  useEffect(() => {
    setIsCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  function toggle() {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) {
      setIsCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
        return next;
      });
    } else {
      setIsOpen(true);
    }
  }

  return { isOpen, setIsOpen, isCollapsed, toggle };
}
