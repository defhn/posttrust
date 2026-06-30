import AppShell from "@/components/app-shell";

export const metadata = {
  title: "Privacy Policy | PostTrust",
};

export default function PrivacyPage() {
  return (
    <AppShell
      user={null}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Privacy" },
      ]}
    >
      <div className="max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#176B4D]">Privacy</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#171A18]">Privacy Policy</h1>
          <p className="text-sm text-[#171A18]/55">Last updated: June 30, 2026</p>
        </div>

        <section className="space-y-5 text-sm leading-7 text-[#171A18]/75">
          <p>
            PostTrust is a pre-publish audit tool for LinkedIn drafts. We collect the information needed to
            authenticate your email, run audits, store your audit history, manage credits, and process payments.
          </p>
          <p>
            We may store your email address, submitted drafts, audit results, credit ledger entries, purchase
            records, and one Voice Profile per email account when you choose to create it. Drafts submitted for
            analysis are sent to our AI provider to generate diagnostics and rewrite suggestions.
          </p>
          <p>
            Payments are processed by Stripe. Email delivery and optional marketing consent are handled through
            Brevo. We do not sell your personal information or connect to your LinkedIn account.
          </p>
          <p>
            You can delete individual audit records from your account history. For privacy questions, contact
            support@posttrust.com.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
