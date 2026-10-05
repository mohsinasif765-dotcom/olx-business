"use client";

import Link from "next/link";
import { BackHeader } from "@/components/BackHeader";
import { useLanguage } from "@/lib/i18n";

export default function AgreementPage() {
  const { t } = useLanguage();

  return (
    <main className="star-field">
      <div className="page-enter mx-auto min-h-screen max-w-[420px] px-6 py-8 text-white">
        <BackHeader href="/" title={t.viewAgreement} />
        <p className="text-sm text-white/60">OLX Business · 5 Oct 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-7 text-white/85">
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">1.</h2>
            <p>
              By creating an account or using OLX Business you accept this agreement. If you do
              not agree, do not use the service.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">2.</h2>
            <p>
              Keep your login password and security password private. You are responsible for
              activity on your account, including funding, car packages, and payouts.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">3.</h2>
            <p>
              OLX Business offers new and certified used car investment packages. Returns follow
              the package you select. Demo balances on this site are for product demonstration.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">4.</h2>
            <p>
              Do not use the service for fraud, money laundering, or abuse of invite rebates. We
              may suspend accounts that break these rules.
            </p>
          </section>
          <p className="pt-2">
            <Link href="/privacy" className="text-[#7eb6ff]">
              {t.viewPrivacy}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
