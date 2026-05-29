import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";

type Row = {
  scheme: string;
  eligible: number;
  enrolled: number;
  lastUpdated: string;
};

export default function SchemesPage() {
  const rows: Row[] = [
    { scheme: "Maternal Care Support", eligible: 210, enrolled: 162, lastUpdated: "Today" },
    { scheme: "NCD Medication Subsidy", eligible: 540, enrolled: 402, lastUpdated: "Yesterday" },
    { scheme: "Child Immunization Booster", eligible: 138, enrolled: 94, lastUpdated: "This week" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Schemes" description="Program eligibility and enrollment tracking (placeholder)." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eligible" value="888" hint="Across tracked schemes" />
        <StatCard label="Enrolled" value="658" hint="Enrollment progress" />
        <StatCard label="Pending docs" value="73" hint="Needs verification" />
        <StatCard label="Drop-off risk" value="19" hint="No follow-up" />
      </div>

      <DataTable
        caption="Sample schemes (placeholder)"
        columns={[
          { key: "scheme", header: "Scheme" },
          { key: "eligible", header: "Eligible", className: "w-[120px]" },
          { key: "enrolled", header: "Enrolled", className: "w-[120px]" },
          { key: "lastUpdated", header: "Last updated", className: "w-[140px]" },
        ]}
        rows={rows}
      />
    </div>
  );
}

