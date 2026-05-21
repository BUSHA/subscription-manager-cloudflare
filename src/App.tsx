import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Settings } from "lucide-react";
import { api } from "./lib/api";
import { formatCurrency, toMonthlyAmount, toYearlyAmount } from "./lib/format";
import type { Subscription, SubscriptionInput, UserConfiguration } from "./lib/types";
import { SubscriptionForm } from "./components/SubscriptionForm";
import { SubscriptionList } from "./components/SubscriptionList";
import { SettingsPanel } from "./components/SettingsPanel";
import { SummaryCards } from "./components/SummaryCards";

const defaultConfiguration: UserConfiguration = {
  currency: "USD",
  locale: "en-US",
  show_currency_symbol: true
};

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [configuration, setConfiguration] = useState<UserConfiguration>(defaultConfiguration);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    setLoading(true);
    try {
      const [subs, configResponse] = await Promise.all([api.listSubscriptions(), api.getUserConfiguration()]);
      setSubscriptions(subs);
      setConfiguration(configResponse.configuration);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const totals = useMemo(() => {
    return subscriptions.reduce(
      (acc, subscription) => {
        acc.monthly += toMonthlyAmount(subscription);
        acc.yearly += toYearlyAmount(subscription);
        if (subscription.is_active) acc.active += 1;
        return acc;
      },
      { monthly: 0, yearly: 0, active: 0 }
    );
  }, [subscriptions]);

  async function saveSubscription(input: SubscriptionInput) {
    setSaving(true);
    setError(null);
    try {
      const result = editing
        ? await api.updateSubscription(editing.id, input)
        : await api.createSubscription(input);

      setSubscriptions((current) => {
        if (editing) {
          return current.map((subscription) => (subscription.id === editing.id ? result.subscription : subscription));
        }
        return [result.subscription, ...current];
      });
      setEditing(null);
      setIsAdding(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to save subscription");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSubscription(subscription: Subscription) {
    const confirmed = window.confirm(`Delete ${subscription.name}?`);
    if (!confirmed) return;

    setError(null);
    try {
      await api.deleteSubscription(subscription.id);
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to delete subscription");
    }
  }

  async function saveConfiguration(next: UserConfiguration) {
    setSaving(true);
    setError(null);
    try {
      const result = await api.updateUserConfiguration(next);
      setConfiguration(result.configuration);
      setShowSettings(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const displayCurrency = configuration.currency || "USD";
  const displayLocale = configuration.locale || "en-US";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Family subscriptions</p>
          <h1>Subscription Manager</h1>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={() => void loadData()} aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="icon-button" type="button" onClick={() => setShowSettings(true)} aria-label="Settings">
            <Settings size={18} />
          </button>
          <button className="primary-button" type="button" onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            Add
          </button>
        </div>
      </header>

      {error ? <div className="alert">{error}</div> : null}

      <main>
        <SummaryCards
          activeCount={totals.active}
          monthlyTotal={formatCurrency(totals.monthly, displayCurrency, displayLocale, configuration.show_currency_symbol)}
          yearlyTotal={formatCurrency(totals.yearly, displayCurrency, displayLocale, configuration.show_currency_symbol)}
        />

        <SubscriptionList
          subscriptions={subscriptions}
          loading={loading}
          currency={displayCurrency}
          locale={displayLocale}
          showCurrencySymbol={configuration.show_currency_symbol}
          onEdit={setEditing}
          onDelete={(subscription) => void deleteSubscription(subscription)}
        />
      </main>

      {isAdding || editing ? (
        <SubscriptionForm
          subscription={editing}
          defaultCurrency={displayCurrency}
          saving={saving}
          onCancel={() => {
            setEditing(null);
            setIsAdding(false);
          }}
          onSave={(input) => void saveSubscription(input)}
        />
      ) : null}

      {showSettings ? (
        <SettingsPanel
          configuration={configuration}
          saving={saving}
          onCancel={() => setShowSettings(false)}
          onSave={(next) => void saveConfiguration(next)}
        />
      ) : null}
    </div>
  );
}
