import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.suivant === "string" ? sp.suivant : "/";
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-teal-50 via-white to-orange-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-2xl text-white shadow-md">
            ☀️
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Ma Garderie</h1>
          <p className="mt-1 text-sm text-slate-500">Connectez-vous pour gérer votre journée.</p>
        </div>
        <div className="card p-6">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Compte de démonstration : admin@garderie.local / admin1234
        </p>
      </div>
    </main>
  );
}
