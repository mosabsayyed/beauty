#!/usr/bin/env node
import fs from 'fs';

const PACK_PATH = process.env.PACK_PATH || '.ai/coding_agent_prompt_pack.jsonl';
const PROMPT_ID = process.env.PROMPT_ID || '';
const REPO = process.env.REPO || '';
const BRANCH = process.env.BRANCH || '';
const ISSUE = process.env.ISSUE || '';

function loadPack(p) {
  const text = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
  return text.map(line => JSON.parse(line));
}

function formatPrompt(task, inputs) {
  const header = `Role: ${task.role}
Title: ${task.title} (${task.id})
Objective: ${task.objective}`;

  const ctx = `Context:\n${JSON.stringify(task.context, null, 2)}`;

  const filledInputs = {
    ...task.inputs,
    repo: inputs.repo || task.inputs.repo || '',
    branch: inputs.branch || task.inputs.branch || '',
    issue_ref: inputs.issue || task.inputs.issue_ref || ''
  };

  const inputsBlock = `Inputs:\n${JSON.stringify(filledInputs, null, 2)}`;
  const instructions = `Instructions:\n- ${task.instructions.join('\n- ')}`;
  const outputFmt = `Output format:\n${JSON.stringify(task.output_format, null, 2)}`;

  return `${header}\n\n${ctx}\n\n${inputsBlock}\n\n${instructions}\n\n${outputFmt}\n`;
}

function main() {
  const pack = loadPack(PACK_PATH);
  const task = pack.find(t => t.id === PROMPT_ID);
  if (!task) {
    console.error(`❌ Prompt ID not found: ${PROMPT_ID}`);
    console.error(`Available IDs: ${pack.map(p => p.id).join(', ')}`);
    process.exit(1);
  }
  const prompt = formatPrompt(task, { repo: REPO, branch: BRANCH, issue: ISSUE });
  process.stdout.write(prompt);
}

main();
