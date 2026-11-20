import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { PageContent, PageHeader } from "@/components/ui/page";
import { useLogin } from "@/hooks/queries";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ phone, password }, { onSuccess: () => navigate(from, { replace: true }) });
  };

  return (
    <>
      <PageHeader title="Log in" back="/welcome" />
      <PageContent chatPad={false} className="pt-2">
        <p className="mb-[22px] text-[13.5px] leading-normal text-muted">Welcome back. Log in with the phone number you signed up with.</p>
        <form onSubmit={onSubmit}>
          <Field label="Phone number" id="phone" type="tel" placeholder="080X XXX XXXX" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Field label="Password" id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormError error={login.error} />
          <Button type="submit" className="mt-2 disabled:opacity-70" disabled={login.isPending}>
            {login.isPending ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-muted">
          New to Stash?{" "}
          <Link to="/signup" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </PageContent>
    </>
  );
}
