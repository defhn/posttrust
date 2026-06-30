import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell";
import VoiceProfileClient from "@/components/voice-profile-client";
import { getCurrentUser, getUserCredits } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const credits = await getUserCredits(user.id);

  const shellUser = {
    id: user.id,
    email: user.email,
    credits,
    hasVoiceProfile: Boolean(user.voiceProfileEnabledAt),
    hasBilling: Boolean(user.stripeCustomerId),
    subscriptionStatus: user.subscriptionStatus,
  };

  return (
    <AppShell
      user={shellUser}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Voice Profile" },
      ]}
    >
      <VoiceProfileClient enabled={Boolean(user.voiceProfileEnabledAt)} />
    </AppShell>
  );
}
