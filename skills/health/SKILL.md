---
name: health
category: meta
description: "Show skillbook health dashboard — usage frequency, unused skills, outdated detection, and summary stats"
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - WebSearch
---

# Skillbook Health Dashboard

> 스킬북 현재 상태를 사용 빈도, 미사용 스킬, 기술 최신성으로 진단하는 대시보드

## 게이트 (반드시 먼저)

진행 전 필수 확인. 통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] `~/.claude/skillbook-stats.json` 존재 여부 확인 — 없으면 "사용 데이터 없음, track-usage.mjs 실행 후 재시도" 안내
- [ ] `C:/Users/USER/manage-skills/skillbook-plugin/tools/skills-meta.json` 로드하여 전체 스킬 목록 파악

## 규칙 (항상 따라야 함)

1. **사용 빈도 분석**: stats.json에서 최근 30일 이내 `lastUsed` 기준 TOP 5 스킬 추출하여 사용 횟수와 함께 표시
2. **미사용 스킬 감지**: `lastUsed`가 60일 이상 지났거나 stats.json에 없는 스킬을 미사용으로 분류
3. **Outdated 감지 (선택적)**: 사용자가 요청할 경우 WebSearch로 주요 기술(Next.js, React, Python 등) 최신 버전 확인 후 SKILL.md 내용과 비교
4. **대시보드 출력**: 아래 정해진 형식으로 출력
   ```
   ## Skillbook Health Report (2026-02-27)

   ### 사용 빈도 TOP 5 (최근 30일)
   1. frontend — 12회
   2. testing — 8회
   ...

   ### 미사용 스킬 (60일+)
   - skill-name (마지막 사용: YYYY-MM-DD 또는 미기록)

   ### 전체 통계
   - 총 스킬 수: N개
   - 활성 스킬 (30일 이내): N개
   - 미사용 스킬: N개
   ```
5. **개선 제안**: 미사용 스킬 또는 outdated 스킬이 있으면 `/skillbook:manage <skill-name>` 실행 권장

## 완료 체크리스트 (통과해야 완료)

- [ ] TOP 5 사용 빈도 스킬이 표시되었는가
- [ ] 60일+ 미사용 스킬 목록이 식별되었는가
- [ ] 전체 스킬 수, 활성/미사용 비율 통계가 출력되었는가
