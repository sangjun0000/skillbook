/**
 * sync-engine.mjs
 *
 * Reads tools/skills-meta.json and generates skillbook-site/app/data.ts
 * in the exact format expected by the website.
 *
 * Exported functions (for testing):
 *   generateDataTs(meta)
 *   bumpVersion(version, type)
 *   updatePluginJson(original, newVersion, total, workflow, domain)
 *   updateMarketplaceJson(original, newVersion, total, workflow, domain)
 *
 * CLI usage:
 *   node tools/sync-engine.mjs [--bump patch|minor|major]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths relative to this file (tools/)
const PLUGIN_ROOT = resolve(__dirname, "..");
const META_PATH = resolve(__dirname, "skills-meta.json");
const DATA_TS_PATH = resolve(PLUGIN_ROOT, "../skillbook-site/app/data.ts");
const PLUGIN_JSON_PATH = resolve(PLUGIN_ROOT, ".claude-plugin/plugin.json");
const MARKETPLACE_JSON_PATH = resolve(PLUGIN_ROOT, ".claude-plugin/marketplace.json");
const SKILLS_DIR = resolve(PLUGIN_ROOT, "skills");

// Workflow skill IDs — these are behavioral rule skills (not deep domain)
const WORKFLOW_IDS = new Set([
  "saas-strategy",
  "ai-agent",
  "clean-architecture",
  "frontend",
  "css-animation",
  "testing",
  "security",
  "data-visualization",
  "feature-spec",
  "growth-hack",
  "onboarding",
  "app-store-optimization",
  "brand-identity",
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Escape a string value for TypeScript source output.
 * Wraps in double quotes and escapes internal double quotes.
 */
