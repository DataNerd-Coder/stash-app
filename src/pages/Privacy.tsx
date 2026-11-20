import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      sections={[
        {
          heading: "What we collect",
          body: "Stash collects the business information you provide directly — sales, stock, expenses, and other records you write or photograph — along with basic account details like your name, phone number, and email.",
        },
        {
          heading: "How we use it",
          body: "Your data is used to power your dashboard, answer your questions in chat, and generate insights about your business. We do not sell your business data to third parties.",
        },
        {
          heading: "Photos and notebook pages",
          body: "Images you capture are processed to extract sales and stock information, then stored securely so you can review what Stash recorded.",
        },
        {
          heading: "Your control",
          body: "You can request a copy of your data or ask for it to be deleted at any time from within the app or by contacting support.",
        },
        { heading: "Contact", body: "Questions about this policy can be sent to privacy@stash.app." },
      ]}
    />
  );
}
