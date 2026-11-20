import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { PageContent, PageHeader } from "@/components/ui/page";
import { useSignup } from "@/hooks/queries";

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();
  const [form, setForm] = useState({ ownerName: "", businessName: "", phone: "", password: "" });
  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    signup.mutate(form, { onSuccess: () => navigate("/dashboard", { replace: true }) });
  };

  return (
    <>
      <PageHeader title="Set up your business" back="/welcome" />
      <PageContent chatPad={false} className="pt-2">
        <p className="mb-[22px] text-[13.5px] leading-normal text-muted">
          This is just so Stash knows what to call you. You can always change it later.
        </p>
        <form onSubmit={onSubmit}>
          <Field label="Your name" id="ownerName" placeholder="e.g. Michael Chidi" required autoComplete="name" value={form.ownerName} onChange={set("ownerName")} />
          <Field label="Business name" id="businessName" placeholder="e.g. Chidi's Provisions" required autoComplete="organization" value={form.businessName} onChange={set("businessName")} />
          <Field label="Phone number" id="phone" type="tel" placeholder="080X XXX XXXX" required autoComplete="tel" value={form.phone} onChange={set("phone")} />
          <Field label="Password" id="password" type="password" placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" value={form.password} onChange={set("password")} />
          <FormError error={signup.error} />
          <Button type="submit" className="mt-2 disabled:opacity-70" disabled={signup.isPending}>
            {signup.isPending ? "Setting up…" : "Create my dashboard"}
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </PageContent>
    </>
  );
}
