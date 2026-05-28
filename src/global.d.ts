declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';

// Allow importing json files without errors
declare module '*.json';

// Provide a minimal JSX namespace fallback if needed (should be satisfied by @types/react)
declare namespace JSX {
  interface IntrinsicElements { [elemName: string]: any }
}
