"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";

interface ShellUser {
  id: string;
  email: string;
  credits: number;
  hasVoiceProfile?: boolean;
  hasBilling?: boolean;
  subscriptionStatus?: string | null;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppShellProps {
  user: ShellUser | null;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AppShell({ user, breadcrumbs = [], children, actions }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F8F6] flex flex-col">
      <SiteHeader user={user} />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {(breadcrumbs.length > 0 || actions) && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-[#171A18]/45">
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                      <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
                        {item.href && !isLast ? (
                          <Link href={item.href} className="hover:text-[#176B4D] transition-colors">
                            {item.label}
                          </Link>
                        ) : (
                          <span className={isLast ? "text-[#171A18]" : ""}>{item.label}</span>
                        )}
                        {!isLast && <ChevronRight className="h-3.5 w-3.5 text-[#171A18]/25" />}
                      </span>
                    );
                  })}
                </nav>
              )}
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
