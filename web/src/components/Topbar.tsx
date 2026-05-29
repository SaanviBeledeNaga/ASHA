"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export function Topbar() {
  const router = useRouter();

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-zinc-200/70 bg-white px-4 dark:border-zinc-800/70 dark:bg-zinc-950 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="hidden text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:block">Tenant</div>
        <button
          type="button"
          className="rounded-xl border border-zinc-200/70 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
        >
          Primary PHC
          <span className="ml-2 text-xs text-zinc-500">▼</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden rounded-xl border border-zinc-200/70 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-900/30 dark:text-zinc-200 sm:block">
          User Menu
        </div>
        <button
          type="button"
          onClick={() => {
            clearToken();
            router.replace("/login");
          }}
          className="rounded-xl bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

