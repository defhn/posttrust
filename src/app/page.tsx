import { getCurrentUser, getUserCredits } from "@/lib/auth";
import LandingClient from "@/components/landing-client";

// Set page to dynamic rendering to fetch user state on each visit
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  
  let clientUser = null;
  
  if (user) {
    const credits = await getUserCredits(user.id);
    clientUser = {
      id: user.id,
      email: user.email,
      credits,
      hasVoiceProfile: Boolean(user.voiceProfileEnabledAt),
      hasBilling: Boolean(user.stripeCustomerId),
      subscriptionStatus: user.subscriptionStatus,
    };
  }

  return <LandingClient user={clientUser} />;
}
