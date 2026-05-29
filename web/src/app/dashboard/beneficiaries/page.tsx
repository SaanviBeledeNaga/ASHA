import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";

type BeneficiaryRow = {
  id: string;
  name: string;
  village: string;
  risk: string;
  lastVisit: string;
};

export default function BeneficiariesPage() {
  const rows: BeneficiaryRow[] = [
    { id: "BEN-1024", name: "Savitri Devi", village: "Kothapet", risk: "High", lastVisit: "2 days ago" },
    { id: "BEN-1188", name: "Rahul Kumar", village: "Madhapur", risk: "Medium", lastVisit: "1 week ago" },
    { id: "BEN-1331", name: "Meera Singh", village: "Nizampet", risk: "Low", lastVisit: "3 weeks ago" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beneficiaries"
        description="Browse profiles, check visit history, and open documents for verification."
        right={
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200/70 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
            >
              Export (placeholder)
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Add beneficiary
            </button>
          </div>
        }
      />

      <DataTable
        caption="Sample beneficiary list (placeholder)"
        columns={[
          {
            key: "id",
            header: "ID",
            className: "w-[140px]",
            render: (v) => (
              <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
                {String(v)}
              </span>
            ),
          },
          {
            key: "name",
            header: "Name",
            render: (_v, row) => (
              <div className="flex flex-col">
                <Link href={`/dashboard/beneficiaries/${row.id}`} className="font-medium hover:underline">
                  {row.name}
                </Link>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{row.village}</span>
              </div>
            ),
          },
          { key: "risk", header: "Risk", className: "w-[120px]" },
          { key: "lastVisit", header: "Last visit", className: "w-[140px]" },
        ]}
        rows={rows}
      />
    </div>
  );
}

