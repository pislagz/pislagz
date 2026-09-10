import type { Skill } from "../api";
import styles from "./SkillItem.module.css";

type Props = {
  skill: Skill;
};

export function SkillItem({ skill }: Props) {
  return (
    <div className={`${styles.item} ${skill.highlighted ? styles.highlighted : ""}`}>
      <img src={skill.iconSrc} alt="" width={32} height={32} className={styles.icon} />
      <span className={styles.label}>{skill.label}</span>
    </div>
  );
}
