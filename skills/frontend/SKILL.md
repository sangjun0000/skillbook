---
name: frontend
category: dev
description: "Next.js 프론트엔드 개발 시 기존 패턴을 먼저 분석하고, Server Component를 기본으로 강제하며, 접근성과 성능 기준을 통과해야만 완료로 인정한다"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebSearch
---

# 프론트엔드 워크플로우

> 기존 코드베이스의 패턴을 먼저 파악하지 않고 새 컴포넌트를 작성하지 않는다.

## 게이트 (반드시 먼저)

코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] `app/**/page.tsx`, `app/**/layout.tsx`를 탐색하여 라우트 구조와 기존 레이아웃 패턴을 파악했는가
- [ ] `tailwind.config.*`와 `globals.css`를 읽어 커스텀 테마 토큰과 디자인 시스템 현황을 확인했는가
- [ ] `components/ui/`의 shadcn/ui 설치 현황을 확인하여 이미 있는 컴포넌트를 새로 만들지 않도록 했는가
- [ ] 새 컴포넌트가 Server Component로 구현 가능한지, `"use client"`가 반드시 필요한 이유를 명확히 했는가

## 규칙 (항상 따라야 함)

1. **Server Component 기본**: `"use client"`는 이벤트 핸들러, `useState`/`useEffect`, 브라우저 API가 필요한 경우에만 선언한다. 이유 없이 모든 컴포넌트에 붙이지 마라.
2. **기존 패턴 준수**: 프로젝트에서 이미 사용 중인 상태 관리(Zustand/Jotai/Context), 데이터 페칭, 폼 처리 방식을 파악하고 동일한 패턴을 따른다.
3. **접근성 비협상**: 인터랙티브 요소(`button`, `input`, `dialog`)에는 반드시 적절한 ARIA 속성과 키보드 접근성을 포함한다.
4. **Tailwind 클래스 명시적 작성**: `bg-${color}-500`과 같이 동적으로 생성되는 클래스명을 절대 사용하지 마라. 전체 클래스명을 코드에 명시한다.
5. **useEffect 데이터 페칭 금지**: Server Component에서 직접 `async/await`으로 데이터를 페칭하거나 Server Actions를 사용한다. `useEffect` 내 fetch는 절대 새로 작성하지 마라.
6. **barrel export 지양**: `index.ts`에서 모든 컴포넌트를 re-export하지 마라. 직접 import 경로를 사용하여 트리 셰이킹이 작동하도록 한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] 불필요한 `"use client"` 선언이 없는가 (각 선언에 정당한 이유가 있는가)
- [ ] 이미지에 `next/image`를 사용하고 `alt`, `width`, `height`가 설정되었는가
- [ ] 인터랙티브 요소가 키보드만으로 접근 가능한가
- [ ] 모바일 / 태블릿 / 데스크톱 세 breakpoint에서 레이아웃이 정상인가
- [ ] 각 페이지에 `metadata` export가 설정되었는가
- [ ] `loading.tsx`와 `error.tsx`가 필요한 라우트에 정의되었는가
