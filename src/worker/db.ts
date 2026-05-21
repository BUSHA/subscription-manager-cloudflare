import type { Subscription, UserConfiguration } from "../lib/types";

type SubscriptionRow = Omit<Subscription, "is_active" | "tags"> & {
  is_active: number;
  tags?: string | null;
};

type ConfigurationRow = Omit<UserConfiguration, "show_currency_symbol"> & {
  show_currency_symbol: number;
};

export function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    is_active: Boolean(row.is_active)
  };
}

export function mapConfiguration(row: ConfigurationRow): UserConfiguration {
  return {
    ...row,
    show_currency_symbol: Boolean(row.show_currency_symbol)
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
