import { Fragment } from "react";
import { PageContent, PageHeader } from "@/components/ui/page";

export interface LegalSection {
  heading: string;
  body: string;
}

/** Static text page (Privacy, Terms). */
export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <>
      <PageHeader title={title} />
      <PageContent chatPad={false} className="pt-2 text-[13.5px] leading-[1.7] text-muted">
        {sections.map((s) => (
          <Fragment key={s.heading}>
            <h3 className="mt-[22px] mb-2 text-[14px] font-bold text-ink first:mt-0">{s.heading}</h3>
            <p className="my-[1em]">{s.body}</p>
          </Fragment>
        ))}
      </PageContent>
    </>
  );
}
