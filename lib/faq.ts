export const FAQ_TABS = ["cars", "about", "wallet"] as const;
export type FaqTab = (typeof FAQ_TABS)[number];

export type FaqArticle = {
  id: string;
  tab: FaqTab;
  title: string;
  sections: { heading: string; body: string[] }[];
};

export const FAQ_ARTICLES: FaqArticle[] = [
  {
    id: "pow-platform",
    tab: "cars",
    title: "How car investment packages work",
    sections: [
      {
        heading: "1. Start",
        body: [
          "Create an account and fund your invest wallet in USDT.",
          "Open Cars and choose New or Used.",
          "Invest in a package. Returns follow the plan term shown on the card.",
        ],
      },
      {
        heading: "2. Returns",
        body: [
          "Each package lists invest amount, expected return, and term in days.",
          "Returns are credited to your USDT wallet after the plan is reviewed.",
          "This is a car package. Returns follow the plan term in USDT.",
        ],
      },
    ],
  },
  {
    id: "start-mining",
    tab: "cars",
    title: "New cars vs used cars",
    sections: [
      {
        heading: "Stock",
        body: [
          "New cars are factory-new packages.",
          "Used cars are certified pre-owned packages.",
          "Photos on the card show the vehicle class, not a guaranteed VIN.",
        ],
      },
    ],
  },
  {
    id: "daily-income",
    tab: "cars",
    title: "How expected return is shown",
    sections: [
      {
        heading: "Figures",
        body: [
          "The return on the card is the plan figure for that invest range.",
          "Actual credit happens after admin review in a live system.",
        ],
      },
    ],
  },
  {
    id: "about-olx",
    tab: "about",
    title: "What is OLX Business?",
    sections: [
      {
        heading: "Product",
        body: [
          "OLX Business lets members invest in new and certified used car packages.",
          "You fund USDT, pick a package, and receive plan returns in USDT.",
        ],
      },
    ],
  },
  {
    id: "invite-team",
    tab: "about",
    title: "Invite and team rebate",
    sections: [
      {
        heading: "Team",
        body: [
          "Share your invite code from the Invite page.",
          "Team rebate follows the rates on the Team screen.",
          "Self-invites are not counted.",
        ],
      },
    ],
  },
  {
    id: "wallet-usdt",
    tab: "wallet",
    title: "How to fund and withdraw",
    sections: [
      {
        heading: "USDT only",
        body: [
          "Funding and payouts use USDT. There is no chain picker.",
          "Enter your own payout address on Withdraw and confirm with the security password.",
          "A handling fee is shown on the withdraw screen.",
        ],
      },
    ],
  },
];

export function getFaq(id: string) {
  return FAQ_ARTICLES.find((item) => item.id === id);
}
