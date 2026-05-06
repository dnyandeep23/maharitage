export const MODEL_CHAIN = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
] as const;

export const getModelChain = () => [...MODEL_CHAIN];
