import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  generateDataTs,
  bumpVersion,
  updatePluginJson,
  updateMarketplaceJson,
  stripFrontmatter,
  generateIndexMd,
} from "../sync-engine.mjs";

// ── Minimal meta fixture ────────────────────────────────────────────────────

const MINIMAL_META = {
  ui: {
    ko: {
      title: "Skill Book",
      subtitle_tpl: "{count} Skills · {steps} Process Steps · {lines} Lines of Knowledge",
      toc: "목차",
      all: "전체",
      roleTitle: "역할 정의",
      principlesTitle: "핵심 원칙",
      metricsTitle: "스킬 지표",
      antiTitle: "안티패턴",
      processSteps: "프로세스",
      principles: "원칙",
      lines: "라인",
      welcomeHeading: "Skill Book",
      welcomeDesc: "바이브코딩 시 AI가 자동으로 활용하는\n전문가 지식 라이브러리.\n\n왼쪽 목차에서 스킬을 선택하면\n이 페이지에서 상세 내용을 볼 수 있습니다.",
      footer: "Powered by Claude Code + bkit",
      skills: "skills",
      heroDesc: "Claude Code를 위한 전문가 스킬 컬렉션",
      installTitle: "설치하기",
      installDesc: "Claude Code에서 2줄이면 끝",
      step1Label: "마켓플레이스 등록",
      step1Cmd: "/plugin marketplace add sangjun0000/skillbook",
      step2Label: "플러그인 설치",
      step2Cmd: "/plugin install skillbook",
      step3Label: "스킬 사용",
      step3Cmd: "/skillbook:market-research",
      copied: "복사됨!",
      browseSkills: "스킬 둘러보기 ↓",
      howToUse: "사용 예시",
    },
    en: {
      title: "Skill Book",
      subtitle_tpl: "{count} Skills · {steps} Process Steps · {lines} Lines of Knowledge",
      toc: "Table of Contents",
      all: "All",
      roleTitle: "Role Definition",
      principlesTitle: "Core Principles",
      metricsTitle: "Skill Metrics",
      antiTitle: "Anti-Patterns",
      processSteps: "Process",
      principles: "Principles",
      lines: "Lines",
      welcomeHeading: "Skill Book",
      welcomeDesc: "An expert knowledge library\nautomatically used by AI during vibe coding.\n\nSelect a skill from the table of contents\nto view its details on this page.",
      footer: "Powered by Claude Code + bkit",
      skills: "skills",
      heroDesc: "A curated collection of expert skills for Claude Code",
      installTitle: "Install",
      installDesc: "Just 2 lines in Claude Code",
      step1Label: "Add marketplace",
      step1Cmd: "/plugin marketplace add sangjun0000/skillbook",
      step2Label: "Install plugin",
      step2Cmd: "/plugin install skillbook",
      step3Label: "Use skills",
      step3Cmd: "/skillbook:market-research",
      copied: "Copied!",
      browseSkills: "Browse Skills ↓",
      howToUse: "Usage Example",
    },
  },
  categories: [
    {
      id: "business",
      label: "Business",
      icon: "📊",
      description: {
        ko: "시장조사, 경쟁 분석, SaaS 전략",
        en: "Market Research, Competitor Analysis, SaaS Strategy",
      },
    },
  ],
  skills: [
    {
      id: "market-research",
      name: { ko: "시장조사 전문가", en: "Market Research Expert" },
      description: {
        ko: "데이터 기반 시장 분석과 기회 발굴을 통해 제품 전략의 근거를 만드는 전문 스킬",
        en: "A specialized skill for building product strategy foundations through data-driven market analysis and opportunity discovery",
      },
      category: "business",
      role: {
        ko: "당신은 시장조사 및 시장 분석 분야의 시니어 전문가입니다.",
        en: "You are a senior expert in market research and analysis.",
      },
      principles: [
        { ko: "데이터 우선(Data-First): 추측이 아닌 검증 가능한 데이터에 기반하여 판단한다", en: "Data-First: Make decisions based on verifiable data, not assumptions" },
      ],
      processSteps: 17,
      antiPatterns: [
        { ko: "확증 편향: 원하는 결론에 맞는 데이터만 선택적으로 수집", en: "Confirmation Bias: Selectively collecting data that fits desired conclusions" },
      ],
      lineCount: 166,
      path: "business/market-research.md",
    },
  ],
};

// ── generateDataTs ──────────────────────────────────────────────────────────

