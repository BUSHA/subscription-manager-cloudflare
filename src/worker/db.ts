import type { Subscription, UserConfiguration } from "../lib/types";

type SubscriptionRow = Omit<Subscription, "is_active" | "tags"> & {
  is_active: number;
  tags?: string | null;
  autopay?: number | null;
  included?: number | null;
};

type ConfigurationRow = Omit<UserConfiguration, "show_currency_symbol"> & {
  show_currency_symbol: number;
};

export function mapSubscription(row: SubscriptionRow): Subscription {
  const billingDate = row.due_date || row.billing_date || null;
  const account = row.account || row.payment_method || null;
  const intervalValue = Number(row.interval_value || 1);
  const intervalUnit = row.interval_unit || cycleToIntervalUnit(row.billing_cycle);
  const isActive = Boolean(row.is_active);

  return {
    ...row,
    billing_date: billingDate,
    due_date: billingDate ?? undefined,
    dueDate: billingDate ?? undefined,
    payment_method: account,
    account,
    autopay: Boolean(row.autopay),
    interval_value: intervalValue,
    intervalValue,
    interval_unit: intervalUnit,
    intervalUnit,
    included: row.included === null || row.included === undefined ? isActive : Boolean(row.included),
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_active: isActive
  };
}

export function mapConfiguration(row: ConfigurationRow): UserConfiguration {
  const showCurrencySymbol = Boolean(row.show_currency_symbol);
  return {
    ...row,
    show_currency_symbol: showCurrencySymbol,
    showCurrencySymbol
  };
}

export function normalizeTags(tags: unknown): string | null {
  if (!Array.isArray(tags)) return null;
  const cleaned = tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function cycleToIntervalUnit(cycle: string | undefined): string {
  switch (cycle) {
    case "weekly":
      return "weeks";
    case "yearly":
      return "years";
    default:
      return "months";
  }
}
