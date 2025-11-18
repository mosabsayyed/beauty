export const cleanJsonString = (str: string) => {
  try {
    return JSON.parse(`"${str}"`);
  } catch (e) {
    return str.replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
};

// Parse a chunk containing one or more SSE messages separated by double newlines
export const parseSseMessages = (chunk: string): string[] => {
  // Split on double newline
  const parts = chunk.split(/\r?\n\r?\n/);
  return parts.filter(Boolean);
};
