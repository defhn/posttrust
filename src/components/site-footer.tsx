import Link from "next/link";
import { Shield } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#171A18]/8 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#171A18]/45">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[#176B4D]" />
          <span>© {new Date().getFullYear()} PostTrust. All rights reserved.</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-[#171A18] transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-[#171A18] transition-colors">Terms</Link>
          <a href="mailto:support@posttrust.com" className="hover:text-[#171A18] transition-colors">Support</a>
        </nav>
      </div>
    </footer>
  );
}
