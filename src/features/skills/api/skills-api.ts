export type Skill = {
  id: string;
  label: string;
  iconSrc: string;
  highlighted?: boolean;
};

const SKILLS: Skill[] = [
  { id: "html", label: "HTML", iconSrc: "/assets/skills/html.svg" },
  { id: "css", label: "CSS", iconSrc: "/assets/skills/css.svg" },
  { id: "js", label: "JS ES6+", iconSrc: "/assets/skills/js.svg" },
  { id: "react", label: "REACT", iconSrc: "/assets/skills/react.svg", highlighted: true },
  { id: "redux", label: "REDUX", iconSrc: "/assets/skills/redux.svg" },
  { id: "npm", label: "NPM", iconSrc: "/assets/skills/npm-alt.svg" },
  { id: "webpack", label: "WEBPACK", iconSrc: "/assets/skills/webpack.svg" },
  { id: "sass", label: "SASS", iconSrc: "/assets/skills/sass.svg" },
  { id: "git", label: "GIT", iconSrc: "/assets/skills/git.svg" },
  { id: "npm-2", label: "NPM", iconSrc: "/assets/skills/npm.svg" },
  { id: "graphql", label: "GRAPHQL", iconSrc: "/assets/skills/graphql.svg" },
  { id: "github", label: "GITHUB", iconSrc: "/assets/skills/github.svg" },
  { id: "jest", label: "JEST", iconSrc: "/assets/skills/jest.svg" },
  { id: "nextjs", label: "NEXT.JS", iconSrc: "/assets/skills/nextjs.svg" },
  { id: "webpack-2", label: "WEBPACK", iconSrc: "/assets/skills/webpack.svg" },
  { id: "vscode", label: "VS CODE", iconSrc: "/assets/skills/vscode.svg" },
  { id: "figma", label: "FIGMA", iconSrc: "/assets/skills/figma.svg" },
  { id: "gimp", label: "GIMP", iconSrc: "/assets/skills/gimp.svg" },
];

const getSkills = async () => SKILLS;

export const skillsApi = {
  getSkills,
};
