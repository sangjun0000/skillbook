#!/usr/bin/env node
// Usage: node track-usage.mjs <skill-id>
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, "..", "skills");
const statsPath = join(homedir(), ".claude", "skillbook-stats.json");
const skillId = process.argv[2];

if (!skillId) {
  console.error("Usage: node track-usage.mjs <skill-id>");
  process.exit(1);
}

// Build valid skill set from skills/ directory (only dirs with SKILL.md)
const validSkills = new Set(
  readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(skillsDir, d.name, "SKILL.md")))
    .map(d => d.name)
);

// Resolve skill-id: exact match, or try fuzzy correction
let resolvedId = null;
if (validSkills.has(skillId)) {
  resolvedId = skillId;
} else {
  // Try simple matching: startsWith, includes, or valid skill includes input
  const candidates = [...validSkills].filter(
    v => v.startsWith(skillId) || v.includes(skillId) || skillId.includes(v)
  );
  if (candidates.length === 1) {
    resolvedId = candidates[0];
    console.error(`Corrected: "${skillId}" → "${resolvedId}"`);
  } else if (candidates.length > 1) {
    console.error(`Ambiguous skill "${skillId}", candidates: ${candidates.join(", ")}. Skipping.`);
  } else {
    console.error(`Unknown skill: "${skillId}", skipping.`);
  }
}

// Load stats
let stats = {};
if (existsSync(statsPath)) {
  stats = JSON.parse(readFileSync(statsPath, "utf8"));
}

// Clean phantom entries
const phantoms = Object.keys(stats).filter(k => !validSkills.has(k));
if (phantoms.length > 0) {
  for (const p of phantoms) delete stats[p];
  console.error(`Cleaned ${phantoms.length} phantom entries: ${phantoms.join(", ")}`);
}

// Record usage if resolved
if (resolvedId) {
  const today = new Date().toISOString().split("T")[0];
  if (!stats[resolvedId]) {
    stats[resolvedId] = { count: 0, lastUsed: null, history: [] };
  }
  stats[resolvedId].count++;
  stats[resolvedId].lastUsed = today;
  stats[resolvedId].history.unshift(today);
  if (stats[resolvedId].history.length > 90) {
    stats[resolvedId].history = stats[resolvedId].history.slice(0, 90);
  }
  console.log(`Tracked: ${resolvedId} (${stats[resolvedId].count} total)`);
}

// Always write back (to persist cleanup even if no new tracking)
writeFileSync(statsPath, JSON.stringify(stats, null, 2) + "\n");
