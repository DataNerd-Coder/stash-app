import { BankIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { GroupedCard, ListItem, RowBody } from "@/components/ui/list";
import { PageContent, PageHeader, SectionLabel } from "@/components/ui/page";
import { QueryView, SkeletonBlock, SkeletonList } from "@/components/ui/states";
import { StatusTag } from "@/components/ui/tags";
import type { BankTransaction } from "@/data/types";
import { useBank, useReconcile } from "@/hooks/queries";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { formatNaira } from "@/lib/format";

function StatusLabel({ status }: { status: BankTransaction["status"] }) {
  if (status === "matched") return <StatusTag tone="ok">Matched</StatusTag>;
  if (status === "review") return <StatusTag tone="warn">Needs review</StatusTag>;
  return <StatusTag tone="danger">Unmatched</StatusTag>;
}

export default function BankPage() {
  const bank = useBank();
  const reconcile = useReconcile();

  return (
    <>
      <PageHeader title="Bank" />
      <PageContent className="pt-1">
        <QueryView
          query={bank}
          loading={
            <>
              <SkeletonBlock className="mb-[22px] h-[80px]" />
              <SkeletonList rows={4} />
            </>
          }
        >
          {({ account, transactions }) =>
            account ? (
              <>
                <div className="mb-[22px] flex items-center gap-3.5 rounded-card border border-mint bg-linear-to-b from-accent-tint to-accent-tint-2 px-5 py-[18px] shadow-card">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/70 text-primary">
                    <BankIcon />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-ink">
                      {account.bankName} •••• {account.accountTail}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">Connected — comparing bank activity with your Stash records</div>
                  </div>
                </div>

                <SectionLabel title="Recent transactions" className="mt-0" />
                <GroupedCard>
                  {transactions.map((t) => {
                    const busy = reconcile.isPending && reconcile.variables === t.id;
                    return (
                      <ListItem key={t.id}>
                        <RowBody title={t.description} subtitle={`${formatDateTime(t.occurredAt)}${t.matchedTo ? ` · ${t.matchedTo}` : ""}`} />
                        <div className="flex shrink-0 flex-row items-center gap-2 text-right">
                          <div className="text-right">
                            <div className={cn("text-[13.5px] font-bold tabular-nums", t.amount < 0 ? "text-danger" : "text-ink")}>
                              {t.amount < 0 ? "-" : ""}
                              {formatNaira(Math.abs(t.amount))}
                            </div>
                            <div className="mt-1">
                              <StatusLabel status={t.status} />
                            </div>
                          </div>
                          {t.status !== "matched" && (
                            <button
                              type="button"
                              disabled={reconcile.isPending}
                              onClick={() => reconcile.mutate(t.id)}
                              className="cursor-pointer rounded-[14px] bg-primary px-3 py-[7px] text-[11.5px] font-bold whitespace-nowrap text-white disabled:cursor-default disabled:opacity-60"
                            >
                              {busy ? "Saving…" : "Reconcile"}
                            </button>
                          )}
                        </div>
                      </ListItem>
                    );
                  })}
                </GroupedCard>

                {reconcile.isError && (
                  <p className="mx-1 mt-3 text-[12px] font-semibold text-danger" role="alert">
                    {reconcile.error.message}
                  </p>
                )}
                <p className="mx-1 mt-3.5 text-[11.5px] leading-normal text-muted-2">
                  Stash only reconciles a transaction when you confirm it. Nothing is matched automatically without your say-so.
                </p>
              </>
            ) : (
              <div className="px-3 pt-10 pb-5 text-center">
                <div className="mx-auto mb-5 flex h-[110px] w-[110px] items-center justify-center rounded-[36px] bg-accent-tint text-primary">
                  <BankIcon size={48} strokeWidth={1.6} />
                </div>
                <h2 className="mb-2 text-[17px] font-bold text-ink">Connect your bank</h2>
                <p className="mb-5 text-[13px] leading-normal text-muted">
                  Stash can compare your bank activity with your business records and flag anything that needs a second look — you stay in
                  control of every match.
                </p>
                {/* Bank linking (e.g. Mono/Okra) isn't integrated yet */}
                <Button disabled className="cursor-default opacity-60">
                  Bank linking coming soon
                </Button>
              </div>
            )
          }
        </QueryView>
      </PageContent>
    </>
  );
}
