import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { RowSubtitle, RowTitle } from "@/components/ui/list";
import { PageContent, PageHeader, PageIntro, SectionLabel } from "@/components/ui/page";

const MIN_QTY = 5;
const MAX_QTY = 500;

// Replace with real server-issued identifiers once there's a backend.
const randomBarcodeId = () => `STB-${Math.floor(1000 + Math.random() * 9000)}`;

const stepperButton =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-[11px] border border-border bg-bg text-[18px] font-bold text-ink";

export default function BarcodePage() {
  const navigate = useNavigate();
  const scanInput = useRef<HTMLInputElement>(null);
  const [qty, setQty] = useState(50);
  const [showName, setShowName] = useState(false);
  const [labels, setLabels] = useState<string[] | null>(null);
  const [labelsShowName, setLabelsShowName] = useState(false);

  const step = (delta: number) => setQty((q) => Math.max(MIN_QTY, Math.min(MAX_QTY, q + delta)));

  const generate = () => {
    setLabels(Array.from({ length: qty }, randomBarcodeId));
    setLabelsShowName(showName);
    window.scrollTo(0, 0);
  };

  const onScan = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) navigate(`/dashboard?openChat=1&scanned=${randomBarcodeId()}`);
  };

  return (
    <>
      <PageHeader title="Barcodes" />

      {labels === null ? (
        <PageContent className="pt-1">
          <PageIntro className="mb-4">
            Blank, reusable barcode labels. Attach one to any item, then tell Stash what it is and its cost. Once the item is sold, the
            barcode is free to reuse on something new.
          </PageIntro>

          <SectionLabel title="Quantity to generate" />
          <div className="flex items-center justify-between gap-3.5 rounded-[18px] border border-border bg-surface px-[18px] py-3.5">
            <button type="button" className={stepperButton} onClick={() => step(-MIN_QTY)} aria-label="Fewer labels">
              {"−"}
            </button>
            <span className="font-display text-[20px] font-bold text-ink" aria-live="polite">
              {qty}
            </span>
            <button type="button" className={stepperButton} onClick={() => step(MIN_QTY)} aria-label="More labels">
              +
            </button>
          </div>

          <label className="mt-2.5 flex cursor-pointer items-center justify-between rounded-[18px] border border-border bg-surface px-4 py-3.5">
            <div>
              <RowTitle className="text-[13.5px]">Show product name on label</RowTitle>
              <RowSubtitle>Only if you've already assigned one</RowSubtitle>
            </div>
            <span className="relative h-6 w-[42px] shrink-0">
              <input type="checkbox" className="peer sr-only" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
              <span className="absolute inset-0 rounded-[20px] bg-border transition-colors duration-150 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
              <span className="absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-150 peer-checked:translate-x-[18px]" />
            </span>
          </label>

          <Button className="mt-[22px]" onClick={generate}>
            Generate labels
          </Button>

          <SectionLabel title="Or scan an existing barcode" className="mt-7" />
          <Button variant="secondary" onClick={() => scanInput.current?.click()}>
            Scan barcode
          </Button>
          <input ref={scanInput} type="file" accept="image/*" capture="environment" hidden onChange={onScan} />
        </PageContent>
      ) : (
        <PageContent className="pt-1 print:p-0">
          <SectionLabel
            title={`${labels.length} labels ready`}
            className="mt-0 print:hidden"
            action={
              <button type="button" className="cursor-pointer text-[12px] font-semibold text-primary" onClick={() => setLabels(null)}>
                Edit
              </button>
            }
          />
          <div className="mt-1 grid grid-cols-2 gap-2.5">
            {labels.map((id, i) => (
              <div key={i} className="flex break-inside-avoid flex-col items-center gap-1 rounded-[10px] border border-border bg-white px-2 pt-2.5 pb-1.5">
                <div className="barcode-bars" />
                <div className="font-display text-[11px] font-semibold tracking-[0.04em] text-ink">{id}</div>
                {labelsShowName && <div className="text-[10px] text-muted">Unassigned</div>}
              </div>
            ))}
          </div>
          <Button className="mt-5 print:hidden" onClick={() => window.print()}>
            Print labels
          </Button>
        </PageContent>
      )}
    </>
  );
}
