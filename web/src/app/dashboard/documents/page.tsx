import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";

type Row = {
  file: string;
  beneficiary: string;
  type: string;
  status: string;
};

export default function DocumentsPage() {
  const rows: Row[] = [
    { file: "aadhaar_front.jpg", beneficiary: "Savitri Devi", type: "ID Proof", status: "Pending" },
    { file: "bp_report.pdf", beneficiary: "Rahul Kumar", type: "Clinical", status: "Verified" },
    { file: "anc_card.png", beneficiary: "Meera Singh", type: "ANC", status: "Needs review" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Uploads, verification, and audit trail (placeholder)."
        right={
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Upload (placeholder)
          </button>
        }
      />

      <DataTable
        caption="Sample documents (placeholder)"
        columns={[
          { key: "file", header: "File" },
          { key: "beneficiary", header: "Beneficiary" },
          { key: "type", header: "Type", className: "w-[140px]" },
          { key: "status", header: "Status", className: "w-[140px]" },
        ]}
        rows={rows}
      />
    </div>
  );
}

