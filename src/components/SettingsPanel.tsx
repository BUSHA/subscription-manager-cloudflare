import { useState } from "react";
import { X } from "lucide-react";
import type { UserConfiguration } from "../lib/types";

type Props = {
  configuration: UserConfiguration;
  saving: boolean;
  onCancel: () => void;
  onSave: (configuration: UserConfiguration) => void;
};

export function SettingsPanel({ configuration, saving, onCancel, onSave }: Props) {
  const [currency, setCurrency] = useState(configuration.currency || "USD");
  const [locale, setLocale] = useState(configuration.locale || "en-US");
  const [showSymbol, setShowSymbol] = useState(configuration.show_currency_symbol);

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="modal-panel settings-panel"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ currency, locale, show_currency_symbol: showSymbol });
        }}
      >
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <label>
          Default currency
          <input required maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
        </label>
        <label>
          Locale
          <input value={locale} onChange={(event) => setLocale(event.target.value)} />
        </label>
        <label className="checkbox-line">
          <input type="checkbox" checked={showSymbol} onChange={(event) => setShowSymbol(event.target.checked)} />
          Show currency symbol
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
