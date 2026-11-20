import { useEffect, useState } from "react";
import { StatBox, StatGrid } from "@/components/ui/cards";
import { PageContent, PageHeader } from "@/components/ui/page";
import { referrals } from "@/data/mock";

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyLink = () => {
    navigator.clipboard
      ?.writeText(referrals.link)
      .then(() => setCopied(true))
      .catch(() => {
        /* clipboard blocked — leave the button as is */
      });
  };

  return (
    <>
      <PageHeader title="Referrals" />
      <PageContent chatPad={false} className="pt-1">
        <p className="mb-4 text-[13px] leading-normal text-muted">
          Share your link. When someone you refer signs up for Stash, you both get rewarded.
        </p>

        <div className="mb-[22px] flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 py-3">
          <span className="flex-1 truncate text-[13px] text-muted">{referrals.link}</span>
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 cursor-pointer rounded-[14px] bg-primary px-3.5 py-2 text-[12px] font-bold text-white"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        <StatGrid>
          <StatBox value={referrals.successful} label="Successful referrals" />
          <StatBox value={referrals.earned} label="Rewards earned" />
        </StatGrid>
        <StatGrid>
          <StatBox className="col-span-full" value={referrals.pending} label="Pending rewards" />
        </StatGrid>
      </PageContent>
    </>
  );
}
