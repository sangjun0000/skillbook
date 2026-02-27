---
name: testing
category: dev
description: "테스트 작성 시 Test Pyramid 비율 강제, test-first 접근법 의무화, 격리성 검증, flaky test 탐지"
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

# 테스트 전략 워크플로우

> 코드를 작성하기 전에 테스트를 먼저 작성하고, Test Pyramid 비율을 지키며, 비결정론적 요소를 반드시 제거한다.

## 게이트 (반드시 먼저)

코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] `package.json`에서 테스트 프레임워크 확인 (vitest / jest / playwright / cypress)
- [ ] 기존 테스트 파일 구조 파악 (`**/*.test.ts`, `**/*.spec.ts`, `**/__tests__/**`)
- [ ] 테스트 대상 코드의 외부 의존성 목록화 (API, DB, 파일시스템, 시간, 난수)
- [ ] 비즈니스 크리티컬 경로 식별 — 이것부터 테스트한다

## 규칙 (항상 따라야 함)

1. **Test-First**: 구현 코드보다 테스트를 먼저 작성한다. 테스트가 없으면 구현하지 않는다.
2. **Test Pyramid 비율 준수**: Unit 70% / Integration 20% / E2E 10% 비율을 유지한다. E2E를 Unit 대신 작성하는 것을 절대 허용하지 않는다.
3. **AAA 패턴 강제**: 모든 테스트는 Arrange → Act → Assert 세 구역으로 명확히 분리한다.
4. **행위 테스트만 허용**: 내부 private 메서드나 state를 직접 검증하지 않는다. 외부에서 관찰 가능한 동작만 검증한다.
5. **격리성 보장**: 전역 변수, 공유 DB 상태를 테스트 간 공유하지 않는다. 각 테스트는 독립적으로 setup/teardown한다.
6. **비결정론적 요소 제어**: 시간(`Date.now()`), 난수(`Math.random()`), 네트워크 요청에 의존하는 테스트는 반드시 mock/stub으로 제어한다. 제어하지 않으면 작성하지 않는다.
7. **Mock 범위 제한**: 외부 서비스(API, DB)만 mock한다. 내부 모듈을 과도하게 mock하지 않는다.
8. **절대 스냅샷 전체 비교 금지**: 거대 스냅샷은 유지보수 불가. 핵심 구조만 인라인 스냅샷으로 검증한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] 작성한 테스트가 Unit / Integration / E2E 비율 70/20/10을 충족하는가
- [ ] 모든 테스트가 실행 순서와 무관하게 독립적으로 통과하는가
- [ ] 테스트 이름만 읽었을 때 무엇을 검증하는지 명확히 알 수 있는가
- [ ] `Date`, `Math.random`, 외부 API 호출이 모두 mock 처리되어 있는가
- [ ] 비즈니스 크리티컬 경로의 Happy Path + Error Case가 모두 테스트되었는가
- [ ] `npm test` 또는 `npx vitest run`이 0 failed로 통과하는가
- [ ] CI 환경에서 반복 실행 시 동일한 결과가 나오는가 (flaky 없음)
