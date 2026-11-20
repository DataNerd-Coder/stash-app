import { useState } from "react";
import { EmptyState, GroupedCard } from "@/components/ui/list";
import { PageContent, PageHeader } from "@/components/ui/page";
import { QueryView, SkeletonList } from "@/components/ui/states";
import { TabRow } from "@/components/ui/tags";
import type { Period } from "@/data/types";
import { useStockRecords } from "@/hooks/queries";

const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
];

const th = "px-1 pb-2.5 text-[11px] font-bold tracking-[0.04em] text-muted-2 uppercase";
const td = "border-t border-border px-1 py-[13px] text-[13.5px] text-ink";

export default function StockRecordsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const records = useStockRecords(period);

  return (
    <>
      <PageHeader title="Stock Records" />
      <PageContent className="pt-1">
        <TabRow tabs={periods} value={period} onChange={setPeriod} />

        <QueryView query={records} loading={<SkeletonList rows={6} />}>
          {(rows) => (
            <GroupedCard className="px-3.5 pt-3.5 pb-1.5">
              {rows.length === 0 ? (
                <EmptyState>No products yet.</EmptyState>
              ) : (
                <table className={`w-full border-collapse transition-opacity ${records.isPlaceholderData ? "opacity-60" : ""}`}>
                  <thead>
                    <tr>
                      <th className={`${th} text-left`}>Product</th>
                      <th className={`${th} text-right`}>Purchased</th>
                      <th className={`${th} text-right`}>Sold</th>
                      <th className={`${th} text-right`}>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.product}>
                        <td className={`${td} font-semibold`}>{r.product}</td>
                        <td className={`${td} text-right tabular-nums`}>{r.purchased}</td>
                        <td className={`${td} text-right tabular-nums`}>{r.sold}</td>
                        <td className={`${td} text-right tabular-nums`}>{r.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GroupedCard>
          )}
        </QueryView>
        <p className="mx-1 mt-3 text-[11.5px] leading-normal text-muted-2">
          "Remaining" is your current actual stock. Purchased and Sold reflect the selected period.
        </p>
      </PageContent>
    </>
  );
}
