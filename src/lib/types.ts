export type IntervalUnit = "days" | "weeks" | "months" | "years";
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
  dueDate?: string;
  due_date?: string;
  category?: string | null;
  payment_method?: string | null;
  account?: string | null;
  url?: string | null;
  notes?: string | null;
  icon?: string | null;
  color?: string | null;
  tags?: string[] | null;
  autopay?: boolean;
  intervalValue?: number;
  intervalUnit?: IntervalUnit | string;
  interval_value?: number;
  interval_unit?: IntervalUnit | string;
  included?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInput = {
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  billing_cycle?: BillingCycle | string;
  billing_date?: string | null;
  dueDate?: string | null;
  due_date?: string | null;
  category?: string | null;
  payment_method?: string | null;
  account?: string | null;
  url?: string | null;
  notes?: string | null;
  icon?: string | null;
  color?: string | null;
  tags?: string[] | null;
  autopay?: boolean;
  intervalValue?: number;
  intervalUnit?: IntervalUnit | string;
  interval_value?: number;
  interval_unit?: IntervalUnit | string;
  included?: boolean;
  is_active?: boolean;
};

export type UserConfiguration = {
  user_id?: string;
  currency: string;
  locale?: string | null;
  show_currency_symbol: boolean;
  showCurrencySymbol?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ApiError = {
  error: string;
};
