import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

// Read category mapping from skills-meta.json
const meta = JSON.parse(
  readFileSync(join(import.meta.dirname, "skills-meta.json"), "utf8")
);
const categoryMap = {};
for (const skill of meta.skills) {
  categoryMap[skill.id] = skill.category;
}

const skillsDir = join(import.meta.dirname, "..", "skills");
const dirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let updated = 0;
let skipped = 0;
let warned = 0;

for (const dir of dirs) {
  const filePath = join(skillsDir, dir, "SKILL.md");
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    console.warn(`WARNING: ${dir}/SKILL.md not found`);
    warned++;
    continue;
  }

  const category = categoryMap[dir];
  if (!category) {
    console.warn(`WARNING: No category mapping for "${dir}"`);
    warned++;
    continue;
  }

  if (content.includes("\ncategory:")) {
    console.log(`SKIP: ${dir} (already has category)`);
    skipped++;
    continue;
  }

  // Insert category: after name: line in frontmatter
  const newContent = content.replace(
    /^(name: .+)$/m,
    `$1\ncategory: ${category}`
  );

  if (newContent === content) {
    console.warn(`WARNING: Could not find name: line in ${dir}`);
    warned++;
    continue;
  }

  writeFileSync(filePath, newContent);
  updated++;
  console.log(`OK: ${dir} -> ${category}`);
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${warned} warnings`);
