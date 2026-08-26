import styles from "./SimulateTrafficButton.module.css";

/**
 * Simulate Traffic control.
 * The parent builds a random payload and POSTs /api/events, then refreshes.
 * @param {{ disabled: boolean, simulating: boolean, onClick: () => void }} props
 */
export default function SimulateTrafficButton({
  disabled,
  simulating,
  onClick,
}) {
  return (
    <div className={styles.heroActions}>
      <button
        className={styles.simulate}
        type="button"
        disabled={disabled || simulating}
        onClick={onClick}
      >
        {simulating ? "Sending event…" : "Simulate traffic"}
      </button>
      <p className={styles.simulateHint}>
        Posts a weighted random event to <code>POST /api/events</code>
      </p>
    </div>
  );
}
