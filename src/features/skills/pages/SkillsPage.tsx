import { skillsApi } from "../api";
import { SkillItem } from "../components/SkillItem";
import styles from "./SkillsPage.module.css";

export async function SkillsPage() {
  const skills = await skillsApi.getSkills();

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>my skills</h1>
      <p className={styles.lead}>
        on this page you can check my skills and tools that i use in my daily work
      </p>
      <div className={styles.grid}>
        {skills.map((skill) => (
          <SkillItem key={skill.id} skill={skill} />
        ))}
      </div>
    </section>
  );
}
