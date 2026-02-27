#!/usr/bin/env node
// One-time script: extract skills-meta.json from data.ts
// Uses dynamic import with --experimental-strip-types to load TypeScript directly
import { writeFileSync } from "fs";
import { join } from "path";

const siteRoot = join(import.meta.dirname, "..", "..", "skillbook-site");
const dataPath = join(siteRoot, "app", "data.ts");

const { ui, categories, skills } = await import(`file:///${dataPath.replace(/\\/g, "/")}`);

const outputPath = join(import.meta.dirname, "skills-meta.json");
writeFileSync(outputPath, JSON.stringify({ ui, categories, skills }, null, 2) + "\n");

console.log(
  `Extracted: ${categories.length} categories, ${skills.length} skills`
);
console.log(`Output: ${outputPath}`);
