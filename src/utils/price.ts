// Approximate CNY exchange rates. Update periodically or replace with live API.
const CNY_BASE = 9.9;

const RATES: Record<string, { symbol: string; mult: number }> = {
  USD: { symbol: "$",    mult: 0.138  },
  EUR: { symbol: "€",    mult: 0.127  },
  GBP: { symbol: "£",    mult: 0.109  },
  JPY: { symbol: "¥",    mult: 20.1   },
  KRW: { symbol: "₩",    mult: 190.5  },
  HKD: { symbol: "HK$",  mult: 1.08   },
  TWD: { symbol: "NT$",  mult: 4.5    },
  SGD: { symbol: "S$",   mult: 0.186  },
  AUD: { symbol: "A$",   mult: 0.215  },
  CAD: { symbol: "C$",   mult: 0.189  },
  MYR: { symbol: "RM",   mult: 0.616  },
  THB: { symbol: "฿",    mult: 4.75   },
  IDR: { symbol: "Rp",   mult: 2260   },
  PHP: { symbol: "₱",    mult: 7.86   },
  VND: { symbol: "₫",    mult: 3510   },
};

const LOCALE_CURRENCY: Record<string, string> = {
  "zh-CN": "CNY", "zh-SG": "SGD", "zh-HK": "HKD", "zh-TW": "TWD",
  "en-US": "USD", "en-CA": "CAD", "en-AU": "AUD", "en-GB": "GBP",
  "en-SG": "SGD", "en-MY": "MYR", "en-PH": "PHP",
  "ja": "JPY", "ko": "KRW", "th": "THB", "ms": "MYR",
  "id": "IDR", "vi": "VND",
  "de": "EUR", "fr": "EUR", "es": "EUR", "it": "EUR",
  "pt": "EUR", "nl": "EUR", "pl": "EUR",
};

type PriceDisplay = { amount: string; period: string };

export const getProPrice = (): PriceDisplay => {
  const locale = (typeof navigator !== "undefined" ? navigator.language : "") || "en";
  const lang = locale.split("-")[0];
  const currency = LOCALE_CURRENCY[locale] ?? LOCALE_CURRENCY[lang];

  if (!currency || currency === "CNY") {
    return { amount: "¥9.9", period: "/ 月" };
  }

  const rate = RATES[currency];
  if (!rate) {
    return { amount: "¥9.9 CNY", period: "/ mo" };
  }

  const raw = CNY_BASE * rate.mult;
  const formatted = raw >= 100
    ? Math.round(raw).toLocaleString()
    : raw >= 10
    ? raw.toFixed(1).replace(/\.0$/, "")
    : raw.toFixed(2).replace(/\.?0+$/, "");

  return { amount: `${rate.symbol}${formatted}`, period: "/ mo" };
};
