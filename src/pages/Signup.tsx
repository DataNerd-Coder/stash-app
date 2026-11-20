import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { PageContent, PageHeader } from "@/components/ui/page";
import { useUpdateBusiness } from "@/hooks/queries";
import { session } from "@/lib/session";

function Field({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[50px] w-full rounded-2xl border border-border bg-surface px-4 text-[14.5px] text-ink outline-none focus:border-primary"
      />
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const updateBusiness = useUpdateBusiness();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const details = { ownerName: ownerName.trim(), businessName: businessName.trim(), phone: phone.trim() };
    updateBusiness.mutate(details, {
      onSuccess: () => {
        session.saveBusiness(details);
        session.markOnboarded();
        navigate("/dashboard");
      },
    });
  };

  return (
    <>
      <PageHeader title="Set up your business" back="/welcome" />
      <PageContent chatPad={false} className="pt-2">
        <p className="mb-[22px] text-[13.5px] leading-normal text-muted">
          This is just so Stash knows what to call you. You can always change it later.
        </p>
        <form onSubmit={onSubmit}>
          <Field label="Your name" id="ownerName" placeholder="e.g. Michael Chidi" value={ownerName} onChange={setOwnerName} />
          <Field label="Business name" id="businessName" placeholder="e.g. Chidi's Provisions" value={businessName} onChange={setBusinessName} />
          <Field label="Phone number" id="phone" type="tel" placeholder="080X XXX XXXX" value={phone} onChange={setPhone} />
          {updateBusiness.isError && (
            <p className="mb-3 text-[13px] font-semibold text-danger" role="alert">
              {updateBusiness.error.message}
            </p>
          )}
          <Button type="submit" className="mt-2 disabled:opacity-70" disabled={updateBusiness.isPending}>
            {updateBusiness.isPending ? "Setting up…" : "Create my dashboard"}
          </Button>
        </form>
      </PageContent>
    </>
  );
}
