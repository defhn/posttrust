import { SignIn } from "@clerk/nextjs";
import AppShell from "@/components/app-shell";

export default function SignInPage() {
  return (
    <AppShell
      user={null}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Sign in" },
      ]}
    >
      <div className="flex justify-center py-8">
        <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/" />
      </div>
    </AppShell>
  );
}
