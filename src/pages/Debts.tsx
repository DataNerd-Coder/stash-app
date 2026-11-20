import { Amount, EmptyState, GroupedCard, ListItem, RowBody, RowTrailing } from "@/components/ui/list";
import { PageContent, PageHeader, PageIntro } from "@/components/ui/page";
import { QueryView, SkeletonList } from "@/components/ui/states";
import { StatusTag } from "@/components/ui/tags";
import { useDebts } from "@/hooks/queries";
import { formatCalendarDate } from "@/lib/dates";
import { formatNaira } from "@/lib/format";

export default function DebtsPage() {
  const debts = useDebts();

  return (
    <>
      <PageHeader title="Debts" />
      <PageContent className="pt-1">
        <PageIntro>Money customers owe your business. Tell Stash to add or update a debt any time.</PageIntro>
        <QueryView query={debts} loading={<SkeletonList rows={3} />}>
          {(items) => (
            <GroupedCard>
              {items.length === 0 ? (
                <EmptyState>Nobody owes you money right now.</EmptyState>
              ) : (
                items.map((d) => {
                  const date = formatCalendarDate(d.incurredOn);
                  return (
                    <ListItem key={d.id}>
                      <RowBody title={d.customer} subtitle={d.status === "Partly paid" ? `Balance ${formatNaira(d.balance)} · ${date}` : date} />
                      <RowTrailing>
                        <Amount>{formatNaira(d.amount)}</Amount>
                        <div className="mt-1">
                          <StatusTag tone={d.status === "Outstanding" ? "danger" : "warn"}>{d.status}</StatusTag>
                        </div>
                      </RowTrailing>
                    </ListItem>
                  );
                })
              )}
            </GroupedCard>
          )}
        </QueryView>
      </PageContent>
    </>
  );
}
