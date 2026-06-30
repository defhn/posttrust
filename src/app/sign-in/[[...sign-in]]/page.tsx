import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#F7F8F6] flex items-center justify-center px-4 py-16">
      <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </main>
  );
}
