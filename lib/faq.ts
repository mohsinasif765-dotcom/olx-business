export const FAQ_TABS = ["mining", "about", "wallet"] as const;
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
    tab: "mining",
    title: "The OLX Business platform provides proof-of-work based cloud mining",
    sections: [
      {
        heading: "1. How to start using the platform",
        body: [
          "Create an account and complete verification.",
          "Choose a suitable VIP mining plan that matches your budget and target income.",
          "After payment, mining starts automatically. Earnings are settled into your account according to the plan cycle.",
        ],
      },
      {
        heading: "2. How are mining profits settled?",
        body: [
          "Revenue is affected by mining-machine or contract performance, current network difficulty, and total network computing power.",
          "Market prices of cryptocurrencies can also change the displayed USDT value.",
          "Income is distributed after deducting electricity, maintenance, and platform management fees stated on the VIP plan.",
        ],
      },
      {
        heading: "3. How to withdraw mining profits",
        body: [
          "Bind a wallet address in your account before requesting a withdrawal.",
          "After reaching the minimum withdrawal amount, you can submit a withdrawal request at any time.",
          "Reviewed requests are typically credited within 1–3 hours, and may take longer depending on blockchain network congestion.",
        ],
      },
      {
        heading: "4. What is computing power? How do I choose a plan?",
        body: [
          "Hash power reflects the computing strength of a mining contract. Higher computing power can mean more output, while also requiring a higher VIP level.",
          "If you are starting, a smaller contract is recommended. You can upgrade later as your experience grows.",
          "Daily income depends on the plan you activate, not on manual trading.",
        ],
      },
      {
        heading: "5. Which cryptocurrencies does the platform support?",
        body: [
          "USDT on BEP20 and TRC20 is the primary settlement currency.",
          "Recharge also supports USDC, TRX, BNB, ETH, POL, and PYUSD on their listed networks.",
          "Always send the same coin on the selected network. A wrong network can result in unrecoverable funds.",
        ],
      },
      {
        heading: "6. Can a mining plan be terminated at any time?",
        body: [
          "A contract runs for the effective mining days shown on the VIP card.",
          "Early termination is not available once a plan is activated.",
          "When the cycle ends, mining stops automatically and remaining withdrawable balance stays in your wallet.",
        ],
      },
      {
        heading: "7. What should I know about risk?",
        body: [
          "Digital-asset prices move. Displayed income in USDT can change even if hash output is stable.",
          "OLX Business does not guarantee profit. Read the VIP table and this FAQ before you recharge.",
        ],
      },
    ],
  },
  {
    id: "start-mining",
    tab: "mining",
    title: "How to activate a VIP mining plan",
    sections: [
      {
        heading: "Choose a level",
        body: [
          "Open VIP and compare recharge range, mining income, effective days, and rebate.",
          "Pick a plan you can fund in full. Partial recharge does not start a higher level.",
        ],
      },
      {
        heading: "Pay and confirm",
        body: [
          "Use Recharge, select the coin and network, then submit the order with your transaction hash if asked.",
          "After the order is confirmed, the plan’s effective time starts counting.",
        ],
      },
    ],
  },
  {
    id: "income-formula",
    tab: "mining",
    title: "How daily mining income is calculated",
    sections: [
      {
        heading: "Plan income",
        body: [
          "Each VIP level lists a mining income figure for its effective period.",
          "Income is allocated across the active days of that plan.",
        ],
      },
      {
        heading: "Rebate",
        body: [
          "Mining rebate is a percentage shown on the VIP card and may apply to eligible team activity.",
          "Rebate does not replace the base mining income of your own plan.",
        ],
      },
    ],
  },
  {
    id: "hashrate",
    tab: "mining",
    title: "Computing power, difficulty, and output",
    sections: [
      {
        heading: "Network difficulty",
        body: [
          "Proof-of-work networks adjust difficulty over time. Higher difficulty can reduce output for the same hash power.",
          "OLX Business displays estimated income on each VIP plan so you can compare levels before paying.",
        ],
      },
      {
        heading: "Upgrading",
        body: [
          "If you need more output, recharge to the next VIP range rather than opening overlapping plans.",
          "Only one VIP plan should be treated as active at a time.",
        ],
      },
    ],
  },
  {
    id: "stop-contract",
    tab: "mining",
    title: "When mining stops and what happens to the balance",
    sections: [
      {
        heading: "End of cycle",
        body: [
          "Mining stops when the effective days are finished.",
          "Settled income remains in your available USDT balance and can be withdrawn subject to daily limits and review.",
        ],
      },
    ],
  },
  {
    id: "who-we-are",
    tab: "about",
    title: "About OLX Business",
    sections: [
      {
        heading: "Who we are",
        body: [
          "OLX Business is a cloud-mining and membership platform. Members recharge, activate a VIP plan, and receive mining income in USDT according to that plan.",
          "The product is operated as an online contract service, not as a physical machine you host at home.",
        ],
      },
      {
        heading: "How to reach us",
        body: [
          "Use in-app Support for Telegram and FAQ. Customer service is marked as online 24 hours for order questions.",
        ],
      },
    ],
  },
  {
    id: "security",
    tab: "about",
    title: "Account security, passwords, and devices",
    sections: [
      {
        heading: "Two passwords",
        body: [
          "Login password is used to sign in. Security password is used for withdrawals and sensitive actions.",
          "Do not reuse these passwords on other websites. OLX Business staff will never ask for both passwords in chat.",
        ],
      },
      {
        heading: "Device care",
        body: [
          "Enable a unique email or mobile login. If you change phones, keep invitation and security details private.",
        ],
      },
    ],
  },
  {
    id: "privacy-kyc",
    tab: "about",
    title: "Privacy, data, and verification",
    sections: [
      {
        heading: "What we store",
        body: [
          "Account, order, and support records are used to run recharge, mining, and withdrawal.",
          "See the Privacy Policy in the app for how data is handled and how to request account closure.",
        ],
      },
    ],
  },
  {
    id: "invite-rules",
    tab: "about",
    title: "Invitation codes and team rebate",
    sections: [
      {
        heading: "Sharing",
        body: [
          "Each member can share an invitation code. New users should enter it during registration.",
          "Self-invites and fake accounts can be removed. Rebate follows the rate on your active VIP level.",
        ],
      },
    ],
  },
  {
    id: "service-hours",
    tab: "about",
    title: "Customer service hours and what we can help with",
    sections: [
      {
        heading: "Support scope",
        body: [
          "Support can help with recharge networks, missing hashes, withdrawal review status, and VIP plan questions.",
          "Support cannot change blockchain confirmations or recover coins sent on the wrong network.",
        ],
      },
    ],
  },
  {
    id: "how-recharge",
    tab: "wallet",
    title: "How to recharge USDT and other coins",
    sections: [
      {
        heading: "Steps",
        body: [
          "Open Recharge, choose the coin and network, copy the deposit address or scan the QR.",
          "Send only that coin on that network. Then submit the amount and optional transaction hash.",
          "Orders stay pending until they are reviewed. Check Recharge History for status.",
        ],
      },
    ],
  },
  {
    id: "networks-min",
    tab: "wallet",
    title: "Networks, minimum amounts, and wrong-chain transfers",
    sections: [
      {
        heading: "Match the network",
        body: [
          "BEP20, TRC20, ERC20, and Polygon addresses are not interchangeable.",
          "If you send on the wrong chain, funds may be unrecoverable. Always copy the address from the app, not from chat messages.",
        ],
      },
      {
        heading: "Minimums",
        body: [
          "Each coin row shows a minimum amount. Deposits below the minimum may not be credited.",
        ],
      },
    ],
  },
  {
    id: "how-withdraw",
    tab: "wallet",
    title: "How to withdraw, limits, and handling fees",
    sections: [
      {
        heading: "Before you submit",
        body: [
          "Select BEP20-USDT or TRC20-USDT, paste your own wallet address, enter the amount, and confirm with the security password.",
          "TRC20 withdrawals are free. BEP20 includes a handling fee shown on the withdraw page.",
        ],
      },
      {
        heading: "Limits",
        body: [
          "The minimum withdrawal is 1 USDT. Each member may withdraw once per day after review.",
          "You can submit 24 hours a day. After audit, arrival is usually within 1–3 minutes, and can extend with network load.",
        ],
      },
    ],
  },
  {
    id: "pending-orders",
    tab: "wallet",
    title: "Pending, failed, and delayed orders",
    sections: [
      {
        heading: "Recharge pending",
        body: [
          "If a recharge stays pending, confirm the hash, network, and amount, then contact support with the order time.",
        ],
      },
      {
        heading: "Withdrawal pending",
        body: [
          "Withdrawals wait for audit. Do not submit a second request the same day. Open Withdraw History for the latest status.",
        ],
      },
    ],
  },
  {
    id: "actual-arrival",
    tab: "wallet",
    title: "Actual arrival amount after fees",
    sections: [
      {
        heading: "Formula",
        body: [
          "Actual arrival = transfer amount − handling fee. If the amount is below the minimum after fees, the request is rejected.",
          "The fee does not change once the order is submitted.",
        ],
      },
    ],
  },
];

export function getFaq(id: string | null) {
  return FAQ_ARTICLES.find((item) => item.id === id) ?? null;
}

export function faqsByTab(tab: FaqTab) {
  return FAQ_ARTICLES.filter((item) => item.tab === tab);
}
