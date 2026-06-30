import Link from "next/link";

export const metadata = {
  title: "Terms | PostTrust",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F8F6]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <Link href="/" className="text-sm font-semibold text-[#176B4D] hover:text-[#0F4D36]">
          Back to PostTrust
        </Link>

        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#176B4D]">Terms</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#171A18]">Terms of Service</h1>
          <p className="text-sm text-[#171A18]/55">Last updated: June 30, 2026</p>
        </div>

        <section className="space-y-5 text-sm leading-7 text-[#171A18]/75">
          <p>
            PostTrust provides writing diagnostics and rewrite suggestions. The output is not a guarantee of
            commercial results, lead generation performance, or LinkedIn platform outcomes.
          </p>
          <p>
            You are responsible for reviewing every suggestion before publishing. Do not submit confidential,
            regulated, or third-party content unless you have the right to process it through the service.
          </p>
          <p>
            Credits are tied to your verified email account. The Voice Profile Pack allows one active Voice
            Profile per email account. Monthly plans renew through Stripe and can be managed through the billing
            portal when a Stripe customer record exists.
          </p>
          <p>
            We may refuse, suspend, or limit usage that attempts to abuse the service, bypass payment controls, or
            process unlawful content. For support, contact support@posttrust.com.
          </p>
        </section>
      </div>
    </main>
  );
}
