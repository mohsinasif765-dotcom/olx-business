import { FAQ_ARTICLES } from "@/lib/faq";
import {
  filterCoinsByWalletMode,
  normalizeWalletMode,
  pickDisplayCurrency,
} from "@/lib/currencies";
import { stripDemoRows } from "@/lib/server/strip-demo";
import {
  readActivities,
  readActivityState,
  readCms,
  readCoins,
  readFaqs,
  readNotices,
  readRecharges,
  readSettings,
  readTransfers,
  readWithdraws,
} from "@/lib/server/db-tables";
import { resolveUsdtFxTable, resolveUsdtToPkrRate } from "@/lib/server/live-fx";

export type CmsPage = { slug: string; title: string; body: string };
export type FaqItem = { id: string; tab: string; title: string; body: string; enabled?: boolean };

export function telegramHandle(url: string) {
  const match = String(url || "").match(/t\.me\/([^/?]+)/i);
  return match ? `@${match[1]}` : "@olxbusiness_help";
}

export async function readSite() {
  const [settings, cms, faqs, notices, coins, activities, recharges, withdraws, transfers, activityState] =
    await Promise.all([
      readSettings(),
      readCms(),
      readFaqs(),
      readNotices(),
      readCoins(),
      readActivities(),
      readRecharges(),
      readWithdraws(),
      readTransfers(),
      readActivityState(),
    ]);
  const telegram = String(settings?.telegram || "https://t.me/olxbusiness_help");
  const liveFaqs = faqs
    .filter((row) => row.enabled !== false)
    .map((row) => ({
      id: String(row.id),
      tab: String(row.tab || "about"),
      title: String(row.title),
      body: String(row.body || ""),
    }));
  const fallbackFaqs =
    liveFaqs.length > 0
      ? liveFaqs
      : FAQ_ARTICLES.map((row) => ({
          id: row.id,
          tab: row.tab,
          title: row.title,
          body: row.sections.flatMap((s) => [s.heading, ...s.body]).join("\n"),
        }));
  const walletMode = normalizeWalletMode(settings?.walletMode);
  const displayCurrency = pickDisplayCurrency(coins, walletMode);
  const savedRate = Number(settings?.usdtToPkrRate) || 280;
  const autoFx = settings?.usdtRateAuto !== false;
  const usdtFx = await resolveUsdtFxTable(savedRate, autoFx);
  const usdtToPkrRate = Number(usdtFx.PKR) || (await resolveUsdtToPkrRate(savedRate, autoFx));
  // Fund / withdraw rails follow admin Currency mode (PKR | USDT | dual).
  const liveCoins = filterCoinsByWalletMode(coins, walletMode).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    network: String(c.network || "Bank"),
    min: String(c.min || "1"),
    address: String(c.address || ""),
    enabled: true,
    payKind: c.payKind,
    bankName: String(c.bankName || ""),
    accountName: String(c.accountName || ""),
    accountNumber: String(c.accountNumber || ""),
    iban: String(c.iban || ""),
    swift: String(c.swift || ""),
    branch: String(c.branch || ""),
    instructions: String(c.instructions || ""),
  }));

  return {
    siteName: String(settings?.siteName || "OLX Business"),
    telegram,
    handle: telegramHandle(telegram),
    maintenance: String(settings?.maintenance || ""),
    walletMode,
    displayCurrency,
    usdtToPkrRate,
    /** 1 USDT → N display units (packages priced in USDT). */
    usdtFx,
    about: {
      tagline: String(settings?.aboutTagline || ""),
      body: String(settings?.aboutBody || ""),
      step1: String(settings?.aboutStep1 || ""),
      step2: String(settings?.aboutStep2 || ""),
      step3: String(settings?.aboutStep3 || ""),
      version: String(settings?.aboutVersion || "Version 1.0"),
      companyName: String(settings?.companyName || "OLX Business Digital Ltd"),
      companyAddress: String(
        settings?.companyAddress ||
          "Office 2208, Bay View Tower, Business Bay, Dubai, United Arab Emirates",
      ),
      companyNo: String(settings?.companyNo || "OB-2026-8841"),
      companyRegDate: String(settings?.companyRegDate || "12 Jan 2026"),
      companyIssued: String(settings?.companyIssued || "05 Oct 2026"),
    },
    flags: {
      rechargeOn: settings?.rechargeOn !== false,
      withdrawOn: settings?.withdrawOn !== false,
      transferOn: settings?.transferOn !== false,
      loginOn: settings?.loginOn !== false,
      registerOn: settings?.registerOn !== false,
      packagesOn: settings?.packagesOn !== false,
    },
    finance: {
      minWithdraw: Number(settings?.minWithdraw) || 1,
      payoutFee: Number(settings?.payoutFee) || 1,
      dailyCap: Number(settings?.dailyCap) || 5000,
    },
    cms,
    faqs: fallbackFaqs,
    notices: notices.filter((n) => n.enabled !== false),
    coins: liveCoins,
    activities: activities.filter((a) => a.enabled !== false),
    recharges: stripDemoRows(recharges),
    withdraws: stripDemoRows(withdraws),
    transfers: stripDemoRows(transfers),
    activityState,
  };
}

export function cmsBody(pages: CmsPage[], slug: string, fallback: string) {
  return pages.find((p) => p.slug === slug)?.body || fallback;
}

export function cmsTitle(pages: CmsPage[], slug: string, fallback: string) {
  return pages.find((p) => p.slug === slug)?.title || fallback;
}
