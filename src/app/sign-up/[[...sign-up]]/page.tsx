import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#F7F8F6] flex items-center justify-center px-4 py-16">
      <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </main>
  );
}
