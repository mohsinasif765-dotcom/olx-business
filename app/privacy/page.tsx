"use client";

import Link from "next/link";
import { BackHeader } from "@/components/BackHeader";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <main className="star-field">
      <div className="page-enter mx-auto min-h-screen max-w-[420px] px-6 py-8 text-white">
        <BackHeader href="/" title={t.viewPrivacy} />
        <p className="text-sm text-white/60">OLX Business · 5 Oct 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-7 text-white/85">
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">1.</h2>
            <p>
              We collect account details you submit, such as email or mobile number, and
              device data needed to run the app.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">2.</h2>
            <p>
              Data is used to create your session, show car packages, funding, payouts, invite,
              and support screens, and to prevent abuse.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">3.</h2>
            <p>
              We do not sell personal data. This demo stores session details in your browser
              only.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-white">4.</h2>
            <p>
              You can request correction or deletion of account data through customer service.
            </p>
          </section>
          <p className="pt-2">
            <Link href="/agreement" className="text-[#7eb6ff]">
              {t.viewAgreement}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
