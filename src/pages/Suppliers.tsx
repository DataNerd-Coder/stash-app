import { InsightCard } from "@/components/ui/cards";
import { Amount, AmountNote, EmptyState, GroupedCard, ListItem, RowBody, RowTrailing } from "@/components/ui/list";
import { PageContent, PageHeader, PageIntro } from "@/components/ui/page";
import { QueryView, SkeletonList } from "@/components/ui/states";
import { StatusTag } from "@/components/ui/tags";
import { useSuppliers } from "@/hooks/queries";
import { formatNaira } from "@/lib/format";

export default function SuppliersPage() {
  const query = useSuppliers();

  return (
    <>
      <PageHeader title="Suppliers" />
      <PageContent className="pt-1">
        <PageIntro>Tell Stash about a new supplier or delivery any time to keep this updated.</PageIntro>

        <QueryView query={query} loading={<SkeletonList rows={3} />}>
          {({ suppliers, offers }) => {
            // supplier discovery — built only from real purchase history, never invented
            const offer = offers[0];
            return (
              <>
                {offer && (
                  <InsightCard
                    className="mb-5"
                    title={`You normally buy ${offer.product} for ${formatNaira(offer.usualCost)}.`}
                    subtitle={`${offer.supplier} is offering it for ${formatNaira(offer.offerCost)} — a saving of ${formatNaira(offer.usualCost - offer.offerCost)} per unit.`}
                  />
                )}
                <GroupedCard>
                  {suppliers.length === 0 && <EmptyState>No suppliers yet.</EmptyState>}
                  {suppliers.map((s) => (
                    <ListItem key={s.id}>
                      <RowBody title={s.name} subtitle={s.products.join(", ")} />
                      <RowTrailing>
                        {s.outstanding > 0 ? (
                          <>
                            <Amount className="text-danger">{formatNaira(s.outstanding)}</Amount>
                            <AmountNote className="text-muted-2">owed</AmountNote>
                          </>
                        ) : (
                          <StatusTag tone="ok">Settled</StatusTag>
                        )}
                      </RowTrailing>
                    </ListItem>
                  ))}
                </GroupedCard>
              </>
            );
          }}
        </QueryView>
      </PageContent>
    </>
  );
}
