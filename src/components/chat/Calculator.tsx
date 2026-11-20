import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { ModalCard, ModalOverlay } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { safeEval, toStashSummary, togglePlusMinus } from "@/lib/calculator";
import { formatCalcNumber } from "@/lib/format";
import { chipButton } from "./styles";

interface HistoryEntry {
  expr: string;
  result: string;
}

const key = "h-14 cursor-pointer rounded-2xl bg-bg font-sans text-[19px] font-semibold text-ink active:opacity-70";
const fn = "bg-calc-fn text-[16px] text-primary-dark";
const op = "bg-accent-tint text-[20px] text-primary";

export function Calculator({ open, onClose, onUse }: { open: boolean; onClose: () => void; onUse: (summary: string) => void }) {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastFullExpr, setLastFullExpr] = useState<string | null>(null);

  const input = (token: string) => setExpr((e) => e + token);

  const equals = () => {
    if (!expr) return;
    const val = safeEval(expr);
    if (val === null) return;
    setLastFullExpr(expr);
    setHistory((h) => [...h, { expr, result: formatCalcNumber(val) }].slice(-6));
    setExpr(String(val)); // keep the raw value for further calculation
  };

  const useInStash = () => {
    if (!expr) return;
    const val = safeEval(expr);
    if (val === null) return;
    // prefer the last full expression (with operators) if the display is just its bare result
    const source = lastFullExpr && String(val) === expr ? lastFullExpr : expr;
    onUse(toStashSummary(source, val));
  };

  const value = expr ? safeEval(expr) : 0;

  const keys: Array<{ label: string; className?: string; onClick: () => void }> = [
    { label: "AC", className: fn, onClick: () => setExpr("") },
    { label: "⌫", className: fn, onClick: () => setExpr((e) => e.slice(0, -1)) },
    { label: "%", className: fn, onClick: () => input("%") },
    { label: "÷", className: op, onClick: () => input("÷") },
    ...["7", "8", "9"].map((d) => ({ label: d, onClick: () => input(d) })),
    { label: "×", className: op, onClick: () => input("×") },
    ...["4", "5", "6"].map((d) => ({ label: d, onClick: () => input(d) })),
    { label: "−", className: op, onClick: () => input("−") },
    ...["1", "2", "3"].map((d) => ({ label: d, onClick: () => input(d) })),
    { label: "+", className: op, onClick: () => input("+") },
    { label: "±", onClick: () => setExpr(togglePlusMinus) },
    { label: "0", onClick: () => input("0") },
    { label: ".", onClick: () => input(".") },
    { label: "=", className: "bg-primary text-white", onClick: equals },
    { label: "(", className: fn, onClick: () => input("(") },
    { label: ")", className: fn, onClick: () => input(")") },
  ];

  return (
    <ModalOverlay open={open} label="Calculator">
      <ModalCard open={open} className="max-w-[360px] rounded-card px-4 pt-4 pb-5">
        <div className="flex items-center justify-between px-1 pt-0.5 pb-2.5">
          <span className="font-display text-[15px] font-bold text-ink">Calculator</span>
          <button type="button" className={chipButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="mb-1.5 flex max-h-16 flex-col-reverse gap-0.5 overflow-y-auto px-1">
          {history
            .slice()
            .reverse()
            .map((h, i) => (
              <div key={i} className="text-right text-[11.5px] text-muted-2">
                {h.expr} = {h.result}
              </div>
            ))}
        </div>

        <div className="mb-3 rounded-2xl bg-bg px-[18px] py-4 text-right">
          <div className="min-h-4 text-[13px] text-muted tabular-nums">{expr || " "}</div>
          <div className="mt-1 overflow-x-auto font-display text-[32px] font-bold whitespace-nowrap text-ink tabular-nums">
            {value !== null ? formatCalcNumber(value) : "Error"}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {keys.map((k) => (
            <button key={k.label} type="button" className={cn(key, k.className)} onClick={k.onClick}>
              {k.label}
            </button>
          ))}
          <button type="button" className={cn(key, "col-span-2 bg-primary-dark text-[13.5px] font-bold text-white")} onClick={useInStash}>
            Use in Stash
          </button>
        </div>
      </ModalCard>
    </ModalOverlay>
  );
}
