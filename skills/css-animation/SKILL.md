---
name: css-animation
category: dev
description: "CSS 애니메이션 구현 시 GPU-friendly 속성만 사용하고, prefers-reduced-motion을 의무화하며, 프로젝트 duration 토큰을 준수한다"
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

# CSS 애니메이션 워크플로우

> `width`, `height`, `margin`, `top` 등 레이아웃을 유발하는 속성을 애니메이션하지 않는다. `transform`과 `opacity`만 사용한다.

## 게이트 (반드시 먼저)

코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] `globals.css`와 `**/*.css`에서 기존 duration/easing CSS 변수를 확인했는가 (있으면 새 토큰 추가 전에 활용)
- [ ] `prefers-reduced-motion: reduce` 대응 코드가 프로젝트에 이미 있는지 확인했는가
- [ ] 구현할 각 애니메이션이 사용자에게 전달하는 의미(피드백, 방향, 관계)를 정의했는가

## 규칙 (항상 따라야 함)

1. **GPU 속성 전용**: 애니메이션 대상 속성은 `transform`과 `opacity`만 허용한다. `width`, `height`, `margin`, `padding`, `top`, `left`, `background-color` 단독 애니메이션은 절대 작성하지 마라.
2. **prefers-reduced-motion 필수**: 모든 애니메이션/트랜지션 코드에는 반드시 `@media (prefers-reduced-motion: reduce)` 대응을 포함한다. 누락하면 접근성 버그다.
3. **duration 토큰 준수**: 임의의 숫자(예: `450ms`, `750ms`)를 직접 쓰지 마라. 프로젝트에 정의된 duration 변수(`--duration-fast`, `--duration-normal` 등)를 사용한다. 없으면 먼저 토큰 시스템을 정의한다.
4. **linear easing 금지**: `animation` 또는 `transition`에 `linear`를 기본값으로 사용하지 마라. 등장에는 `ease-out`, 퇴장에는 `ease-in`, 상태 변경에는 `ease-in-out`을 기본으로 한다.
5. **스태거 딜레이 상한**: 목록/그리드 스태거 애니메이션에서 마지막 아이템의 총 딜레이가 300ms를 초과하지 않도록 한다.
6. **목적 없는 애니메이션 금지**: 사용자 행동(hover, click, scroll, focus) 또는 상태 전환과 연결되지 않은 장식용 루프 애니메이션을 새로 추가하지 마라.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] 모든 `@keyframes`와 `transition`이 `transform`/`opacity`만 사용하는가
- [ ] `prefers-reduced-motion: reduce` 대응이 모든 애니메이션에 적용되었는가
- [ ] duration 값이 프로젝트 토큰 변수 또는 명시적으로 정의된 시스템을 사용하는가
- [ ] `linear` easing이 정당한 이유 없이 사용된 곳이 없는가
- [ ] 스태거 애니메이션의 총 딜레이가 300ms 이내인가
- [ ] 애니메이션 없이도 콘텐츠가 정상적으로 표시되는가 (JS 비활성화 또는 reduced-motion 시)
