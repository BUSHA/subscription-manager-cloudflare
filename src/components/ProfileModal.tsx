import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CurrentUser } from "@/types";
import styles from "./ProfileModal.module.css";

interface ProfileModalProps {
  user: CurrentUser;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (displayName: string) => void;
}

export function ProfileModal({ user, saving, error, onClose, onSave }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.display_name);

  useEffect(() => {
    setDisplayName(user.display_name);
  }, [user.display_name]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSave(displayName.trim());
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.form
        className={styles.modalContainer}
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Profile</h2>
        <p className={styles.email}>{user.email}</p>

        <div className={styles.formGroup}>
          <label htmlFor="profile-display-name">Name</label>
          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            maxLength={80}
            autoFocus
            required
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

        <p className={styles.error}>{error || ""}</p>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => {
              window.location.href = "/cdn-cgi/access/logout";
            }}
          >
            Log out
          </button>
          <span className={styles.spacer} />
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton} disabled={saving}>
            Save
          </button>
        </div>
      </motion.form>
    </div>
  );
}
