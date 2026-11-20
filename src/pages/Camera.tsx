import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FlashIcon, GalleryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { InsightCard } from "@/components/ui/cards";
import { Amount, GroupedCard, ListItem, RowBody, RowIcon, RowTrailing } from "@/components/ui/list";
import { PageContent, PageHeader, SectionLabel } from "@/components/ui/page";
import { formatNaira } from "@/lib/format";

type Step = "capture" | "processing" | "confirm";

const titles: Record<Step, string> = {
  capture: "Snap your notebook",
  processing: "Processing",
  confirm: "Confirm entry",
};

const readItems = [
  { name: "Indomie", qty: 10, unitPrice: 1200 },
  { name: "Coca-Cola", qty: 6, unitPrice: 800 },
  { name: "Peak Milk", qty: 4, unitPrice: 900 },
];

const sideButton = "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white";

/** Standalone snap-notebook demo flow. */
export default function CameraPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("capture");

  useEffect(() => {
    if (step !== "processing") return;
    const t = window.setTimeout(() => setStep("confirm"), 1800);
    return () => window.clearTimeout(t);
  }, [step]);

  return (
    <>
      <PageHeader title={titles[step]} docTitle="Camera" />

      {step === "capture" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative mt-1 mb-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-card bg-linear-[160deg] from-[#12271F] to-[#0B1712]">
            <div className="flex h-[64%] w-[82%] items-center justify-center rounded-[18px] border-2 border-dashed border-white/35 p-5 text-center">
              <p className="text-[12.5px] leading-normal text-white/70">Line up today's notebook page inside the frame, then tap to capture.</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-7 pb-2">
            <button type="button" className={sideButton} title="Flash" aria-label="Flash">
              <FlashIcon />
            </button>
            <button
              type="button"
              aria-label="Capture"
              onClick={() => setStep("processing")}
              className="h-[70px] w-[70px] cursor-pointer rounded-full border-4 border-white/35 bg-white"
            />
            <button type="button" className={sideButton} title="Gallery" aria-label="Gallery">
              <GalleryIcon />
            </button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
            <div className="h-14 w-14 animate-spinner rounded-full border-4 border-accent-tint border-t-primary" />
            <h2 className="text-[16px] font-bold text-ink">Reading your notebook...</h2>
            <p className="max-w-[260px] text-[13px] text-muted">Stash is matching handwriting to products, quantities and prices.</p>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <PageContent chatPad={false} className="pt-1.5">
          <InsightCard
            className="mb-[22px]"
            eyebrow="Got it"
            title="I recorded 6 sales from today's page."
            subtitle={`Total value: ${formatNaira(18400)}. Your records are now up to date.`}
          />
          <SectionLabel title="What I read" />
          <GroupedCard>
            {readItems.map((item) => (
              <ListItem key={item.name}>
                <RowIcon>{"✓"}</RowIcon>
                <RowBody title={item.name} subtitle={`${item.qty} @ ${formatNaira(item.unitPrice)}`} />
                <RowTrailing>
                  <Amount>{formatNaira(item.qty * item.unitPrice)}</Amount>
                </RowTrailing>
              </ListItem>
            ))}
          </GroupedCard>
          <div className="mt-[26px] pb-2.5">
            <Button onClick={() => navigate("/dashboard")}>Done</Button>
            <div className="h-2.5" />
            <Button variant="secondary" onClick={() => navigate("/dashboard?openChat=1")}>
              Ask Stash about this
            </Button>
          </div>
        </PageContent>
      )}
    </>
  );
}
