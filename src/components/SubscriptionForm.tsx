import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { billingCycles, splitTags } from "../lib/format";
import type { Subscription, SubscriptionInput } from "../lib/types";

type Props = {
  subscription: Subscription | null;
  defaultCurrency: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (subscription: SubscriptionInput) => void;
};

export function SubscriptionForm({ subscription, defaultCurrency, saving, onCancel, onSave }: Props) {
  const [form, setForm] = useState({
    name: subscription?.name || "",
    description: subscription?.description || "",
    amount: subscription?.amount?.toString() || "",
    currency: subscription?.currency || defaultCurrency,
    billing_cycle: subscription?.billing_cycle || "monthly",
    billing_date: subscription?.billing_date || "",
    category: subscription?.category || "",
    payment_method: subscription?.payment_method || "",
    url: subscription?.url || "",
    notes: subscription?.notes || "",
    icon: subscription?.icon || "",
    color: subscription?.color || "#28536b",
    tags: subscription?.tags?.join(", ") || "",
    is_active: subscription?.is_active ?? true
  });

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({
      name: form.name,
      description: form.description || null,
      amount: Number(form.amount),
      currency: form.currency,
      billing_cycle: form.billing_cycle,
      billing_date: form.billing_date || null,
      category: form.category || null,
      payment_method: form.payment_method || null,
      url: form.url || null,
      notes: form.notes || null,
      icon: form.icon || null,
      color: form.color || null,
      tags: splitTags(form.tags),
      is_active: form.is_active
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-panel subscription-form" onSubmit={submit}>
        <div className="modal-header">
          <h2>{subscription ? "Edit subscription" : "Add subscription"}</h2>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="form-grid">
          <label>
            Name
            <input required value={form.name} onChange={(event) => update("name", event.target.value)} />
          </label>
          <label>
            Amount
            <input required min="0" step="0.01" type="number" value={form.amount} onChange={(event) => update("amount", event.target.value)} />
          </label>
          <label>
            Currency
            <input required maxLength={3} value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} />
          </label>
          <label>
            Billing cycle
            <select value={form.billing_cycle} onChange={(event) => update("billing_cycle", event.target.value)}>
              {billingCycles.map((cycle) => (
                <option key={cycle.value} value={cycle.value}>
                  {cycle.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Billing date
            <input type="date" value={form.billing_date} onChange={(event) => update("billing_date", event.target.value)} />
          </label>
          <label>
            Category
            <input value={form.category} onChange={(event) => update("category", event.target.value)} />
          </label>
          <label>
            Payment method
            <input value={form.payment_method} onChange={(event) => update("payment_method", event.target.value)} />
          </label>
          <label>
            URL
            <input type="url" value={form.url} onChange={(event) => update("url", event.target.value)} />
          </label>
          <label>
            Icon label
            <input value={form.icon} onChange={(event) => update("icon", event.target.value)} />
          </label>
          <label>
            Color
            <input type="color" value={form.color} onChange={(event) => update("color", event.target.value)} />
          </label>
          <label className="wide">
            Tags
            <input value={form.tags} placeholder="streaming, family" onChange={(event) => update("tags", event.target.value)} />
          </label>
          <label className="wide">
            Description
            <input value={form.description} onChange={(event) => update("description", event.target.value)} />
          </label>
          <label className="wide">
            Notes
            <textarea rows={3} value={form.notes} onChange={(event) => update("notes", event.target.value)} />
          </label>
          <label className="checkbox-line">
            <input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} />
            Active subscription
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
