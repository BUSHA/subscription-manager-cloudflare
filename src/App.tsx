import { useCallback, useEffect, useState } from "react";
import SubscriptionList from "@/components/SubscriptionList";
import SubscriptionModal from "@/components/SubscriptionModal";
import CalendarGrid from "@/components/CalendarGrid";
import Totals from "@/components/Totals";
import ConfigurationModal from "@/components/ConfigurationModal";
import CostTrendGraph from "@/components/CostTrendGraph";
import CompositionCharts from "@/components/CompositionCharts";
import { ProfileModal } from "@/components/ProfileModal";
import { Icon } from "@iconify-icon/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import type { CurrentUser, Subscription, UserConfiguration } from "@/types";

function normalizeSubscriptions(payload: unknown): Subscription[] {
  const subscriptions = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "subscriptions" in payload && Array.isArray((payload as { subscriptions: unknown }).subscriptions)
      ? (payload as { subscriptions: Subscription[] }).subscriptions
      : [];

  return subscriptions.map((sub) => ({
    ...sub,
    dueDate: sub.dueDate || sub.due_date || sub.billing_date || new Date().toISOString().split("T")[0],
    due_date: sub.due_date || sub.dueDate || sub.billing_date,
    account: sub.account || sub.payment_method || "",
    autopay: Boolean(sub.autopay),
    intervalValue: Number(sub.intervalValue || sub.interval_value || 1),
    intervalUnit: sub.intervalUnit || sub.interval_unit || "months",
    interval_value: Number(sub.interval_value || sub.intervalValue || 1),
    interval_unit: (sub.interval_unit || sub.intervalUnit || "months") as Subscription["interval_unit"],
    included: sub.included !== undefined ? sub.included : sub.is_active !== false,
    tags: Array.isArray(sub.tags) ? sub.tags : []
  }));
}

