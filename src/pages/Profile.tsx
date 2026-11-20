import { Chevron, GroupedCard, ListItem, RowBody } from "@/components/ui/list";
import { GroupLabel, PageContent, PageHeader } from "@/components/ui/page";
import { useProfile } from "@/hooks/useProfile";

function SettingsRow({ title, value }: { title: string; value?: string }) {
  return (
    <ListItem>
      <RowBody title={title} subtitle={value} />
      <Chevron />
    </ListItem>
  );
}

const settingsLabel = "mt-[22px] pb-2.5 text-[12px]";

export default function ProfilePage() {
  const profile = useProfile();

  return (
    <>
      <PageHeader title="Profile Details" />
      <PageContent chatPad={false} className="pt-1">
        <div className="flex flex-col items-center pt-2.5 pb-6">
          <div className="mb-3 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-primary-dark font-display text-[28px] font-bold text-white">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-[17px] font-bold text-ink">{profile.businessName}</h2>
          <p className="mt-[3px] text-[13px] text-muted">{profile.fullName}</p>
          <button
            type="button"
            className="mt-3.5 cursor-pointer rounded-[20px] border border-mint bg-accent-tint px-4 py-2 text-[12.5px] font-bold text-primary"
          >
            Edit Details
          </button>
        </div>

        <GroupLabel className={settingsLabel}>Business</GroupLabel>
        <GroupedCard>
          <SettingsRow title="Business name" value={profile.businessName} />
          <SettingsRow title="Owner's name" value={profile.fullName} />
          <SettingsRow title="Phone number" value={profile.phone} />
          <SettingsRow title="Email address" value={profile.email} />
        </GroupedCard>

        <GroupLabel className={settingsLabel}>Security</GroupLabel>
        <GroupedCard>
          <SettingsRow title="Change password" />
          <SettingsRow title="Change phone number" />
          <SettingsRow title="Two-factor authentication" value="Off" />
          <SettingsRow title="Active sessions" />
        </GroupedCard>
      </PageContent>
    </>
  );
}