describe("generateDataTs", () => {
  test("output starts with type definitions", () => {
    const result = generateDataTs(MINIMAL_META);
    assert.ok(result.startsWith('export type Lang = "ko" | "en";'), "must start with Lang type");
  });

  test("output contains Skill interface", () => {
    const result = generateDataTs(MINIMAL_META);
    assert.ok(result.includes("export interface Skill {"), "must include Skill interface");
    assert.ok(result.includes("id: string;"), "must include id field");
    assert.ok(result.includes("lineCount: number;"), "must include lineCount field");
    assert.ok(result.includes("path: string;"), "must include path field");
  });

  test("output contains Category interface", () => {
    const result = generateDataTs(MINIMAL_META);
    assert.ok(result.includes("export interface Category {"), "must include Category interface");
  });

  test("output contains ui const", () => {
    const result = generateDataTs(MINIMAL_META);
    assert.ok(result.includes("export const ui: Record<Lang, Record<string, string>> = {"), "must include ui const");
    assert.ok(result.includes("ko: {"), "must include ko locale");
    assert.ok(result.includes("en: {"), "must include en locale");
  });

  test("output contains categories const", () => {
    const result = generateDataTs(MINIMAL_META);
    assert.ok(result.includes("export const categories: Category[] = ["), "must include categories const");
    assert.ok(result.includes('id: "business"'), "must include business category");
  });

  test("output contains skills const", () => {
    const result = generateDataTs(MINIMAL_META);
    assert.ok(result.includes("export const skills: Skill[] = ["), "must include skills const");
    assert.ok(result.includes('id: "market-research"'), "must include market-research skill");
  });

  test("skills array ends with ];", () => {
    const result = generateDataTs(MINIMAL_META);
    assert.ok(result.trimEnd().endsWith("];"), "file must end with ];");
  });

  test("skill object has correct field order", () => {
    const result = generateDataTs(MINIMAL_META);
    const idIdx = result.indexOf('id: "market-research"');
    const nameIdx = result.indexOf("name: {", idIdx);
    const descIdx = result.indexOf("description: {", nameIdx);
    const catIdx = result.indexOf("category:", descIdx);
    const roleIdx = result.indexOf("role: {", catIdx);
    const princIdx = result.indexOf("principles: [", roleIdx);
    const stepsIdx = result.indexOf("processSteps:", princIdx);
    const antiIdx = result.indexOf("antiPatterns: [", stepsIdx);
    const lineIdx = result.indexOf("lineCount:", antiIdx);
    const pathIdx = result.indexOf("path:", lineIdx);

    assert.ok(idIdx < nameIdx, "id before name");
    assert.ok(nameIdx < descIdx, "name before description");
    assert.ok(descIdx < catIdx, "description before category");
    assert.ok(catIdx < roleIdx, "category before role");
    assert.ok(roleIdx < princIdx, "role before principles");
    assert.ok(princIdx < stepsIdx, "principles before processSteps");
    assert.ok(stepsIdx < antiIdx, "processSteps before antiPatterns");
    assert.ok(antiIdx < lineIdx, "antiPatterns before lineCount");
    assert.ok(lineIdx < pathIdx, "lineCount before path");
  });

  test("string values use double-quote escaping", () => {
    const result = generateDataTs(MINIMAL_META);
    // No unescaped backtick templates should exist in output
    assert.ok(!result.includes("${"), "must not use template literals");
  });

  test("category uses single-line format", () => {
    const result = generateDataTs(MINIMAL_META);
    // Category should be on one line: { id: "business", label: ...
    const catStart = result.indexOf('{ id: "business"');
    assert.ok(catStart >= 0, "category must use single-line object format");
  });
});

// ── bumpVersion ─────────────────────────────────────────────────────────────

describe("bumpVersion", () => {
  test("bumps patch version", () => {
    assert.equal(bumpVersion("1.2.3", "patch"), "1.2.4");
  });

  test("bumps minor version and resets patch", () => {
    assert.equal(bumpVersion("1.2.3", "minor"), "1.3.0");
  });

  test("bumps major version and resets minor and patch", () => {
    assert.equal(bumpVersion("1.2.3", "major"), "2.0.0");
  });

  test("handles zero versions", () => {
    assert.equal(bumpVersion("0.0.1", "patch"), "0.0.2");
    assert.equal(bumpVersion("0.0.9", "minor"), "0.1.0");
    assert.equal(bumpVersion("0.9.9", "major"), "1.0.0");
  });

  test("throws on invalid type", () => {
    assert.throws(() => bumpVersion("1.0.0", "invalid"), /patch|minor|major/i);
  });

  test("handles 3.2.0 -> 3.2.1 patch", () => {
    assert.equal(bumpVersion("3.2.0", "patch"), "3.2.1");
  });

  test("handles 3.2.0 -> 3.3.0 minor", () => {
    assert.equal(bumpVersion("3.2.0", "minor"), "3.3.0");
  });
});

