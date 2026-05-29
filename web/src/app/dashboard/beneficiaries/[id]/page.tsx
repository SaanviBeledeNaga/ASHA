import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";

type VisitRow = {
  date: string;
  type: string;
  notes: string;
  status: string;
};

export default async function BeneficiaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const visits: VisitRow[] = [
    { date: "2026-05-25", type: "BP check", notes: "Slightly elevated; recheck scheduled.", status: "Completed" },
    { date: "2026-05-10", type: "Medication refill", notes: "Adherence OK; counselled on timing.", status: "Completed" },
    { date: "2026-06-01", type: "Follow-up", notes: "Home visit (placeholder).", status: "Planned" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Beneficiary: ${id}`}
        description="Profile overview and recent interactions (placeholder)."
        right={
          <Link
            href="/dashboard/beneficiaries"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200/70 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
          >
            Back to list
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Risk level" value="High" hint="Based on recent readings" />
        <StatCard label="Last visit" value="2 days ago" hint="BP check" />
        <StatCard label="Open alerts" value="1" hint="Follow-up overdue" />
        <StatCard label="Schemes" value="2" hint="Eligible (placeholder)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            caption="Recent visits (placeholder)"
            columns={[
              { key: "date", header: "Date", className: "w-[140px]" },
              { key: "type", header: "Type", className: "w-[160px]" },
              { key: "notes", header: "Notes" },
              { key: "status", header: "Status", className: "w-[140px]" },
            ]}
            rows={visits}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Actions</div>
          <div className="mt-3 space-y-2 text-sm">
            {["Create alert", "Upload document", "Schedule visit"].map((label) => (
              <button
                key={label}
                type="button"
                className="w-full rounded-xl border border-zinc-200/70 bg-zinc-50 px-3 py-2 text-left font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800/70 dark:bg-zinc-900/30 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

