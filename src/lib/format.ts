import type { Subscription } from "./types";

export const billingCycles = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "weekly", label: "Weekly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "one-time", label: "One-time" }
] as const;

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale: string | null | undefined = "en-US",
  showSymbol = true
) {
  if (!showSymbol) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function toMonthlyAmount(subscription: Pick<Subscription, "amount" | "billing_cycle" | "is_active">) {
  if (!subscription.is_active) return 0;

  switch (subscription.billing_cycle) {
    case "weekly":
      return (subscription.amount * 52) / 12;
    case "yearly":
      return subscription.amount / 12;
    case "quarterly":
      return subscription.amount / 3;
    case "one-time":
      return 0;
    case "monthly":
    default:
      return subscription.amount;
  }
}

export function toYearlyAmount(subscription: Pick<Subscription, "amount" | "billing_cycle" | "is_active">) {
  if (!subscription.is_active) return 0;

  switch (subscription.billing_cycle) {
    case "weekly":
      return subscription.amount * 52;
    case "yearly":
      return subscription.amount;
    case "quarterly":
      return subscription.amount * 4;
    case "one-time":
      return subscription.amount;
    case "monthly":
    default:
      return subscription.amount * 12;
  }
}

export function formatDate(value?: string | null, locale = "en-US") {
  if (!value) return "No date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
