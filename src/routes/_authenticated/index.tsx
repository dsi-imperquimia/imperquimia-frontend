import { NAV_ITEMS } from "@components/layout/navItems";
import { useAuth, userActions } from "@modules/auth/store/authStore";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({ component: App });

function App() {
  const { user } = useAuth();

  const Items = NAV_ITEMS.filter(
    (item) => item.to !== undefined && item.to !== "/",
  ).filter((item) => userActions.hasAnyPermission(item.permission ?? []));

  return (
    <main className="page-wrap">
      <h1 className="text-2xl font-bold text-center mb-16">
        Bienvenido, {user?.name} {user?.lastName}
      </h1>
      <div className="flex flex-wrap h-full w-full items-center justify-center gap-4">
        {Items.map((item) => (
          <Link
            key={item.label}
            to={item.to ?? "/"}
            className=" flex flex-col items-center gap-2 rounded-2xl p-12 bg-gray-200 hover:bg-gray-300 transition"
          >
            {item.icon && <item.icon size={48} className="mr-1" />}
            <span className="text-lg">{item.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