// ── updatePluginJson ─────────────────────────────────────────────────────────

describe("updatePluginJson", () => {
  const original = {
    name: "skillbook",
    version: "3.2.0",
    description: "48 expert skills for Claude Code — 13 workflow + 35 domain",
    author: { name: "sangjun0000" },
    repository: "https://github.com/sangjun0000/skillbook",
    homepage: "https://skillbook-site.vercel.app",
    license: "MIT",
  };

  test("updates version", () => {
    const result = updatePluginJson(original, "3.2.1", 48, 13, 35);
    assert.equal(result.version, "3.2.1");
  });

  test("updates description with correct counts", () => {
    const result = updatePluginJson(original, "3.3.0", 50, 14, 36);
    assert.ok(result.description.includes("50"), "total count in description");
    assert.ok(result.description.includes("14"), "workflow count in description");
    assert.ok(result.description.includes("36"), "domain count in description");
  });

  test("preserves other fields unchanged", () => {
    const result = updatePluginJson(original, "3.2.1", 48, 13, 35);
    assert.equal(result.name, "skillbook");
    assert.equal(result.author.name, "sangjun0000");
    assert.equal(result.repository, "https://github.com/sangjun0000/skillbook");
    assert.equal(result.license, "MIT");
  });

  test("does not mutate original", () => {
    updatePluginJson(original, "9.9.9", 99, 9, 90);
    assert.equal(original.version, "3.2.0");
  });
});

// ── updateMarketplaceJson ────────────────────────────────────────────────────

describe("updateMarketplaceJson", () => {
  const original = {
    $schema: "https://anthropic.com/claude-code/marketplace.schema.json",
    name: "skillbook-marketplace",
    version: "3.2.0",
    description: "old description",
    owner: { name: "sangjun0000", url: "https://github.com/sangjun0000" },
    plugins: [
      {
        name: "skillbook",
        description: "old plugin description",
        version: "3.2.0",
        author: { name: "sangjun0000" },
        repository: "https://github.com/sangjun0000/skillbook",
        source: { source: "url", url: "https://github.com/sangjun0000/skillbook.git" },
        category: "development",
        keywords: ["skills"],
      },
    ],
  };

  test("updates root version", () => {
    const result = updateMarketplaceJson(original, "3.2.1", 48, 13, 35);
    assert.equal(result.version, "3.2.1");
  });

  test("updates plugins[0].version", () => {
    const result = updateMarketplaceJson(original, "3.2.1", 48, 13, 35);
    assert.equal(result.plugins[0].version, "3.2.1");
  });

  test("updates root description", () => {
    const result = updateMarketplaceJson(original, "3.3.0", 50, 14, 36);
    assert.ok(result.description.includes("50"), "total count in root description");
  });

  test("updates plugins[0].description", () => {
    const result = updateMarketplaceJson(original, "3.3.0", 50, 14, 36);
    assert.ok(result.plugins[0].description.includes("50"), "total in plugin description");
  });

  test("preserves other root fields", () => {
    const result = updateMarketplaceJson(original, "3.2.1", 48, 13, 35);
    assert.equal(result.name, "skillbook-marketplace");
    assert.equal(result.$schema, "https://anthropic.com/claude-code/marketplace.schema.json");
    assert.equal(result.owner.name, "sangjun0000");
  });

  test("preserves plugins[0] non-version/description fields", () => {
    const result = updateMarketplaceJson(original, "3.2.1", 48, 13, 35);
    assert.equal(result.plugins[0].name, "skillbook");
    assert.equal(result.plugins[0].category, "development");
    assert.deepEqual(result.plugins[0].keywords, ["skills"]);
  });

  test("does not mutate original", () => {
    updateMarketplaceJson(original, "9.9.9", 99, 9, 90);
    assert.equal(original.version, "3.2.0");
    assert.equal(original.plugins[0].version, "3.2.0");
  });
});

