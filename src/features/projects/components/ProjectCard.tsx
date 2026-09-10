import type { Project } from "../api";
import styles from "./ProjectCard.module.css";

type Props = {
  project: Project;
};

export function ProjectCard({ project }: Props) {
  return (
    <article className={styles.card}>
      <h2 className={styles.badge}>{project.title}</h2>
      <div className={styles.body}>
        <div className={styles.copy}>
          <p className={styles.description}>{project.description}</p>
          <div className={styles.tags}>
            {project.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className={styles.links}>
            <a className={styles.link} href={project.codeUrl} target="_blank" rel="noreferrer">
              <img src="/assets/icons/github.svg" alt="" width={12} height={12} />
              code
            </a>
            <a className={styles.siteChip} href={project.siteUrl} target="_blank" rel="noreferrer">
              <img src="/assets/icons/site.svg" alt="" width={18} height={18} />
              site
            </a>
          </div>
        </div>
        <div className={`${styles.thumb} ${project.imageBox === "dashed-light" ? styles.light : ""}`}>
          <img src={project.imageSrc} alt={project.imageAlt} width={34} height={33} />
        </div>
      </div>
    </article>
  );
}
