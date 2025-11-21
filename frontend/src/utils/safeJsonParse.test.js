const { safeJsonParse } = require('./streaming.cjs.js');
const fs = require('fs');

const logPath = '/home/mosab/projects/chatmodule/backend/logs/chat_debug_250.json';
const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));

// Find the llm_response event
const llmEvent = log.events.find(e => e.event_type === 'llm_response');
if (!llmEvent) throw new Error('No llm_response event found');

const rawData = llmEvent.data;
let rawJsonBlock = '';

// The canonical payload is always a string containing a JSON block
if (typeof rawData === 'string') {
  // Extract the first JSON block from the string
  const start = rawData.indexOf('{');
  const end = rawData.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    rawJsonBlock = rawData.substring(start, end + 1);
  }
} else {
  // If not a string, fallback to stringifying the object
  rawJsonBlock = JSON.stringify(rawData);
}

try {
  const parsed = safeJsonParse(rawJsonBlock);
  if (parsed) {
    console.log('Parsed answer:', parsed.answer);
    console.log('Parsed memory_process.thought_trace:', parsed.memory_process && parsed.memory_process.thought_trace);
  } else {
    console.log('No parsed result.');
  }
} catch (e) {
  console.error('safeJsonParse failed:', e);
}
