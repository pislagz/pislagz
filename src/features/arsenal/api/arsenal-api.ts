export type ArsenalItem = {
  id: string;
  label?: string;
  iconSrc?: string;
  value?: string;
  subtitle?: string;
  highlighted?: boolean;
};

const ARSENAL: ArsenalItem[] = [
  { "id": "nextjs", "label": "NEXT.JS", "iconSrc": "/assets/arsenal/nextjs.svg" },
  { "id": "typescript", "label": "TYPESCRIPT", "iconSrc": "/assets/arsenal/typescript.svg" },
  { "id": "hours", "value": "168 h / month", "subtitle": "availability" },  
  { "id": "javascript", "label": "JAVASCRIPT", "iconSrc": "/assets/arsenal/js.svg" },
  { "id": "redux", "label": "REDUX TOOLKIT", "iconSrc": "/assets/arsenal/redux.svg" },
  { "id": "contract", "value": "B2B / employment", "subtitle": "contract type" },
  // { "id": "sass", "label": "SASS", "iconSrc": "/assets/arsenal/sass.svg" },
  { "id": "mcp", "label": "MCP", "iconSrc": "/assets/arsenal/mcp.svg" },
  { "id": "ai", "label": "AI", "iconSrc": "/assets/arsenal/ai.svg", "highlighted": true },
  { "id": "figma", "label": "FIGMA", "iconSrc": "/assets/arsenal/figma.svg" },
  { "id": "react", "label": "REACT", "iconSrc": "/assets/arsenal/react.svg", "highlighted": true },
  { "id": "location", "value": "Poland", "subtitle": "location" },
  { "id": "graphql", "label": "GRAPHQL", "iconSrc": "/assets/arsenal/graphql.svg" },
  { "id": "availability", "value": "available", "subtitle": "immediately" },
  { "id": "lm-studio", "label": "LM STUDIO", "iconSrc": "/assets/arsenal/lm-studio.svg" },
  { "id": "testing-library", "label": "TESTING LIBRARY", "iconSrc": "/assets/arsenal/testing-library.svg" },
  { "id": "experience", "value": "8 years", "subtitle": "of experience" },
  { "id": "vite", "label": "VITE", "iconSrc": "/assets/arsenal/vite.svg" },
  { "id": "work-type", "value": "fully remote", "subtitle": "work type" },
  { "id": "tailwind", "label": "TAILWIND", "iconSrc": "/assets/arsenal/tailwind.svg" },
  { "id": "claude", "label": "CLAUDE", "iconSrc": "/assets/arsenal/claude.svg" },
  { "id": "cursor", "label": "CURSOR", "iconSrc": "/assets/arsenal/cursor.svg" },
  // { "id": "git", "label": "GIT", "iconSrc": "/assets/arsenal/git.svg" },
  // { "id": "css", "label": "CSS", "iconSrc": "/assets/arsenal/css.svg" },
  // { "id": "ollama", "label": "OLLAMA", "iconSrc": "/assets/arsenal/ollama.svg" },
  // { "id": "html", "label": "HTML", "iconSrc": "/assets/arsenal/html.svg" },
  
];

const getArsenal = async () => ARSENAL;

export const arsenalApi = {
  getArsenal,
};
