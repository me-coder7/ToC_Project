export const SAMPLE_CARDS = [
  {
    type: "Visa",
    label: "Visa — valid demo number",
    number: "4111111111111111"
  },
  {
    type: "MasterCard",
    label: "MasterCard — valid demo number",
    number: "5555555555554444"
  },
  {
    type: "American Express",
    label: "AmEx — valid demo number",
    number: "378282246310005"
  },
  {
    type: "RuPay",
    label: "RuPay — valid demo number",
    number: "6546323561157565"
  },
  {
    type: "Invalid",
    label: "Invalid checksum example",
    number: "4111111111111112"
  }
];

export function digitsOnly(value) {
  return (value || "").replace(/\D/g, "").slice(0, 19);
}

export function formatCardNumber(value) {
  const digits = digitsOnly(value);
  if (!digits) return "";

  if (/^3[47]/.test(digits)) {
    const parts = [];
    if (digits.slice(0, 4)) parts.push(digits.slice(0, 4));
    if (digits.slice(4, 10)) parts.push(digits.slice(4, 10));
    if (digits.slice(10, 15)) parts.push(digits.slice(10, 15));
    if (digits.length > 15) parts.push(digits.slice(15, 19));
    return parts.filter(Boolean).join(" ");
  }

  return digits.match(/.{1,4}/g)?.join(" ") || digits;
}

export function maskCardVisual(value) {
  const digits = digitsOnly(value);
  if (!digits) return "•••• •••• •••• ••••";

  const groups = formatCardNumber(digits).split(" ");
  const filledGroups = groups.concat(Array.from({ length: Math.max(0, 4 - groups.length) }, () => "••••"));

  return filledGroups
    .map((group) => group.padEnd(group.length < 4 ? Math.max(group.length, 4) : group.length, "•"))
    .join(" ")
    .trim();
}

function isMastercardTwoSeries(prefix) {
  if (prefix.length < 4) return false;
  const value = Number(prefix.slice(0, 4));
  return value >= 2221 && value <= 2720;
}

export function detectCardFamily(digits) {
  const clean = digitsOnly(digits);
  if (!clean) {
    return {
      type: "Unknown",
      short: "CARD",
      candidateState: "waiting",
      message: "No input yet."
    };
  }

  if (clean.startsWith("4")) {
    return {
      type: "Visa",
      short: "VISA",
      candidateState: "possible",
      message: "Prefix starts with 4, which matches the Visa family."
    };
  }

  if (clean.startsWith("34") || clean.startsWith("37")) {
    return {
      type: "American Express",
      short: "AMEX",
      candidateState: "accepted",
      message: "Prefix 34 or 37 matches American Express."
    };
  }

  if (clean.startsWith("3")) {
    return {
      type: "Unknown",
      short: "CARD",
      candidateState: "possible",
      message: "Prefix 3 is still in progress and could become American Express with next digit 4 or 7."
    };
  }

  if (/^5[1-5]/.test(clean)) {
    return {
      type: "MasterCard",
      short: "MC",
      candidateState: "accepted",
      message: "Prefix 51–55 matches MasterCard."
    };
  }

  if (clean.startsWith("5")) {
    return {
      type: "Unknown",
      short: "CARD",
      candidateState: "possible",
      message: "Prefix 5 is still in progress and may become MasterCard if the next digit is 1–5."
    };
  }

  if (clean.startsWith("2")) {
    if (clean.length < 4) {
      return {
        type: "Unknown",
        short: "CARD",
        candidateState: "possible",
        message: "Prefix 2 may still become a 2221–2720 MasterCard number."
      };
    }

    if (isMastercardTwoSeries(clean)) {
      return {
        type: "MasterCard",
        short: "MC",
        candidateState: "accepted",
        message: "Prefix 2221–2720 matches the newer MasterCard range."
      };
    }

    return {
      type: "Unknown",
      short: "CARD",
      candidateState: "rejected",
      message: "Prefix beginning with 2 does not fall inside the 2221–2720 MasterCard range."
    };
  }

  if (/^(60|65|81)/.test(clean)) {
    return {
      type: "RuPay",
      short: "RUPAY",
      candidateState: "accepted",
      message: "Common RuPay demo prefixes such as 60, 65, and 81 are accepted in this project."
    };
  }

  if (clean.startsWith("6") || clean.startsWith("8")) {
    return {
      type: "Unknown",
      short: "CARD",
      candidateState: "possible",
      message: "This prefix may still become a supported RuPay demo pattern."
    };
  }

  return {
    type: "Unknown",
    short: "CARD",
    candidateState: "rejected",
    message: `Prefix ${clean.slice(0, Math.min(clean.length, 4))} does not match the supported demo networks.`
  };
}

