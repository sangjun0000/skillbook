---
name: project-guide
category: meta
description: "프로젝트 시작, 앱/웹/서비스 생성, 기술 스택 선택, '만들어줘' 요청 시 자동 활성화. Use this whenever the user wants to create, build, or start anything — web app, mobile app, SaaS, dashboard, blog, landing page, API, or any software project. Also triggers on '~ 만들어줘', 'build me a ~', 'create ~', 'new project', '프로젝트 시작'."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# 프로젝트 가이드

> "만들어줘" 요청을 받으면, 코드부터 작성하지 않고 요구사항을 정리한 뒤 적합한 스택으로 시작한다.

## 1. 요구사항 정리

코딩 시작 전에 반드시 3가지를 확인한다:

1. **무엇을 만드는가** — 앱 유형 (웹앱, 모바일, API, 랜딩페이지 등)
2. **누가 사용하는가** — 대상 사용자 (본인, 일반 사용자, 관리자 등)
3. **핵심 기능 3개** — 가장 중요한 기능을 우선순위로 정리

유저가 이미 명확하게 설명했으면 확인 생략 가능.
모호하면 한 번의 질문으로 3가지를 동시에 물어본다 (질문 여러 번 금지).

## 2. 기술 스택 매트릭스

유저가 기술을 지정하지 않으면 아래 기본 스택을 따른다. 유저가 지정하면 존중한다.

| 유형 | 프론트엔드 | 백엔드/DB | 인증 | 배포 |
|------|-----------|----------|------|------|
| 정적 사이트/블로그 | Next.js (SSG) | — | — | Vercel |
| 풀스택 웹앱 | Next.js 15 (App Router) | Supabase | Supabase Auth | Vercel |
| AI 앱 | Next.js 15 | Vercel AI SDK + Supabase | Supabase Auth | Vercel |
| 모바일 앱 | Expo (React Native) | Supabase | Supabase Auth | EAS |
| API 서버 | — | Hono/Express + PostgreSQL | JWT | Railway/Fly.io |
| CLI 도구 | — | Node.js (ESM) | — | npm |

**기본 UI 스택**: shadcn/ui + Tailwind CSS v4 + Lucide Icons
**기본 패키지 매니저**: npm (유저가 bun/pnpm/yarn 선호 시 존중)

## 3. 프로젝트 구조 (Next.js App Router)

```
src/
├── app/
│   ├── layout.tsx        # RootLayout, 폰트, 메타데이터
│   ├── page.tsx          # 홈페이지
│   ├── globals.css       # Tailwind + 커스텀 스타일
│   └── (routes)/         # 라우트 그룹
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   └── [feature]/        # 기능별 컴포넌트
├── lib/
│   ├── supabase/         # client.ts, server.ts, middleware.ts
│   └── utils.ts          # cn() 등 유틸리티
└── types/                # TypeScript 타입 정의
```

- 환경변수: `.env.local` 사용, 클라이언트 노출 시 `NEXT_PUBLIC_` 접두사
- `.env.local`은 `.gitignore`에 포함 확인

## 4. 품질 규칙

코드 작성 시 반드시 지키는 기본 규칙:

**컴포넌트**
- Server Component 기본, `"use client"`는 상태/이벤트/브라우저 API 필요 시에만
- 컴포넌트 단위로 파일 분리, 한 파일에 여러 컴포넌트 금지

**TypeScript**
- strict mode 사용, `any` 타입 금지
- 주요 props/데이터에 interface/type 정의

**보안**
- 환경변수 하드코딩 금지 — `process.env`로 참조
- 파라미터화 쿼리 사용 (SQL injection 방지)
- 사용자 입력은 서버에서 검증 (XSS 방지)

**UX**
- 에러 바운더리 + 사용자 친화적 에러 메시지 (기술적 에러 노출 금지)
- 로딩 상태 표시 (Skeleton UI 또는 Spinner)
- 반응형 디자인 — mobile-first 접근
- 시맨틱 HTML + 기본 접근성 (`alt`, `aria-label`, 키보드 네비게이션)

**테스트**
- 핵심 비즈니스 로직에 기본 테스트 작성 (vitest 권장)
- 모든 주요 경로에 error.tsx, loading.tsx 배치

## 5. 전문 영역별 추가 스킬

프로젝트에 아래 요소가 포함되면 해당 전문 스킬을 추가 호출한다:

| 상황 | 호출할 스킬 |
|------|------------|
| 결제/구독/과금 | `skillbook:payment-billing` |
| AI/LLM 통합 | `skillbook:llm-architecture` |
| MCP 서버/플러그인 개발 | `skillbook:mcp-integration` |
| DB 스키마 설계, 쿼리 최적화 | `skillbook:database`, `skillbook:sql-optimization` |
| 검색 기능 (특히 한국어) | `skillbook:search-engineering` |
| 이메일 발송 | `skillbook:email-delivery` |
| 파일 업로드 | `skillbook:file-upload` |
| 다국어 지원 | `skillbook:i18n-localization` |
| 캐싱 전략 | `skillbook:caching-strategy` |
| 모바일 앱 | `skillbook:react-native`, `skillbook:app-performance` |
| UI/디자인 시스템 | `skillbook:web-visual-design`, `skillbook:accessibility` |
| 인증/권한 체계 | `skillbook:auth-architecture` |
| DevOps/CI/CD | `skillbook:devops-cicd` |
| 백그라운드 작업 | `skillbook:background-jobs` |

전문 스킬 호출 시 유저에게 알린다: "[Skill Book] 결제 시스템 전문 지식을 활용합니다"

## 6. 가시성 규칙

- 기술 스택 결정 시: `[Skill Book] Next.js 15 + Supabase + Vercel 스택으로 진행합니다` 형태로 유저에게 알림
- 유저 지정 스택 사용 시: `[Skill Book] 요청하신 {stack} 스택으로 진행합니다` 형태로 확인
- 전문 스킬 추가 로딩 시: `[Skill Book] {영역} 전문 지식을 활용합니다` 형태로 알림
