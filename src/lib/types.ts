export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly" | "one-time";

export type Subscription = {
  id: number;
  user_id?: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle | string;
  billing_date?: string | null;
  category?: string | null;
  payment_method?: string | null;
  url?: string | null;
  notes?: string | null;
  icon?: string | null;
  color?: string | null;
  tags?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInput = {
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle | string;
  billing_date?: string | null;
  category?: string | null;
  payment_method?: string | null;
  url?: string | null;
  notes?: string | null;
  icon?: string | null;
  color?: string | null;
  tags?: string[] | null;
  is_active?: boolean;
};

export type UserConfiguration = {
  user_id?: string;
  currency: string;
  locale?: string | null;
  show_currency_symbol: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ApiError = {
  error: string;
};
