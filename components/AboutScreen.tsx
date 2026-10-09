"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { fetchContent } from "@/lib/fetch-content";
import { useLanguage } from "@/lib/i18n";

type AboutContent = {
  tagline?: string;
  body?: string;
  step1?: string;
  step2?: string;
  step3?: string;
  version?: string;
  companyName?: string;
  companyAddress?: string;
  companyNo?: string;
  companyRegDate?: string;
  companyIssued?: string;
};

export function AboutScreen() {
  const { t } = useLanguage();
  const [siteName, setSiteName] = useState("OLX Business");
  const [cmsBody, setCmsBody] = useState("");
  const [about, setAbout] = useState<AboutContent>({});

  useEffect(() => {
    void fetchContent()
      .then(
        (
          data: {
            siteName?: string;
            about?: AboutContent;
            cms?: { slug: string; title: string; body: string }[];
          } | null,
        ) => {
          if (data?.siteName) setSiteName(data.siteName);
          if (data?.about) setAbout(data.about);
          const page = data?.cms?.find((p) => p.slug === "about");
          if (page?.body) setCmsBody(page.body);
        },
      )
      .catch(() => {});
  }, []);

  const tagline = about.tagline?.trim() || t.aboutTagline;
  const story = about.body?.trim() || cmsBody || t.aboutBody;
  const step1 = about.step1?.trim() || t.aboutStepFund;
  const step2 = about.step2?.trim() || t.aboutStepInvest;
  const step3 = about.step3?.trim() || t.aboutStepEarn;
  const version = about.version?.trim() || t.currentVersion;
  const companyName = about.companyName?.trim() || t.companyName;
  const companyAddress = about.companyAddress?.trim() || t.companyAddress;
  const companyNo = about.companyNo?.trim() || "OB-2026-8841";
  const companyRegDate = about.companyRegDate?.trim() || "12 Jan 2026";
  const companyIssued = about.companyIssued?.trim() || "05 Oct 2026";

  return (
    <div className="star-field">
      <div className="page-enter mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-3">
        <header className="me-topbar mb-4 flex items-center justify-between">
          <Link
            href="/me"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white/90"
            aria-label="Back"
          >
            ‹
          </Link>
          <h1 className="text-[17px] font-semibold tracking-wide">{t.aboutUs}</h1>
          <span className="w-9" />
        </header>

        <section className="about-hero anim-up mb-4">
          <div className="about-globe">
            <BrandLogo size={78} variant="splash" />
          </div>
          <h2 className="about-brand">{siteName}</h2>
          <p className="about-tagline">{tagline}</p>
          <span className="about-version">{version}</span>
        </section>

        <section className="about-panel anim-up delay-1 mb-3">
          <p className="about-kicker">{t.welcomeAbout}</p>
          <p className="about-story">{story}</p>
        </section>

        <section className="about-panel anim-up delay-2 mb-3">
          <p className="about-kicker">{t.aboutHowTitle}</p>
          <ul className="about-steps">
            <li>
              <span className="about-step-num">01</span>
              <span>{step1}</span>
            </li>
            <li>
              <span className="about-step-num">02</span>
              <span>{step2}</span>
            </li>
            <li>
              <span className="about-step-num">03</span>
              <span>{step3}</span>
            </li>
          </ul>
        </section>

        <section className="about-panel anim-up delay-3 mb-3">
          <p className="about-kicker">{t.aboutCompanyTitle}</p>
          <dl className="about-meta">
            <div>
              <dt>{t.companyNameLabel}</dt>
              <dd>{companyName}</dd>
            </div>
            <div>
              <dt>{t.companyAddressLabel}</dt>
              <dd>{companyAddress}</dd>
            </div>
          </dl>
        </section>

        <article className="about-cert anim-up delay-3 mb-4">
          <div className="about-cert-top">
            <p className="about-cert-label">{t.companyProfile}</p>
            <p className="about-cert-sub">{t.privateCompany}</p>
          </div>

          <div className="about-cert-body">
            <div className="about-seal">
              <BrandLogo size={48} />
            </div>
            <h3 className="about-cert-name">{siteName}</h3>
            <p className="about-cert-addr">{companyAddress}</p>

            <div className="about-cert-grid">
              <div>
                <span>{t.companyNo}</span>
                <strong>{companyNo}</strong>
              </div>
              <div>
                <span>{t.regDate}</span>
                <strong>{companyRegDate}</strong>
              </div>
            </div>
            <p className="about-cert-issued">
              {t.issued}: {companyIssued}
            </p>
          </div>
        </article>

        <div className="about-links anim-up delay-4">
          <Link href="/agreement" className="about-link">
            {t.viewAgreement}
          </Link>
          <Link href="/privacy" className="about-link">
            {t.viewPrivacy}
          </Link>
        </div>
      </div>
    </div>
  );
}
