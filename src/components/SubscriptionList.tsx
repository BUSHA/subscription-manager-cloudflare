import { Edit3, ExternalLink, Trash2 } from "lucide-react";
import { billingCycles, formatCurrency, formatDate, toMonthlyAmount } from "../lib/format";
import type { Subscription } from "../lib/types";

type Props = {
  subscriptions: Subscription[];
  loading: boolean;
  currency: string;
  locale: string;
  showCurrencySymbol: boolean;
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
};

export function SubscriptionList({
  subscriptions,
  loading,
  currency,
  locale,
  showCurrencySymbol,
  onEdit,
  onDelete
}: Props) {
  if (loading) {
    return <section className="empty-state">Loading subscriptions...</section>;
  }

  if (subscriptions.length === 0) {
    return <section className="empty-state">No subscriptions yet. Add the first one to start tracking spend.</section>;
  }

  return (
    <section className="subscription-table" aria-label="Subscriptions">
      <div className="table-heading">
        <h2>Subscriptions</h2>
        <span>{subscriptions.length} total</span>
      </div>
      <div className="table-list">
        {subscriptions.map((subscription) => {
          const cycle = billingCycles.find((item) => item.value === subscription.billing_cycle)?.label ?? subscription.billing_cycle;
          const monthlyEquivalent = toMonthlyAmount(subscription);

          return (
            <article className={`subscription-row ${subscription.is_active ? "" : "inactive"}`} key={subscription.id}>
              <div className="service-mark" style={{ background: subscription.color || "#28536b" }}>
                {(subscription.icon || subscription.name).slice(0, 2).toUpperCase()}
              </div>
              <div className="subscription-main">
                <div className="name-line">
                  <h3>{subscription.name}</h3>
                  {!subscription.is_active ? <span className="status-pill">Inactive</span> : null}
                </div>
                <p>
                  {formatCurrency(subscription.amount, subscription.currency || currency, locale, showCurrencySymbol)} / {cycle}
                </p>
                <div className="meta-line">
                  <span>{formatDate(subscription.billing_date, locale)}</span>
                  {subscription.category ? <span>{subscription.category}</span> : null}
                  {subscription.payment_method ? <span>{subscription.payment_method}</span> : null}
                </div>
                {subscription.tags?.length ? (
                  <div className="tag-list">
                    {subscription.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="monthly-equivalent">
                <span>Monthly</span>
                <strong>{formatCurrency(monthlyEquivalent, subscription.currency || currency, locale, showCurrencySymbol)}</strong>
              </div>
              <div className="row-actions">
                {subscription.url ? (
                  <a className="icon-button" href={subscription.url} target="_blank" rel="noreferrer" aria-label={`Open ${subscription.name}`}>
                    <ExternalLink size={17} />
                  </a>
                ) : null}
                <button className="icon-button" type="button" onClick={() => onEdit(subscription)} aria-label={`Edit ${subscription.name}`}>
                  <Edit3 size={17} />
                </button>
                <button className="icon-button danger" type="button" onClick={() => onDelete(subscription)} aria-label={`Delete ${subscription.name}`}>
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
