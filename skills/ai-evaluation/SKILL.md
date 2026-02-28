---
name: ai-evaluation
category: ai
description: "AI 모델 평가 시 eval 데이터셋 구축 강제, promptfoo/Braintrust 활용 의무화, red teaming 체크리스트, regression 방지 게이트"
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

# AI 평가 워크플로우 (AI Evaluation Workflow)

> 프롬프트를 수정하기 전에 eval 데이터셋을 먼저 만든다. 평가 없이 프롬프트를 변경하지 않는다.

## 게이트 (반드시 먼저)

프롬프트나 모델 설정을 변경하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] 현재 프롬프트와 모델 설정(temperature, max_tokens, system prompt) 파악 완료
- [ ] eval 데이터셋 존재 여부 확인 — 없으면 **최소 20개 테스트 케이스** 먼저 생성
- [ ] 테스트 케이스에 **Happy Path, Edge Case, Adversarial Input**이 모두 포함되어 있는가
- [ ] 평가 도구(promptfoo / Braintrust / 커스텀 스크립트) 실행 환경이 준비되어 있는가
- [ ] 현재 프롬프트의 **baseline 점수**가 기록되어 있는가 (변경 전 기준선)

## 규칙 (항상 따라야 함)

1. **Eval-First**: 프롬프트 변경 전에 반드시 eval 데이터셋을 먼저 작성한다. 평가 기준 없이 프롬프트를 수정하는 것을 절대 허용하지 않는다.
2. **Baseline 기록 의무**: 변경 전 현재 프롬프트의 점수를 기록하고, 변경 후 점수와 비교한다. 수치 없이 "더 좋아졌다"고 주장하지 않는다.
3. **Regression 방지 게이트**: 프롬프트 변경 후 기존 테스트 케이스에서 점수가 하락하면 변경을 적용하지 않는다. 새 기능을 위해 기존 품질을 희생하지 않는다.
4. **Red Teaming 필수**: 프롬프트 인젝션, 탈옥(jailbreak), 유해 콘텐츠 유도 테스트를 반드시 포함한다. 최소 5개의 adversarial 케이스를 작성한다.
5. **평가 기준 명시**: 각 테스트 케이스에 `expected_output` 또는 `rubric`을 반드시 정의한다. "알아서 좋은 답변"은 평가 기준이 아니다.
6. **A/B 비교 구조**: 프롬프트 변경은 반드시 A(현재) vs B(변경) 구조로 비교한다. promptfoo의 `--compare` 또는 Braintrust의 experiment 비교 기능을 활용한다.
7. **Cost 추적**: eval 실행 비용(토큰 사용량)을 기록하고, eval 실행이 과도하게 비싸지 않도록 샘플링 전략을 적용한다.
8. **버전 관리**: 프롬프트 변경 이력을 Git으로 관리한다. 각 변경에 eval 점수를 커밋 메시지에 포함한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] eval 데이터셋이 최소 20개 테스트 케이스를 포함하는가
- [ ] Happy Path / Edge Case / Adversarial Input이 균형 있게 포함되었는가
- [ ] 변경 전 baseline 점수가 기록되어 있는가
- [ ] 변경 후 점수가 baseline 대비 regression이 없는가
- [ ] Red teaming 케이스(프롬프트 인젝션, jailbreak) 5개 이상이 통과하는가
- [ ] 모든 테스트 케이스에 `expected_output` 또는 평가 rubric이 정의되어 있는가
- [ ] eval 결과가 재현 가능한가 (동일 입력 → 유사 점수)
- [ ] 프롬프트 변경 이력이 Git에 커밋되어 있는가