function normalizeConfiguration(payload: unknown): UserConfiguration {
  const config =
    payload && typeof payload === "object" && "configuration" in payload
      ? (payload as { configuration: UserConfiguration }).configuration
      : (payload as UserConfiguration | null);

  return {
    currency: config?.currency || "USD",
    showCurrencySymbol: config?.showCurrencySymbol ?? config?.show_currency_symbol ?? true
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfiguration>({
    currency: "USD",
    showCurrencySymbol: true
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[] | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("month");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const [meResponse, subsResponse, configResponse] = await Promise.all([
          fetch("/api/me").then((res) => res.json()),
          fetch("/api/subscriptions").then((res) => res.json()),
          fetch("/api/user-configuration").then((res) => res.json())
        ]);

        setCurrentUser(meResponse as CurrentUser);
        setSubscriptions(normalizeSubscriptions(subsResponse));
        setUserConfig(normalizeConfiguration(configResponse));
      } catch (error) {
        console.error("Error initializing app:", error);
        alert("Failed to initialize the application. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    void initializeApp();
  }, []);

  const handleSaveSubscription = async (subscription: Subscription) => {
    try {
      const method = subscription.id ? "PUT" : "POST";
      const url = subscription.id ? `/api/subscriptions/${subscription.id}` : "/api/subscriptions";
      const subToSave = {
        ...subscription,
        currency: subscription.currency === "default" ? userConfig.currency : subscription.currency,
        included: subscription.included !== undefined ? subscription.included : true
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subToSave)
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      const savedPayload = (await response.json()) as { subscription?: Subscription } | Subscription;
      const [savedSubscription] = normalizeSubscriptions(
        "subscription" in savedPayload ? [savedPayload.subscription] : [savedPayload]
      );

      setSubscriptions((prev) =>
        subscription.id
          ? prev.map((sub) => (sub.id === subscription.id ? savedSubscription : sub))
          : [...prev, savedSubscription]
      );
    } catch (error) {
      console.error("Error saving subscription:", error);
      alert("Failed to save subscription. Please try again.");
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      const response = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete subscription");
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (error) {
      console.error("Error deleting subscription:", error);
      alert("Failed to delete subscription. Please try again.");
    }
  };

  const handleToggleInclude = async (id: number) => {
    const current = subscriptions.find((sub) => sub.id === id);
    if (!current) return;

    const next = { ...current, included: !current.included };
    setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? next : sub)));

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      if (!response.ok) throw new Error("Failed to update subscription");
    } catch (error) {
      console.error("Error updating subscription:", error);
      setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? current : sub)));
      alert("Failed to update subscription. Please try again.");
    }
  };

  const handleFilteredSubscriptionsChange = useCallback((nextFilteredSubscriptions: Subscription[]) => {
    setFilteredSubscriptions(nextFilteredSubscriptions);
  }, []);

  const handleTagFilterChange = useCallback((tags: string[]) => {
    setSelectedTags(tags);
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSubscription(undefined);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const data = JSON.stringify(subscriptions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscriptions.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSubscriptions = normalizeSubscriptions(JSON.parse(e.target?.result as string));
        const savedSubscriptions = await Promise.all(
          importedSubscriptions.map(async (sub) => {
            const response = await fetch("/api/subscriptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...sub, currency: sub.currency || userConfig.currency })
            });
            if (!response.ok) throw new Error(`Failed to save subscription: ${sub.name}`);
            const payload = (await response.json()) as { subscription: Subscription };
            return normalizeSubscriptions([payload.subscription])[0];
          })
        );

        setSubscriptions(savedSubscriptions);
        alert(`Successfully imported ${savedSubscriptions.length} subscriptions.`);
      } catch (error) {
        console.error("Error importing subscriptions:", error);
        alert("Failed to import subscriptions. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfigurationSave = async (config: {
    currency: string;
    showCurrencySymbol: boolean;
  }) => {
    try {
      const response = await fetch("/api/user-configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: config.currency,
          show_currency_symbol: config.showCurrencySymbol
        })
      });

      if (!response.ok) throw new Error("Failed to save configuration");
      const payload = await response.json();
      setUserConfig(normalizeConfiguration(payload));
      setIsConfigModalOpen(false);
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to save configuration. Please try again.");
    }
  };

  const handleProfileSave = async (displayName: string) => {
    if (!displayName) {
      setProfileError("Name is required.");
      return;
    }

    setIsProfileSaving(true);
    setProfileError(null);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName })
      });

      const payload = (await response.json().catch(() => ({}))) as CurrentUser | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Could not save profile");
      }

      setCurrentUser(payload as CurrentUser);
      setIsProfileModalOpen(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setIsProfileSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="content-container">
          <div style={{ textAlign: "center", marginTop: "2rem", color: "#fff" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <div className="app-header">
        <h1 className="app-title">Subscription Manager</h1>
        <button
          className="burger-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <Icon icon={isMobileMenuOpen ? "mdi:close" : "mdi:menu"} />
        </button>
        <div className={`header-actions ${isMobileMenuOpen ? "open" : ""}`}>
          <button
            className="export-button"
            onClick={() => {
              handleExport();
              setIsMobileMenuOpen(false);
            }}
            data-label="Export"
            aria-label="Export"
          >
            <Icon icon="mdi:download" className="export-icon" />
            <span>Export</span>
          </button>

          <label className="import-button" data-label="Import" aria-label="Import">
            <Icon icon="mdi:upload" className="import-icon" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                handleImport(e);
                setIsMobileMenuOpen(false);
              }}
              className="import-input"
            />
          </label>

          <button
            className="config-button"
            onClick={() => {
              setIsConfigModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            data-label="Settings"
            aria-label="Settings"
          >
            <FontAwesomeIcon icon={faCog} />
            Settings
          </button>
          {currentUser ? (
            <button
              className="profile-button"
              type="button"
              onClick={() => {
                setProfileError(null);
                setIsProfileModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="profile-avatar">{initials(currentUser.display_name)}</span>
              <span className="profile-name">{currentUser.display_name}</span>
            </button>
          ) : null}
        </div>
      </div>
      <div className="content-container">
        <CalendarGrid subscriptions={subscriptions} onDateClick={handleDateClick} currentDate={selectedDate} />
        <SubscriptionList
          subscriptions={subscriptions}
          onEdit={(subscription) => {
            setSelectedSubscription(subscription);
            setIsModalOpen(true);
          }}
          onDelete={handleDeleteSubscription}
          onToggleInclude={handleToggleInclude}
          showCurrencySymbol={userConfig.showCurrencySymbol}
          onFilteredSubscriptionsChange={handleFilteredSubscriptionsChange}
          onTagFilterChange={handleTagFilterChange}
        />
        <Totals
          subscriptions={filteredSubscriptions || subscriptions}
          currency={userConfig.currency}
          showCurrencySymbol={userConfig.showCurrencySymbol}
          selectedTags={selectedTags}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <CostTrendGraph
          subscriptions={filteredSubscriptions || subscriptions}
          selectedPeriod={selectedPeriod}
          currency={userConfig.currency}
          showCurrencySymbol={userConfig.showCurrencySymbol}
        />
        <CompositionCharts subscriptions={filteredSubscriptions || subscriptions} currency={userConfig.currency} />
      </div>
      {isModalOpen ? (
        <SubscriptionModal
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubscription(undefined);
          }}
          onSave={handleSaveSubscription}
          selectedSubscription={selectedSubscription}
          selectedDate={selectedDate}
          defaultCurrency={userConfig.currency}
        />
      ) : null}

      {isConfigModalOpen ? (
        <ConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          currency={userConfig.currency}
          showCurrencySymbol={userConfig.showCurrencySymbol}
          onSave={handleConfigurationSave}
        />
      ) : null}

      {isProfileModalOpen && currentUser ? (
        <ProfileModal
          user={currentUser}
          saving={isProfileSaving}
          error={profileError}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={(displayName) => void handleProfileSave(displayName)}
        />
      ) : null}
    </div>
  );
}
