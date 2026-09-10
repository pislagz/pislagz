export type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageSrc: string;
  imageAlt: string;
  imageBox: "dashed" | "dashed-light";
  codeUrl: string;
  siteUrl: string;
};

const PROJECTS: Project[] = [
  {
    id: "manycoins",
    title: "manycoins",
    description:
      "Manycoins is a light app meant to monitor cryptocurrencies in real time. Built with Coincap.io API and React.js",
    tags: ["react", "styled-components", "graphql", "apollo"],
    imageSrc: "/assets/projects/manycoins.png",
    imageAlt: "Manycoins coin mark",
    imageBox: "dashed",
    codeUrl: "https://github.com/pislagz",
    siteUrl: "https://pawelpisulski.pl/projects",
  },
];

const getProjects = async () => PROJECTS;

export const projectsApi = {
  getProjects,
};
