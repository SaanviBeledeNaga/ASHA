import React from "react";

export type DataTableColumn<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  caption?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          {caption ? (
            <caption className="px-4 py-3 text-left text-xs text-zinc-500">{caption}</caption>
          ) : null}
          <thead className="border-b border-zinc-200/70 bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-900/40">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`whitespace-nowrap px-4 py-3 font-medium text-zinc-700 dark:text-zinc-200 ${c.className || ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30">
                {columns.map((c) => {
                  const value = row[c.key];
                  return (
                    <td key={String(c.key)} className={`px-4 py-3 text-zinc-700 dark:text-zinc-200 ${c.className || ""}`}>
                      {c.render ? c.render(value, row) : String(value ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

