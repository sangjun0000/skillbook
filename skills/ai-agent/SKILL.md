---
name: ai-agent
category: ai
description: "AI 에이전트 설계 시 안전 경계를 먼저 강제하고, 고위험 작업에 인간 승인 게이트를 의무화하며, 루프 제어 없는 에이전트는 절대 출력하지 않는다"
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

# AI 에이전트 설계 워크플로우

> 루프 제어(max iterations, token budget, stuck 감지)가 없는 에이전트 코드는 절대 작성하지 않는다.

## 게이트 (반드시 먼저)

에이전트 코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] 에이전트가 절대 수행해서는 안 되는 작업 목록(금지 작업)을 정의했는가
- [ ] MAX_ITERATIONS, MAX_TOKENS_BUDGET, TIMEOUT_SECONDS 세 가지 종료 조건을 모두 확정했는가
- [ ] 고위험 도구(파일 삭제, 이메일 발송, 결제 실행, 외부 API 쓰기)를 식별하고 Human-in-the-Loop 여부를 결정했는가
- [ ] 작업 성공/실패를 판단하는 명확한 기준을 정의했는가

## 규칙 (항상 따라야 함)

1. **루프 제어 필수**: MAX_ITERATIONS, MAX_TOKENS_BUDGET, TIMEOUT_SECONDS 세 가지 제어 없이는 에이전트 루프를 절대 작성하지 마라.
2. **도구 수 제한**: 도구를 20개 이상 제공하지 마라. 해당 작업에 필요한 5-7개로 제한한다.
3. **Stuck 감지 의무화**: 동일 도구를 동일 인자로 3회 이상 호출하는 패턴을 감지하고 루프를 중단하는 로직을 반드시 포함한다.
4. **에러를 숨기지 마라**: 도구 래퍼에서 에러를 catch하고 빈 결과를 반환하지 마라. `is_error: True`와 에러 메시지를 Observation으로 명확히 전달한다.
5. **고위험 작업 승인 게이트**: 파일 삭제, 외부 API 쓰기, 이메일 발송 등 되돌릴 수 없는 작업 전에는 반드시 사용자 확인을 요청한다.
6. **모든 단계 로깅**: Thought → Action → Observation 각 단계를 추적 가능하게 기록한다. 로그 없는 에이전트는 배포하지 마라.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] 루프 종료 조건 3가지(iterations, tokens, timeout)가 모두 코드에 존재하는가
- [ ] 고위험 도구에 사용자 승인 단계가 포함되었는가
- [ ] Stuck 감지 로직이 구현되었는가
- [ ] 에러 발생 시 `is_error` 플래그와 함께 Observation으로 전달되는가
- [ ] 에이전트가 정의된 도구 이외의 존재하지 않는 도구를 호출하지 않는가
- [ ] Thought → Action → Observation 추적이 가능하도록 로깅이 구현되었는가
