import { FAQ_ARTICLES } from "@/lib/faq";
import { migrateCurrencies } from "@/lib/currencies";
import { stripDemoRows } from "@/lib/server/strip-demo";
import { readSnapshotPayload } from "@/lib/server/snapshot";

export type CmsPage = { slug: string; title: string; body: string };
export type FaqItem = { id: string; tab: string; title: string; body: string; enabled?: boolean };

type Snapshot = {
  settings?: {
    siteName?: string;
    telegram?: string;
    rechargeOn?: boolean;
    withdrawOn?: boolean;
    transferOn?: boolean;
    loginOn?: boolean;
    registerOn?: boolean;
    packagesOn?: boolean;
    maintenance?: string;
    minWithdraw?: number;
    payoutFee?: number;
    dailyCap?: number;
  };
  cms?: CmsPage[];
  faqs?: FaqItem[];
  notices?: { id: string; title: string; body: string; enabled: boolean }[];
  coins?: { id: string; name: string; network: string; min: string; address: string; enabled?: boolean }[];
  activities?: { id: string; title: string; desc: string; time: string; status: string; enabled?: boolean }[];
  recharges?: { id: string; account: string; amount: number; network: string; status: string; at: string }[];
  withdraws?: { id: string; account: string; amount: number; wallet: string; status: string; at: string }[];
  transfers?: { id: string; account: string; from: string; to: string; amount: number; at: string }[];
  activityState?: Record<string, { checkin?: { date: string; streak: number }; lucky?: { date: string; prize: string } }>;
};

export function telegramHandle(url: string) {
  const match = String(url || "").match(/t\.me\/([^/?]+)/i);
  return match ? `@${match[1]}` : "@olxbusiness_help";
}

export async function readSite() {
  const payload = (await readSnapshotPayload()) as Snapshot;
  const settings = payload.settings || {};
  const telegram = String(settings.telegram || "https://t.me/olxbusiness_help");
  const cms = Array.isArray(payload.cms) ? payload.cms : [];
  const faqs = (Array.isArray(payload.faqs) ? payload.faqs : [])
    .filter((row) => row.enabled !== false)
    .map((row) => ({
      id: String(row.id),
      tab: String(row.tab || "about"),
      title: String(row.title),
      body: String(row.body || ""),
    }));
  const fallbackFaqs =
    faqs.length > 0
      ? faqs
      : FAQ_ARTICLES.map((row) => ({
          id: row.id,
          tab: row.tab,
          title: row.title,
          body: row.sections.flatMap((s) => [s.heading, ...s.body]).join("\n"),
        }));
  return {
    siteName: String(settings.siteName || "OLX Business"),
    telegram,
    handle: telegramHandle(telegram),
    maintenance: String(settings.maintenance || ""),
    flags: {
      rechargeOn: settings.rechargeOn !== false,
      withdrawOn: settings.withdrawOn !== false,
      transferOn: settings.transferOn !== false,
      loginOn: settings.loginOn !== false,
      registerOn: settings.registerOn !== false,
      packagesOn: settings.packagesOn !== false,
    },
    finance: {
      minWithdraw: Number(settings.minWithdraw) || 1,
      payoutFee: Number(settings.payoutFee) || 1,
      dailyCap: Number(settings.dailyCap) || 5000,
    },
    cms,
    faqs: fallbackFaqs,
    notices: (payload.notices || []).filter((n) => n.enabled !== false),
    coins: migrateCurrencies(payload.coins)
      .filter((c) => c.enabled !== false)
      .map((c) => ({
      id: String(c.id),
      name: String(c.name),
      network: String(c.network || "Bank"),
      min: String(c.min || "1"),
      address: String(c.address || ""),
      enabled: true,
    })),
    activities: (payload.activities || []).filter((a) => a.enabled !== false),
    recharges: stripDemoRows(payload.recharges || []),
    withdraws: stripDemoRows(payload.withdraws || []),
    transfers: stripDemoRows(payload.transfers || []),
    activityState: payload.activityState || {},
  };
}

export function cmsBody(pages: CmsPage[], slug: string, fallback: string) {
  return pages.find((p) => p.slug === slug)?.body || fallback;
}

export function cmsTitle(pages: CmsPage[], slug: string, fallback: string) {
  return pages.find((p) => p.slug === slug)?.title || fallback;
}
