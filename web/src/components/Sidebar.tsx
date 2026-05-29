"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navTree } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-zinc-200/70 bg-white px-4 py-5 dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Asha Health
        </Link>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          MVP
        </span>
      </div>

      <nav className="flex flex-col gap-6">
        {navTree.map((section) => (
          <div key={section.label}>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {section.label}
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group rounded-xl px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/50",
                    ].join(" ")}
                  >
                    <div className="font-medium">{item.label}</div>
                    {item.description ? (
                      <div
                        className={[
                          "mt-0.5 text-xs",
                          active ? "text-white/80 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400",
                        ].join(" ")}
                      >
                        {item.description}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