// ── stripFrontmatter ─────────────────────────────────────────────────────────

describe("stripFrontmatter", () => {
  test("removes YAML frontmatter", () => {
    const input = `---\nname: test\ncategory: dev\n---\n# Heading\n\nBody text`;
    const result = stripFrontmatter(input);
    assert.equal(result, "# Heading\n\nBody text");
  });

  test("removes leading blank lines after frontmatter", () => {
    const input = `---\nname: test\n---\n\n\n# Heading`;
    const result = stripFrontmatter(input);
    assert.equal(result, "# Heading");
  });

  test("returns content unchanged when no frontmatter", () => {
    const input = "# Heading\n\nBody text";
    const result = stripFrontmatter(input);
    assert.equal(result, input);
  });

  test("returns content unchanged when frontmatter is not closed", () => {
    const input = "---\nname: test\n# Heading";
    const result = stripFrontmatter(input);
    assert.equal(result, input);
  });

  test("handles frontmatter with complex values", () => {
    const input = `---\nname: test\ndescription: "has --- dashes"\nallowed-tools:\n  - Read\n  - Write\n---\nBody`;
    const result = stripFrontmatter(input);
    assert.equal(result, "Body");
  });
});

// ── generateIndexMd ──────────────────────────────────────────────────────────

describe("generateIndexMd", () => {
  const indexMeta = {
    categories: [
      { id: "business", label: "Business", icon: "📊", description: { ko: "비즈니스", en: "Business" } },
      { id: "dev", label: "Development", icon: "💻", description: { ko: "개발", en: "Dev" } },
      { id: "meta", label: "Meta", icon: "🔧", description: { ko: "메타", en: "Meta" } },
    ],
    skills: [
      { id: "market-research", category: "business", description: { ko: "시장조사 스킬", en: "Market research" }, name: { ko: "시장조사", en: "Market Research" } },
      { id: "frontend", category: "dev", description: { ko: "프론트엔드 개발", en: "Frontend dev" }, name: { ko: "프론트엔드", en: "Frontend" } },
      { id: "documentation", category: "meta", description: { ko: "문서화", en: "Documentation" }, name: { ko: "문서화", en: "Documentation" } },
      { id: "health", category: "meta", description: { ko: "헬스체크", en: "Health check" }, name: { ko: "헬스", en: "Health" } },
      { id: "manage", category: "meta", description: { ko: "관리", en: "Manage" }, name: { ko: "관리", en: "Manage" } },
      { id: "sync", category: "meta", description: { ko: "동기화", en: "Sync" }, name: { ko: "동기화", en: "Sync" } },
    ],
  };

  test("starts with header", () => {
    const result = generateIndexMd(indexMeta);
    assert.ok(result.startsWith("# Skill Book Index"), "must start with header");
  });

  test("contains category headings", () => {
    const result = generateIndexMd(indexMeta);
    assert.ok(result.includes("## Business"), "must include Business category");
    assert.ok(result.includes("## Development"), "must include Development category");
    assert.ok(result.includes("## Meta"), "must include Meta category");
  });

  test("formats skills as ### category/id.md", () => {
    const result = generateIndexMd(indexMeta);
    assert.ok(result.includes("### business/market-research.md"), "must format skill path");
    assert.ok(result.includes("### dev/frontend.md"), "must format dev skill path");
  });

  test("uses Korean description", () => {
    const result = generateIndexMd(indexMeta);
    assert.ok(result.includes("시장조사 스킬"), "must include Korean description");
    assert.ok(result.includes("프론트엔드 개발"), "must include Korean description for frontend");
  });

  test("excludes meta automation skills (health, manage, sync)", () => {
    const result = generateIndexMd(indexMeta);
    assert.ok(!result.includes("### meta/health.md"), "must exclude health");
    assert.ok(!result.includes("### meta/manage.md"), "must exclude manage");
    assert.ok(!result.includes("### meta/sync.md"), "must exclude sync");
  });

  test("includes non-automation meta skills", () => {
    const result = generateIndexMd(indexMeta);
    assert.ok(result.includes("### meta/documentation.md"), "must include documentation");
  });

  test("skill count matches (excluding automation)", () => {
    const result = generateIndexMd(indexMeta);
    const skillHeaders = result.split("\n").filter(l => l.startsWith("### "));
    assert.equal(skillHeaders.length, 3, "must have 3 skills (6 total - 3 automation)");
  });
});
