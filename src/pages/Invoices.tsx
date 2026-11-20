import { Amount, EmptyState, GroupedCard, ListItem, RowBody, RowTrailing } from "@/components/ui/list";
import { PageContent, PageHeader, PageIntro } from "@/components/ui/page";
import { QueryView, SkeletonList } from "@/components/ui/states";
import { StatusTag, type StatusTone } from "@/components/ui/tags";
import type { InvoiceStatus } from "@/data/types";
import { useInvoices } from "@/hooks/queries";
import { formatCalendarDate } from "@/lib/dates";
import { formatNaira } from "@/lib/format";

const toneFor: Record<InvoiceStatus, StatusTone> = {
  Paid: "ok",
  Sent: "info",
  Overdue: "danger",
  Draft: "warn",
};

export default function InvoicesPage() {
  const invoices = useInvoices();

  return (
    <>
      <PageHeader title="Invoices" />
      <PageContent className="pt-1">
        <PageIntro>Say "Create an invoice for [customer] for ₦[amount]" to Stash to add one.</PageIntro>
        <QueryView query={invoices} loading={<SkeletonList rows={4} />}>
          {(items) => (
            <GroupedCard>
              {items.length === 0 ? (
                <EmptyState>No invoices yet.</EmptyState>
              ) : (
                items.map((inv) => (
                  <ListItem key={inv.id}>
                    <RowBody title={inv.customer} subtitle={`${inv.number} · ${formatCalendarDate(inv.issuedOn)}`} />
                    <RowTrailing>
                      <Amount>{formatNaira(inv.amount)}</Amount>
                      <div className="mt-1">
                        <StatusTag tone={toneFor[inv.status]}>{inv.status}</StatusTag>
                      </div>
                    </RowTrailing>
                  </ListItem>
                ))
              )}
            </GroupedCard>
          )}
        </QueryView>
      </PageContent>
    </>
  );
}
