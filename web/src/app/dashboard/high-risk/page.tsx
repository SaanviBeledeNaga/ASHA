import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";

type Row = {
  cohort: string;
  count: number;
  nextAction: string;
};

export default function HighRiskPage() {
  const rows: Row[] = [
    { cohort: "Hypertension - uncontrolled", count: 32, nextAction: "Recheck + adherence counselling" },
    { cohort: "Pregnancy - missed ANC", count: 18, nextAction: "Call + schedule visit" },
    { cohort: "Diabetes - overdue HbA1c", count: 12, nextAction: "Lab reminder" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="High Risk"
        description="Risk-stratified cohorts to prioritize outreach (placeholder)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total flagged" value="96" hint="Across all cohorts" />
        <StatCard label="Due today" value="11" hint="Requires follow-up" />
        <StatCard label="Resolved this week" value="24" hint="Closed alerts + visits" />
        <StatCard label="SLA risk" value="7" hint="Overdue beyond threshold" />
      </div>

      <DataTable
        caption="Sample cohorts (placeholder)"
        columns={[
          { key: "cohort", header: "Cohort" },
          { key: "count", header: "Count", className: "w-[120px]" },
          { key: "nextAction", header: "Recommended next action" },
        ]}
        rows={rows}
      />
    </div>
  );
}

