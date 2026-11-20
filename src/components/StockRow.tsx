import { BoxIcon } from "@/components/icons";
import { ListItem, RowIcon, RowTitle, RowTrailing } from "@/components/ui/list";
import { cn } from "@/lib/cn";
import type { LowStockItem } from "@/data/types";

/** "Almost out of stock" row with a remaining-stock bar. */
export function StockRow({ item }: { item: LowStockItem }) {
  const danger = item.level === "danger";
  return (
    <ListItem>
      <RowIcon tone={item.level}>
        <BoxIcon />
      </RowIcon>
      <div className="min-w-0 flex-1">
        <RowTitle>{item.name}</RowTitle>
        <div className="mt-[7px] h-[5px] overflow-hidden rounded-[4px] bg-border">
          <div className={cn("h-full rounded-[4px]", danger ? "bg-danger" : "bg-amber")} style={{ width: `${item.pct}%` }} />
        </div>
      </div>
      <RowTrailing>
        <div className={cn("text-[12px] font-bold whitespace-nowrap", danger ? "text-danger" : "text-amber")}>{item.remaining}</div>
      </RowTrailing>
    </ListItem>
  );
}
