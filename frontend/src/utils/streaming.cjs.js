function safeJsonParse(rawInput) {
  if (!rawInput) return null;
  try {
    return JSON.parse(rawInput);
  } catch (e) {}
  let clean = rawInput.replace(/^```(?:json)?\s*|```\s*$/g, "");
  try {
    return JSON.parse(clean);
  } catch (e) {}
  // Extract and parse the last JSON block from the string
  const jsonBlocks = [];
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
}
module.exports = { safeJsonParse };
