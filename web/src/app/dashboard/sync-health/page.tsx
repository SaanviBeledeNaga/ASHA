import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";

type JobRow = {
  job: string;
  lastRun: string;
  duration: string;
  status: string;
};

export default function SyncHealthPage() {
  const rows: JobRow[] = [
    { job: "beneficiary_sync", lastRun: "8 min ago", duration: "34s", status: "Success" },
    { job: "alerts_compute", lastRun: "18 min ago", duration: "12s", status: "Success" },
    { job: "documents_index", lastRun: "2 h ago", duration: "1m 04s", status: "Warning" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sync Health"
        description="Operational view of sync jobs and data freshness (placeholder)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall" value="Healthy" hint="No critical failures" />
        <StatCard label="Last full sync" value="8 min" hint="Data freshness" />
        <StatCard label="Warnings" value="1" hint="Non-blocking issues" />
        <StatCard label="Backlog" value="0" hint="Queued jobs" />
      </div>

      <DataTable
        caption="Sample jobs (placeholder)"
        columns={[
          { key: "job", header: "Job" },
          { key: "lastRun", header: "Last run", className: "w-[140px]" },
          { key: "duration", header: "Duration", className: "w-[120px]" },
          { key: "status", header: "Status", className: "w-[140px]" },
        ]}
        rows={rows}
      />
    </div>
  );
}

