import { projectsApi } from "../api";
import { ProjectCard } from "../components/ProjectCard";
import styles from "./ProjectsPage.module.css";

export async function ProjectsPage() {
  const projects = await projectsApi.getProjects();

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>my projects</h1>
      <p className={styles.lead}>
        this page lists some of my personal and work projects. every project has some story, click
        on the title to read
      </p>
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
