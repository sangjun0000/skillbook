---
name: sync
category: meta
description: "Sync modified skills to website, marketplace, and legacy — auto-generates data.ts, bumps version, commits and pushes"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Skillbook Sync

> 수정된 스킬을 전체 에코시스템(plugin, website, marketplace)에 동기화하고 버전을 범프하는 배포 스킬

## 게이트 (반드시 먼저)

진행 전 필수 확인. 통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] `cd C:/Users/USER/manage-skills/skillbook-plugin && git diff --name-only`로 변경된 파일 확인
- [ ] 변경된 SKILL.md 파일이 1개 이상 존재하는지 확인 — 없으면 "변경 없음" 안내 후 종료

## 규칙 (항상 따라야 함)

1. **변경 감지**: `git diff --name-only HEAD`로 수정된 SKILL.md 목록 파악 — 신규/삭제/수정 구분
2. **변경 유형 판단**: 스킬 추가 또는 삭제이면 `minor` 범프, 내용 수정만이면 `patch` 범프
3. **skills-meta.json 업데이트**: 변경된 스킬의 Korean 콘텐츠를 추출하고 English 번역을 갱신 — `tools/skills-meta.json`의 해당 엔트리 수정
4. **sync-engine 실행**: `node tools/sync-engine.mjs --bump <patch|minor>`로 data.ts 생성 및 버전 범프
5. **변경 요약 표시**: 사용자에게 변경 내역(추가/수정/삭제 스킬 목록)과 새 버전 번호를 보여주고 push 여부 확인
6. **Git 커밋 & 푸시**: 사용자 승인 후 skillbook-plugin 레포와 skillbook-site 레포 양쪽 모두 commit + push
7. **결과 리포트**: 변경 요약, 새 버전 번호, 배포 상태(성공/실패) 출력

## 완료 체크리스트 (통과해야 완료)

- [ ] skills-meta.json에 변경 사항이 정확히 반영되었는가
- [ ] data.ts가 sync-engine으로 새로 생성되었는가
- [ ] plugin.json, marketplace.json, data.ts 세 곳의 버전이 동일한가
- [ ] skillbook-plugin 레포와 skillbook-site 레포 양쪽 모두 push 완료되었는가
