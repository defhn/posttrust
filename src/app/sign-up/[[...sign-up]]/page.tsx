import { SignUp } from "@clerk/nextjs";
import AppShell from "@/components/app-shell";

export default function SignUpPage() {
  return (
    <AppShell
      user={null}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Sign up" },
      ]}
    >
      <div className="flex justify-center py-8">
        <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/" />
      </div>
    </AppShell>
  );
}
