#!/usr/bin/env node
// Usage: node track-usage.mjs <skill-id>
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const statsPath = join(homedir(), ".claude", "skillbook-stats.json");
const skillId = process.argv[2];

if (!skillId) {
  console.error("Usage: node track-usage.mjs <skill-id>");
  process.exit(1);
}

let stats = {};
if (existsSync(statsPath)) {
  stats = JSON.parse(readFileSync(statsPath, "utf8"));
}

const today = new Date().toISOString().split("T")[0];
if (!stats[skillId]) {
  stats[skillId] = { count: 0, lastUsed: null, history: [] };
}
stats[skillId].count++;
stats[skillId].lastUsed = today;
stats[skillId].history.unshift(today);
if (stats[skillId].history.length > 90) {
  stats[skillId].history = stats[skillId].history.slice(0, 90);
}

writeFileSync(statsPath, JSON.stringify(stats, null, 2) + "\n");
console.log(`Tracked: ${skillId} (${stats[skillId].count} total)`);
