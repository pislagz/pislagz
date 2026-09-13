declare module "*.css";
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "@shared/styles/globals.css";
declare module "@shared/styles/tokens.css";
