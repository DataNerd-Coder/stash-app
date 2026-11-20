import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      sections={[
        {
          heading: "Using Stash",
          body: "Stash is a business management tool for small business owners. By using it, you agree to provide accurate business information and use the service for legitimate business purposes.",
        },
        {
          heading: "Your account",
          body: "You're responsible for keeping your account credentials secure and for all activity that happens under your account.",
        },
        {
          heading: "Your data",
          body: "You own the business data you record in Stash. We store and process it to provide the service, as described in our Privacy policy.",
        },
        {
          heading: "Acceptable use",
          body: "Don't use Stash to record false business information, attempt to disrupt the service, or access other users' accounts without permission.",
        },
        {
          heading: "Changes",
          body: "We may update these terms from time to time. Continued use of Stash after changes means you accept the updated terms.",
        },
        { heading: "Contact", body: "Questions about these terms can be sent to support@stash.app." },
      ]}
    />
  );
}
