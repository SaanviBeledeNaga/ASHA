import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";

type AlertRow = {
  priority: string;
  subject: string;
  due: string;
  status: string;
};

export default function DashboardOverviewPage() {
  const rows: AlertRow[] = [
    { priority: "High", subject: "Follow-up overdue (BP)", due: "Today", status: "Open" },
    { priority: "Medium", subject: "Missed ANC check-in", due: "Tomorrow", status: "Open" },
    { priority: "Low", subject: "Document verification", due: "This week", status: "Queued" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A quick overview of activity, risk, and operational signals."
        right={
          <div className="flex gap-2">
            <Link
              href="/dashboard/beneficiaries"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200/70 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
            >
              View beneficiaries
            </Link>
            <Link
              href="/dashboard/alerts"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Open alerts
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Beneficiaries" value="1,284" hint="Active in last 90 days" />
        <StatCard label="High-risk cohort" value="96" hint="Needs follow-up this week" />
        <StatCard label="Open alerts" value="14" hint="Escalations + reminders" />
        <StatCard label="Sync status" value="Healthy" hint="Last sync: 8 minutes ago" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            caption="Sample alerts (placeholder)"
            columns={[
              { key: "priority", header: "Priority", className: "w-[120px]" },
              { key: "subject", header: "Subject" },
              { key: "due", header: "Due", className: "w-[140px]" },
              { key: "status", header: "Status", className: "w-[120px]" },
            ]}
            rows={rows}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Quick actions</div>
          <div className="mt-3 space-y-2 text-sm">
            {[
              { href: "/dashboard/sync-health", label: "View sync health" },
              { href: "/dashboard/documents", label: "Review documents" },
              { href: "/dashboard/settings/rules", label: "Manage rules" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50 px-3 py-2 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800/70 dark:bg-zinc-900/30 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
              >
                <span className="font-medium">{a.label}</span>
                <span className="text-zinc-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

