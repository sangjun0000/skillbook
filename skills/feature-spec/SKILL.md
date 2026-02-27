---
name: feature-spec
category: product
description: "기능 명세 작성 시 RICE 스코어링 먼저 강제, Given-When-Then 수용 기준 의무화, In/Out Scope 명시 요구"
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

# 기능 명세서 워크플로우

> 구현 방법을 먼저 정의하지 않는다. RICE 점수로 우선순위를 확정하고, 스코프 경계를 명시하고, Given-When-Then 기준을 작성한 뒤에만 구현을 시작한다.

## 게이트 (반드시 먼저)

코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] 기능의 "왜" 정의 완료: 어떤 사용자가 어떤 문제를 겪는지 한 문장으로 명시
- [ ] RICE 스코어 계산 완료: `(Reach × Impact × Confidence) / Effort`로 수치화, 비교 기능이 있으면 함께 나열
- [ ] In Scope / Out of Scope 경계 명시 완료: 이번 릴리스에 포함되지 않는 항목을 Out of Scope에 명시
- [ ] 기술적 의존성 확인 완료: 연동해야 하는 API, 서비스, 팀이 식별되었는가

## 규칙 (항상 따라야 함)

1. **솔루션 먼저 금지**: "이 버튼을 추가한다"처럼 구현 방식부터 정의하지 않는다. 사용자 문제를 먼저 정의하고, 솔루션은 그 다음에 도출한다.
2. **직감 기반 우선순위 금지**: "대표가 중요하다고 했기 때문에" 식의 결정은 허용하지 않는다. RICE Score 또는 MoSCoW 프레임워크로 정당화한다.
3. **Given-When-Then 의무화**: 모든 Acceptance Criteria는 `Given [전제 조건] / When [사용자 행동] / Then [기대 결과]` 형식으로 작성한다. "잘 동작해야 한다" 같은 모호한 기준은 허용하지 않는다.
4. **Out of Scope 명시 의무**: Out of Scope를 정의하지 않으면 명세 완료가 아니다. 나중에 추가될 기능을 Out of Scope에 명시하여 Scope Creep을 사전 차단한다.
5. **User Story 형식 준수**: 모든 User Story는 `As a {역할}, I want {기능} so that {가치}` 형식을 따른다.
6. **Edge Case 필수 포함**: Happy Path Acceptance Criteria만 작성하면 완료 아님. 네트워크 에러, 빈 상태, 권한 부족, 최대치 초과 케이스를 반드시 포함한다.
7. **성공 지표 정량화 의무**: Success Metrics는 "개선한다" 같은 정성적 표현이 아닌, "40% → 65%"처럼 측정 가능한 수치로 정의한다.
8. **기술 제약 무시 금지**: 엔지니어링 의존성과 실현 가능성을 고려하지 않은 명세는 작성하지 않는다. 의존 팀의 ETA를 Dependencies 항목에 명시한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] RICE Score가 수치로 계산되어 우선순위가 정당화되었는가
- [ ] 모든 User Story가 `As a / I want / so that` 형식을 따르는가
- [ ] 모든 Acceptance Criteria가 Given-When-Then 형식인가
- [ ] Happy Path 외에 Error Case, Edge Case가 AC에 포함되었는가
- [ ] In Scope / Out of Scope 경계가 명시적으로 분리되었는가
- [ ] Success Metrics가 측정 가능한 수치로 정의되었는가
- [ ] 기술적 의존성과 ETA가 Dependencies 항목에 기술되었는가
- [ ] 이 문서만으로 엔지니어링 팀이 구현을 시작할 수 있는가
