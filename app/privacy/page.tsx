"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackHeader } from "@/components/BackHeader";
import { fetchContent } from "@/lib/fetch-content";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t } = useLanguage();
  const [title, setTitle] = useState(t.viewPrivacy);
  const [body, setBody] = useState("");

  useEffect(() => {
    void fetchContent()
      .then((data: { cms?: { slug: string; title: string; body: string }[] } | null) => {
        const page = data?.cms?.find((p) => p.slug === "privacy");
        if (page?.title) setTitle(page.title);
        if (page?.body) setBody(page.body);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="star-field">
      <div className="page-enter mx-auto min-h-screen max-w-[420px] px-6 py-8 text-white">
        <BackHeader href="/me" title={title} />
        <div className="mt-6 space-y-5 text-sm leading-7 whitespace-pre-wrap text-white/85">
          {body || "We collect account details you submit to run the app."}
        </div>
        <p className="pt-6">
          <Link href="/agreement" className="text-[#7eb6ff]">
            {t.viewAgreement}
          </Link>
        </p>
      </div>
    </main>
  );
}
