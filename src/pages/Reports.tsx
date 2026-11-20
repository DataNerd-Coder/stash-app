import { MiniChart, StatBox, StatGrid, TintCard } from "@/components/ui/cards";
import { Amount, EmptyState, GroupedCard, ListItem, RowBody, RowIcon, RowTrailing } from "@/components/ui/list";
import { PageContent, PageHeader, SectionLabel } from "@/components/ui/page";
import { QueryView, SkeletonBlock, SkeletonList } from "@/components/ui/states";
import { useReports } from "@/hooks/queries";
import { formatNaira, formatNairaCompact } from "@/lib/format";

export default function ReportsPage() {
  const reports = useReports();

  return (
    <>
      <PageHeader title="Reports" />
      <PageContent className="pt-1">
        <QueryView
          query={reports}
          loading={
            <>
              <div className="mb-2 grid grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-[82px] rounded-[18px]" />
                ))}
              </div>
              <SectionLabel title="Sales trend (7 days)" className="mt-6" />
              <SkeletonBlock className="h-[96px]" />
              <SectionLabel title="Best-performing products" />
              <SkeletonList rows={3} />
            </>
          }
        >
          {(r) => (
            <>
              <StatGrid>
                <StatBox value={formatNairaCompact(r.revenue30d)} label="Revenue, last 30 days" />
                <StatBox value={formatNairaCompact(r.profit30d)} label="Profit, last 30 days" />
              </StatGrid>
              <StatGrid>
                <StatBox value={r.marginPct === null ? "—" : `${r.marginPct}%`} label="Average margin" />
                <StatBox value={formatNaira(r.expenses30d)} label="Expenses, last 30 days" />
              </StatGrid>

              <SectionLabel title="Sales trend (7 days)" className="mt-6" />
              <TintCard className="pt-4">
                <MiniChart bars={r.weekBars} className="mt-1" />
              </TintCard>

              <SectionLabel title="Best-performing products" />
              <GroupedCard>
                {r.topProducts.length === 0 && <EmptyState>No sales in the last 30 days.</EmptyState>}
                {r.topProducts.map((p) => (
                  <ListItem key={p.rank}>
                    <RowIcon>{p.rank}</RowIcon>
                    <RowBody title={p.name} subtitle={`${p.share}% of revenue, last 30 days`} />
                    <RowTrailing>
                      <Amount>{formatNaira(p.revenue)}</Amount>
                    </RowTrailing>
                  </ListItem>
                ))}
              </GroupedCard>

              <SectionLabel title="Expense breakdown" />
              <GroupedCard>
                {r.expenseBreakdown.length === 0 && <EmptyState>No expenses in the last 30 days.</EmptyState>}
                {r.expenseBreakdown.map((e) => (
                  <ListItem key={e.category}>
                    <RowBody title={e.category} />
                    <RowTrailing>
                      <Amount>{formatNaira(e.amount)}</Amount>
                    </RowTrailing>
                  </ListItem>
                ))}
              </GroupedCard>
            </>
          )}
        </QueryView>
      </PageContent>
    </>
  );
}
