"use client";

import styles from "./ColorPicker.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  tabIndex?: number;
};

export function ColorPicker({
  value,
  onChange,
  ariaLabel = "Choose color",
  tabIndex = -1,
}: Props) {
  return (
    <div className={styles.control}>
      <label className={styles.inputWrap}>
        <input
          className={styles.input}
          type="color"
          value={value}
          aria-label={ariaLabel}
          tabIndex={tabIndex}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <span className={styles.readout}>{value}</span>
    </div>
  );
}
