import { AppNavbar } from "@/components/layout/AppNavbar";
import { AppSidebar, MobileSidebar } from "@/components/layout/AppSidebar";
import { useSidebarToggle } from "@/components/layout/hooks/useSidebarToggle";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const {
    isOpen: isSidebarOpen,
    setIsOpen: setIsSidebarOpen,
    isCollapsed: isSidebarCollapsed,
    toggle: handleSidebarToggle,
  } = useSidebarToggle();

  return (
    <div className="flex h-full">
      <AppSidebar collapsed={isSidebarCollapsed} />
      <MobileSidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar onSidebarToggle={handleSidebarToggle} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
