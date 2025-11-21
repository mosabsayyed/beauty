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

/**
 * Robustly parses JSON from an LLM response, handling Markdown wrapping
 * and potential pre/post-amble text.
 */
export const safeJsonParse = (rawInput: string) => {
  if (!rawInput) return null;

  // 1. Try standard parse first (Happy Path)
  try {
    return JSON.parse(rawInput);
  } catch (e) {}

  // 2. Strip Markdown Code Blocks (```json ... ```)
  let clean = rawInput.replace(/^```(?:json)?\s*|```\s*$/g, "");
  try {
    return JSON.parse(clean);
  } catch (e) {}

  // 3. Extract and parse the last JSON block from the string
  // This ensures we get the canonical assistant payload, not tool metadata or config blocks.
  const jsonBlocks: string[] = [];
  const regex = /{[\s\S]*?}/g;
  let match;
  while ((match = regex.exec(rawInput)) !== null) {
    jsonBlocks.push(match[0]);
  }
  if (jsonBlocks.length > 0) {
    const block = jsonBlocks[jsonBlocks.length - 1];
    try {
      return JSON.parse(block);
    } catch (e) {
      // Try tolerant sanitization
      try {
        let tolerant = block;
        tolerant = tolerant.replace(/,\s*([}\]])/g, '$1');
        tolerant = tolerant.replace(/([,{\[]\s*)([A-Za-z0-9_\$@\-]+)\s*:/g, '$1"$2":');
        tolerant = tolerant.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
        return JSON.parse(tolerant);
      } catch (e2) {
        // Parsing failed
      }
    }
  }

  throw new Error('No valid JSON object found in response.');
};
