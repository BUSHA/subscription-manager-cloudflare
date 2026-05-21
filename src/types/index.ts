export interface UserConfiguration {
  currency: string;
  showCurrencySymbol: boolean;
  show_currency_symbol?: boolean;
  locale?: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  display_name: string;
}

export interface Subscription {
  id?: number;
  user_id?: string;
  name: string;
  amount: number;
  dueDate: string;
  due_date?: string;
  billing_date?: string | null;
  billing_cycle?: string;
  icon?: string;
  color?: string;
  account?: string;
  payment_method?: string | null;
  autopay: boolean;
  intervalValue: number;
  intervalUnit: string;
  interval_value?: number;
  interval_unit?: 'days' | 'weeks' | 'months' | 'years';
  currency: string;
  included?: boolean;
  is_active?: boolean;
  tags?: string[];
  description?: string | null;
  category?: string | null;
  url?: string | null;
  notes?: string | null;
}

export interface NtfySettings {
  topic: string;
  domain?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 
