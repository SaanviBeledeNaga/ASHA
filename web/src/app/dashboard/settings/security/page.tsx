import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings · Security"
        description="Security controls and audit placeholders for the MVP."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Session" value="Local token" hint="Stored in localStorage (MVP)" />
        <StatCard label="MFA" value="OTP (mock)" hint="Demo only; not verified" />
        <StatCard label="Roles" value="Not configured" hint="Placeholder" />
        <StatCard label="Audit log" value="Not available" hint="Placeholder" />
      </div>

      <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Security notes</div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Client-side auth guard is used for MVP routing only.</li>
          <li>For production, use server-side session validation and HTTP-only cookies.</li>
          <li>Wire this section to real users, roles, and audit events.</li>
        </ul>
      </div>
    </div>
  );
}

