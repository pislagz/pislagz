export type Skill = {
  id: string;
  label?: string;
  iconSrc?: string;
  value?: string;
  subtitle?: string;
  highlighted?: boolean;
};

const SKILLS: Skill[] = [
  { "id": "nextjs", "label": "NEXT.JS", "iconSrc": "/assets/skills/nextjs.svg" },
  { "id": "typescript", "label": "TYPESCRIPT", "iconSrc": "/assets/skills/typescript.svg" },
  { "id": "hours", "value": "168 h / month", "subtitle": "availability" },  
  { "id": "javascript", "label": "JAVASCRIPT", "iconSrc": "/assets/skills/js.svg" },
  { "id": "redux", "label": "REDUX TOOLKIT", "iconSrc": "/assets/skills/redux.svg" },
  { "id": "contract", "value": "B2B / employment", "subtitle": "contract type" },
  { "id": "sass", "label": "SASS", "iconSrc": "/assets/skills/sass.svg" },
  { "id": "ai", "label": "AI", "iconSrc": "/assets/skills/ai.svg", "highlighted": true },
  { "id": "figma", "label": "FIGMA", "iconSrc": "/assets/skills/figma.svg" },
  { "id": "react", "label": "REACT", "iconSrc": "/assets/skills/react.svg", "highlighted": true },
  { "id": "location", "value": "Poland", "subtitle": "location" },
  { "id": "graphql", "label": "GRAPHQL", "iconSrc": "/assets/skills/graphql.svg" },
  { "id": "availability", "value": "available", "subtitle": "immediately" },
  { "id": "lm-studio", "label": "LM STUDIO", "iconSrc": "/assets/skills/lm-studio.svg" },
  { "id": "testing-library", "label": "TESTING LIBRARY", "iconSrc": "/assets/skills/testing-library.svg" },
  { "id": "experience", "value": "8 years", "subtitle": "of experience" },
  { "id": "vite", "label": "VITE", "iconSrc": "/assets/skills/vite.svg" },
  { "id": "work-type", "value": "fully remote", "subtitle": "work type" },
  { "id": "tailwind", "label": "TAILWIND", "iconSrc": "/assets/skills/tailwind.svg" },
  { "id": "claude", "label": "CLAUDE", "iconSrc": "/assets/skills/claude.svg" },
  { "id": "cursor", "label": "CURSOR", "iconSrc": "/assets/skills/cursor.svg" },
  // { "id": "git", "label": "GIT", "iconSrc": "/assets/skills/git.svg" },
  // { "id": "css", "label": "CSS", "iconSrc": "/assets/skills/css.svg" },
  // { "id": "mcp", "label": "MCP", "iconSrc": "/assets/skills/mcp.svg" },
  // { "id": "ollama", "label": "OLLAMA", "iconSrc": "/assets/skills/ollama.svg" },
  // { "id": "html", "label": "HTML", "iconSrc": "/assets/skills/html.svg" },
  
];

const getSkills = async () => SKILLS;

export const skillsApi = {
  getSkills,
};
