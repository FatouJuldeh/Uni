import { requireUser, ROLE_LABELS } from "@/lib/auth";
import { modulesForRole } from "@/lib/modules";
import { Sidebar } from "@/components/layout/sidebar";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const modules = modulesForRole(user.role);
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar
        modules={modules}
        user={{ name: user.name, roleLabel: ROLE_LABELS[user.role] }}
        logoutAction={logout}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
