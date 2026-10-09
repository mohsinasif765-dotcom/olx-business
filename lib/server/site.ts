import { FAQ_ARTICLES } from "@/lib/faq";
import { migrateCurrencies, normalizeWalletMode, pickDisplayCurrency } from "@/lib/currencies";
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
  const usdtToPkrRate = Number(settings?.usdtToPkrRate) || 280;
  // Fund / withdraw rails: all enabled pay_rails (Trade FX payment-methods style).
  // walletMode only drives display labels + Bank PKR estimate — not deposit list.
  const liveCoins = migrateCurrencies(coins)
    .filter((c) => c.enabled !== false)
    .map((c) => ({
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
