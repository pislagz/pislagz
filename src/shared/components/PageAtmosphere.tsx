import styles from "./PageAtmosphere.module.css";

export function PageAtmosphere() {
  return (
    <div className={styles.root} aria-hidden="true">
      <svg className={styles.filterDef} aria-hidden="true">
        <filter id="page-film-grain" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.78"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" />
        </filter>
      </svg>
      <div className={styles.grain} />
      <div className={styles.glow} />
    </div>
  );
}