export function validateByNetworkRules(digits) {
  const clean = digitsOnly(digits);
  const rules = [
    {
      type: "Visa",
      short: "VISA",
      regex: /^4\d{12}(?:\d{3})?(?:\d{3})?$/,
      lengths: [13, 16, 19]
    },
    {
      type: "MasterCard",
      short: "MC",
      regex: /^(?:5[1-5]\d{14}|2(?:2(?:2[1-9]|[3-9]\d)|[3-6]\d{2}|7(?:[01]\d|20))\d{12})$/,
      lengths: [16]
    },
    {
      type: "American Express",
      short: "AMEX",
      regex: /^3[47]\d{13}$/,
      lengths: [15]
    },
    {
      type: "RuPay",
      short: "RUPAY",
      regex: /^(?:60\d{14}|65\d{14}|81\d{14})$/,
      lengths: [16]
    }
  ];

  const match = rules.find((rule) => rule.regex.test(clean));
  if (match) {
    return {
      ...match,
      isKnown: true,
      isLengthValid: true,
      isPatternValid: true
    };
  }

  const family = detectCardFamily(clean);
  const tentativeRule = rules.find((rule) => rule.type === family.type);

  return {
    type: family.type,
    short: family.short,
    lengths: tentativeRule?.lengths || [],
    isKnown: Boolean(tentativeRule),
    isLengthValid: tentativeRule ? tentativeRule.lengths.includes(clean.length) : false,
    isPatternValid: false
  };
}

export function getBadgeClass(type) {
  switch (type) {
    case "Visa":
      return "badge-visa";
    case "MasterCard":
      return "badge-mastercard";
    case "American Express":
      return "badge-amex";
    case "RuPay":
      return "badge-rupay";
    default:
      return "badge-hidden";
  }
}


export function getCardLogoMarkup(type) {
  switch (type) {
    case "Visa":
      return `
        <svg class="card-logo-svg" viewBox="0 0 168 56" aria-label="Visa logo" role="img">
          <rect x="12" y="8" width="144" height="40" rx="20" fill="rgba(255,255,255,0.98)" />
          <g transform="translate(84 28)">
            <text
              x="0"
              y="8.5"
              text-anchor="middle"
              font-size="28"
              font-weight="900"
              font-style="italic"
              letter-spacing="0.6"
              fill="#1A1F71"
              font-family="Arial, Helvetica, sans-serif"
            >VISA</text>
            <path d="M-52 2h18l-4 8h-18z" fill="#F7B600" opacity="0.95" />
          </g>
        </svg>`;
    case "MasterCard":
      return `
        <svg class="card-logo-svg" viewBox="0 0 168 56" aria-label="Mastercard logo" role="img">
          <rect x="12" y="8" width="144" height="40" rx="20" fill="rgba(255,255,255,0.98)" />
          <g transform="translate(84 28)">
            <circle cx="-14" cy="0" r="15" fill="#EB001B" />
            <circle cx="14" cy="0" r="15" fill="#F79E1B" />
            <path d="M0 -15a15 15 0 0 0 0 30a15 15 0 0 0 0-30Z" fill="#FF5F00" />
          </g>
        </svg>`;
    case "American Express":
      return `
        <svg class="card-logo-svg" viewBox="0 0 168 56" aria-label="American Express logo" role="img">
          <rect x="26" y="10" width="116" height="36" rx="4" fill="#016FD0" />
          <rect x="32" y="14" width="104" height="28" rx="2" fill="#1F8FF0" opacity="0.9" />
          <g font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="#ffffff" text-anchor="middle">
            <text x="84" y="26" font-size="11.5" letter-spacing="1.1">AMERICAN</text>
            <text x="84" y="36.5" font-size="12.8" letter-spacing="0.8">EXPRESS</text>
          </g>
        </svg>`;
    case "RuPay":
      return `
        <svg class="card-logo-svg" viewBox="0 0 168 56" aria-label="RuPay logo" role="img">
          <rect x="12" y="8" width="144" height="40" rx="20" fill="rgba(255,255,255,0.98)" />
          <g transform="translate(34 16)">
            <path d="M0 0h30c3.2 0 5.2 3.5 3.7 6.3L23 24H-7L4 5.2A6.2 6.2 0 0 1 9.3 0Z" fill="#F97316" />
            <path d="M19 0h30c3.2 0 5.2 3.5 3.7 6.3L42 24H12L23 5.2A6.2 6.2 0 0 1 28.3 0Z" fill="#10B981" opacity="0.96" />
            <path d="M38 0h30c3.2 0 5.2 3.5 3.7 6.3L61 24H31L42 5.2A6.2 6.2 0 0 1 47.3 0Z" fill="#2563EB" opacity="0.96" />
          </g>
          <text
            x="117"
            y="33"
            text-anchor="middle"
            font-size="18"
            font-weight="800"
            font-style="italic"
            letter-spacing="0.2"
            fill="#1E3A8A"
            font-family="Arial, Helvetica, sans-serif"
          >RuPay</text>
        </svg>`;
    default:
      return ``;
  }
}
