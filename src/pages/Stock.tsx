import { useNavigate } from "react-router";
import { StockRow } from "@/components/StockRow";
import { Button } from "@/components/ui/button";
import { EmptyState, GroupedCard } from "@/components/ui/list";
import { PageContent, PageHeader, PageIntro } from "@/components/ui/page";
import { QueryView, SkeletonList } from "@/components/ui/states";
import { useLowStock } from "@/hooks/queries";

export default function StockPage() {
  const navigate = useNavigate();
  const lowStock = useLowStock();

  return (
    <>
      <PageHeader title="Almost out of stock" />
      <PageContent className="pt-1">
        <PageIntro className="leading-[normal]">Lowest stock first</PageIntro>
        <QueryView query={lowStock} loading={<SkeletonList rows={6} />}>
          {(items) => (
            <GroupedCard>
              {items.length === 0 ? <EmptyState>Everything is well stocked.</EmptyState> : items.map((s) => <StockRow key={s.name} item={s} />)}
            </GroupedCard>
          )}
        </QueryView>
        <Button className="mt-[22px]" onClick={() => navigate("/dashboard?openChat=1")}>
          Ask Stash to help me restock
        </Button>
      </PageContent>
    </>
  );
}
