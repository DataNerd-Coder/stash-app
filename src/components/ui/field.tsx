import type { ComponentProps } from "react";

/** Labelled text input in the onboarding style. */
export function Field({ label, id, ...input }: { label: string; id: string } & ComponentProps<"input">) {
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        className="h-[50px] w-full rounded-2xl border border-border bg-surface px-4 text-[14.5px] text-ink outline-none focus:border-primary"
        {...input}
      />
    </div>
  );
}

export function FormError({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <p className="mb-3 text-[13px] font-semibold text-danger" role="alert">
      {error.message}
    </p>
  );
}
