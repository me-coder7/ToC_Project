import { digitsOnly } from "./cardRules.js";

export function runLuhnDetailed(value) {
  const digits = digitsOnly(value).split("").map(Number);
  if (!digits.length) {
    return {
      canRun: false,
      isValid: false,
      sum: 0,
      steps: [],
      message: "Enter digits to run the Luhn algorithm."
    };
  }

  const reversed = [...digits].reverse();
  const processed = reversed.map((digit, index) => {
    const shouldDouble = index % 2 === 1;
    const doubled = shouldDouble ? digit * 2 : digit;
    const normalized = doubled > 9 ? doubled - 9 : doubled;

    return {
      fromRightPosition: index + 1,
      original: digit,
      shouldDouble,
      doubled,
      normalized
    };
  });

  const sum = processed.reduce((total, item) => total + item.normalized, 0);
  const isValid = sum % 10 === 0;

  return {
    canRun: true,
    isValid,
    sum,
    digits,
    reversed,
    processed,
    message: isValid
      ? `Checksum passed because ${sum} is divisible by 10.`
      : `Checksum failed because ${sum} is not divisible by 10.`
  };
}
