import { skillsApi } from "../api";
import { SkillsBentoGrid } from "../components/SkillsBentoGrid";
import styles from "./SkillsPage.module.css";

export async function SkillsPage() {
  const skills = await skillsApi.getSkills();

  return (
    <section className={styles.page} aria-label="my skills">
      <SkillsBentoGrid skills={skills} />
    </section>
  );
}
