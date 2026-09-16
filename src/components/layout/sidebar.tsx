"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AppModule } from "@/lib/modules";
import { Icon } from "@/components/icons";

export function Sidebar({
  modules,
  user,
  logoutAction,
}: {
  modules: AppModule[];
  user: { name: string; roleLabel: string };
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sections = Array.from(new Set(modules.map((m) => m.section)));

  const nav = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section}>
          <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {section}
          </p>
          <ul className="space-y-0.5">
            {modules
              .filter((m) => m.section === section)
              .map((m) => {
                const active = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
                return (
                  <li key={m.slug}>
                    <Link
                      href={m.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-brand/10 text-brand-dark"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon name={m.icon} className="h-5 w-5 shrink-0" />
                      {m.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.roleLabel}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-ghost px-2" title="Se déconnecter" aria-label="Se déconnecter">
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Barre mobile */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">☀️</span>
          Ma Garderie
        </Link>
        <button
          type="button"
          className="btn-ghost px-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
        >
          <Icon name="menu" />
        </button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="font-semibold">Menu</span>
              <button type="button" className="btn-ghost px-2" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}
      {/* Barre latérale bureau */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg text-white shadow-sm">
            ☀️
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Ma Garderie</p>
            <p className="text-xs text-slate-500">Gestion quotidienne</p>
          </div>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
