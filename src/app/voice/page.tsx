import { redirect } from "next/navigation";

import VoiceProfileClient from "@/components/voice-profile-client";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/?signin=required");

  return <VoiceProfileClient enabled={Boolean(user.voiceProfileEnabledAt)} />;
}
