import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './ConfigurationModal.module.css';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';
import currencyList from 'currency-symbol-map/map';
import { Icon } from '@iconify-icon/react';


interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  showCurrencySymbol: boolean;
  onSave: (config: {
    currency: string;
    showCurrencySymbol: boolean;
  }) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function ConfigurationModal({ 
  isOpen, 
  onClose, 
  currency, 
  showCurrencySymbol, 
  onSave,
  onExport,
  onImport
}: ConfigurationModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShowCurrencySymbol, setSelectedShowCurrencySymbol] = useState(showCurrencySymbol);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currency);
    }
  }, [isOpen, currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      currency: selectedCurrency,
      showCurrencySymbol: selectedShowCurrencySymbol
    });
  };

  const filteredCurrencies = Object.entries(currencyList).filter(([code, name]) =>
    `${code} ${name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCurrencyOption = Object.entries(currencyList).find(
    ([code]) => code === selectedCurrency
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Configuration</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.configSection}>
            <h3>Currency settings</h3>
            <div className={styles.formGroup}>
              <label htmlFor="currency-search">Search currency</label>
              <input
                id="currency-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by currency code or name"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                size={5}
              >
                {selectedCurrencyOption && !filteredCurrencies.some(([code]) => code === selectedCurrency) && (
                  <option key={selectedCurrencyOption[0]} value={selectedCurrencyOption[0]}>
                    {selectedCurrencyOption[0]} - {selectedCurrencyOption[1] as string} ({getSymbolFromCurrency(selectedCurrencyOption[0]) || 'N/A'})
                  </option>
                )}
                
                {filteredCurrencies.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} - {name as string} ({getSymbolFromCurrency(code) || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.switchLabel}>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={selectedShowCurrencySymbol}
                    onChange={(e) => setSelectedShowCurrencySymbol(e.target.checked)}
                  />
                  <span className={styles.toggleSlider}></span>
                </div>
                <span style={{ paddingLeft: '10px' }}>
                  {selectedShowCurrencySymbol 
                    ? `Symbol (${getSymbolFromCurrency(selectedCurrency) || 'N/A'})` 
                    : `Code (${selectedCurrency})`
                  }
                </span>
              </label>
            </div>
          </div>
          <div className={styles.configSection}>
            <h3>Data</h3>
            <div className={styles.dataActions}>
              <button type="button" className={styles.dataButton} onClick={onExport}>
                <Icon icon="mdi:download" />
                Export
              </button>
              <button
                type="button"
                className={styles.dataButton}
                onClick={() => importInputRef.current?.click()}
              >
                <Icon icon="mdi:upload" />
                Import
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={onImport}
                className={styles.fileInput}
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default ConfigurationModal; 
