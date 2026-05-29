"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setToken } from "@/lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => identifier.trim().length > 2 && otp.trim().length > 1, [identifier, otp]);
  const nextPath = searchParams.get("next") || "/dashboard";

  return (
    <div className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/70 bg-white p-8 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Login</div>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            Back
          </Link>
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Sign in to your dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          MVP login: enter any phone/email and any OTP. We’ll store a demo token locally.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setSubmitting(true);
            setToken("demo-token");
            router.replace(nextPath);
          }}
        >
          <div>
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Phone or Email</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. +91 98765 43210 or name@example.com"
              className="mt-2 w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Mock OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="mt-2 w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/30 dark:text-zinc-400">
          Tip: After login, use the top-right <span className="font-medium">Logout</span> button to clear the token.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-black text-slate-500 flex items-center justify-center">Loading authentication...</div>}>
      <LoginContent />
    </Suspense>
  );
}