function tsStr(value) {
  // Escape backslashes first, then double quotes, then newlines
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

/**
 * Render a bilingual { ko, en } object as a TypeScript object literal.
 * Uses a two-property format on one line.
 */
function bilingualOneLine(obj) {
  return `{ ko: ${tsStr(obj.ko)}, en: ${tsStr(obj.en)} }`;
}

/**
 * Render a bilingual { ko, en } object split across multiple lines
 * with the given indentation prefix.
 */
function bilingualMultiLine(obj, indent) {
  return [
    `{`,
    `${indent}  ko: ${tsStr(obj.ko)},`,
    `${indent}  en: ${tsStr(obj.en)},`,
    `${indent}}`,
  ].join("\n");
}

/**
 * Count the actual lines in a SKILL.md file for a given skill path.
 * Falls back to the stored lineCount if the file does not exist.
 */
function countSkillLines(skillPath, fallback) {
  const fullPath = resolve(SKILLS_DIR, skillPath.replace(/\.md$/, ""), "SKILL.md");
  if (!existsSync(fullPath)) return fallback;
  try {
    const content = readFileSync(fullPath, "utf8");
    return content.split("\n").length;
  } catch {
    return fallback;
  }
}

// ── Core exported functions ──────────────────────────────────────────────────

/**
 * Generate data.ts TypeScript source from the meta JSON object.
 * Matches the exact format of the current skillbook-site/app/data.ts.
 */
export function generateDataTs(meta) {
  const lines = [];

  // ── Type definitions ──────────────────────────────────────────────────────
  lines.push(`export type Lang = "ko" | "en";`);
  lines.push(``);
  lines.push(`export interface Skill {`);
  lines.push(`  id: string;`);
  lines.push(`  name: { ko: string; en: string };`);
  lines.push(`  description: { ko: string; en: string };`);
  lines.push(`  category: string;`);
  lines.push(`  role: { ko: string; en: string };`);
  lines.push(`  principles: { ko: string; en: string }[];`);
  lines.push(`  processSteps: number;`);
  lines.push(`  antiPatterns: { ko: string; en: string }[];`);
  lines.push(`  lineCount: number;`);
  lines.push(`  path: string;`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export interface Category {`);
  lines.push(`  id: string;`);
  lines.push(`  label: string;`);
  lines.push(`  icon: string;`);
  lines.push(`  description: { ko: string; en: string };`);
  lines.push(`}`);
  lines.push(``);

  // ── ui const ──────────────────────────────────────────────────────────────
  lines.push(`export const ui: Record<Lang, Record<string, string>> = {`);
  for (const [lang, dict] of Object.entries(meta.ui)) {
    lines.push(`  ${lang}: {`);
    for (const [key, value] of Object.entries(dict)) {
      lines.push(`    ${key}: ${tsStr(value)},`);
    }
    lines.push(`  },`);
  }
  lines.push(`};`);
  lines.push(``);

  // ── categories const ──────────────────────────────────────────────────────
  lines.push(`export const categories: Category[] = [`);
  for (const cat of meta.categories) {
    const desc = bilingualOneLine(cat.description);
    lines.push(`  { id: ${tsStr(cat.id)}, label: ${tsStr(cat.label)}, icon: ${tsStr(cat.icon)}, description: ${desc} },`);
  }
  lines.push(`];`);
  lines.push(``);

  // ── skills const ──────────────────────────────────────────────────────────
  lines.push(`export const skills: Skill[] = [`);
  for (const skill of meta.skills) {
    lines.push(`  {`);
    lines.push(`    id: ${tsStr(skill.id)},`);
    lines.push(`    name: ${bilingualOneLine(skill.name)},`);

    // description — always multi-line (long strings)
    lines.push(`    description: {`);
    lines.push(`      ko: ${tsStr(skill.description.ko)},`);
    lines.push(`      en: ${tsStr(skill.description.en)},`);
    lines.push(`    },`);

    lines.push(`    category: ${tsStr(skill.category)},`);

    // role — always multi-line
    lines.push(`    role: {`);
    lines.push(`      ko: ${tsStr(skill.role.ko)},`);
    lines.push(`      en: ${tsStr(skill.role.en)},`);
    lines.push(`    },`);

    // principles — array of bilingual one-liners
    lines.push(`    principles: [`);
    for (const p of skill.principles) {
      lines.push(`      ${bilingualOneLine(p)},`);
    }
    lines.push(`    ],`);

    lines.push(`    processSteps: ${skill.processSteps},`);

    // antiPatterns — array of bilingual one-liners
    lines.push(`    antiPatterns: [`);
    for (const a of skill.antiPatterns) {
      lines.push(`      ${bilingualOneLine(a)},`);
    }
    lines.push(`    ],`);

    lines.push(`    lineCount: ${skill.lineCount},`);
    lines.push(`    path: ${tsStr(skill.path)},`);
    lines.push(`  },`);
  }
  lines.push(`];`);

  return lines.join("\n");
}

/**
 * Bump a semver version string by patch, minor, or major.
 */
export function bumpVersion(version, type) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3) throw new Error(`Invalid semver: ${version}`);

  if (type === "patch") {
    parts[2] += 1;
  } else if (type === "minor") {
    parts[1] += 1;
    parts[2] = 0;
  } else if (type === "major") {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else {
    throw new Error(`Invalid bump type: "${type}". Must be one of: patch, minor, major`);
  }

  return parts.join(".");
}

/**
 * Build the description string used in plugin.json and marketplace.json.
 */
function buildDescription(total, workflow, domain, short = false) {
  if (short) {
    return `${total} skills: ${workflow} workflow (behavioral rules that change Claude's actions) + ${domain} deep domain (specialized knowledge with 2026 best practices).`;
  }
  return `${total} expert skills for Claude Code — ${workflow} workflow skills (behavioral rules) + ${domain} deep domain skills (specialized knowledge with 2026 best practices)`;
}

/**
 * Return an updated copy of plugin.json with new version and description.
 */
export function updatePluginJson(original, newVersion, total, workflow, domain) {
  return {
    ...original,
    version: newVersion,
    description: buildDescription(total, workflow, domain),
  };
}

/**
 * Return an updated copy of marketplace.json with new version and description
 * at both root level and plugins[0].
 */
export function updateMarketplaceJson(original, newVersion, total, workflow, domain) {
  const updated = {
    ...original,
    version: newVersion,
    description: buildDescription(total, workflow, domain),
    plugins: original.plugins.map((plugin, i) => {
      if (i !== 0) return { ...plugin };
      return {
        ...plugin,
        version: newVersion,
        description: buildDescription(total, workflow, domain, true),
      };
    }),
  };
  return updated;
}

// ── CLI entry point ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const bumpIdx = args.indexOf("--bump");
  const bumpType = bumpIdx >= 0 ? args[bumpIdx + 1] : null;

  if (bumpType && !["patch", "minor", "major"].includes(bumpType)) {
    console.error(`Invalid bump type: "${bumpType}". Use patch, minor, or major.`);
    process.exit(1);
  }

  // 1. Read skills-meta.json
  console.log("Reading skills-meta.json...");
  const meta = JSON.parse(readFileSync(META_PATH, "utf8"));

  // 2. Update lineCount from actual SKILL.md files
  console.log("Counting lines from SKILL.md files...");
  for (const skill of meta.skills) {
    skill.lineCount = countSkillLines(skill.path, skill.lineCount);
  }

  // 3. Generate data.ts
  console.log(`Generating ${DATA_TS_PATH}...`);
  const tsContent = generateDataTs(meta);
  writeFileSync(DATA_TS_PATH, tsContent, "utf8");
  console.log(`Written: ${DATA_TS_PATH}`);

  // 4. Optionally bump versions
  if (bumpType) {
    // Read current versions
    const pluginJson = JSON.parse(readFileSync(PLUGIN_JSON_PATH, "utf8"));
    const marketplaceJson = JSON.parse(readFileSync(MARKETPLACE_JSON_PATH, "utf8"));

    const currentVersion = pluginJson.version;
    const newVersion = bumpVersion(currentVersion, bumpType);

    // Count workflow vs domain skills
    const workflowCount = meta.skills.filter((s) => WORKFLOW_IDS.has(s.id)).length;
    const domainCount = meta.skills.length - workflowCount;
    const total = meta.skills.length;

    console.log(`Bumping version: ${currentVersion} -> ${newVersion} (${bumpType})`);
    console.log(`Skills: ${total} total, ${workflowCount} workflow, ${domainCount} domain`);

    const updatedPlugin = updatePluginJson(pluginJson, newVersion, total, workflowCount, domainCount);
    const updatedMarketplace = updateMarketplaceJson(marketplaceJson, newVersion, total, workflowCount, domainCount);

    writeFileSync(PLUGIN_JSON_PATH, JSON.stringify(updatedPlugin, null, 2) + "\n", "utf8");
    console.log(`Written: ${PLUGIN_JSON_PATH}`);

    writeFileSync(MARKETPLACE_JSON_PATH, JSON.stringify(updatedMarketplace, null, 2) + "\n", "utf8");
    console.log(`Written: ${MARKETPLACE_JSON_PATH}`);
  }

  console.log("Done.");
}

// Only run as CLI if this file is the entry point
const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
