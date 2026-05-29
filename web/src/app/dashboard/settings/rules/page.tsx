import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";

type RuleRow = {
  name: string;
  trigger: string;
  action: string;
  enabled: string;
};

export default function RulesSettingsPage() {
  const rows: RuleRow[] = [
    { name: "Overdue BP follow-up", trigger: "No visit in 14 days", action: "Create High alert", enabled: "Yes" },
    { name: "Missed ANC check-in", trigger: "Missed scheduled date", action: "Create Medium alert", enabled: "Yes" },
    { name: "Document pending", trigger: "Pending > 7 days", action: "Notify reviewer", enabled: "No" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings · Rules"
        description="Configure automation that generates alerts and triage signals (placeholder)."
        right={
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            New rule
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enabled" value="2" hint="Active rules" />
        <StatCard label="Disabled" value="1" hint="Not currently running" />
        <StatCard label="Fired today" value="6" hint="Alerts generated (sample)" />
        <StatCard label="Avg. time to resolve" value="3.4h" hint="Placeholder metric" />
      </div>

      <DataTable
        caption="Sample rules (placeholder)"
        columns={[
          { key: "name", header: "Rule" },
          { key: "trigger", header: "Trigger" },
          { key: "action", header: "Action" },
          { key: "enabled", header: "Enabled", className: "w-[120px]" },
        ]}
        rows={rows}
      />
    </div>
  );
}

