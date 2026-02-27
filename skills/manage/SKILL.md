---
name: manage
category: meta
description: "Review, update, add, or remove skills — quality review, content updates with auto-translation, and skill lifecycle management"
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

# Skillbook Manage

> 스킬 품질 리뷰, 콘텐츠 업데이트, 추가/삭제를 처리하는 스킬 라이프사이클 관리 스킬

## 게이트 (반드시 먼저)

진행 전 필수 확인. 통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] `C:/Users/USER/manage-skills/skillbook-plugin/tools/skills-meta.json` 로드하여 전체 스킬 목록 확인
- [ ] 인자 파악: 인자 없음이면 리뷰 모드, `<skill-name>`이면 직접 수정, `--add <name>`이면 추가, `--remove <name>`이면 삭제

## 규칙 (항상 따라야 함)

**리뷰 모드** (인자 없음):
- `~/.claude/skillbook-stats.json` 기반으로 미사용(60일+) 또는 낮은 사용 빈도 스킬을 우선 추천
- 사용자가 리뷰할 스킬을 선택하면 해당 스킬 직접 수정 모드로 전환

**직접 수정** (`<skill-name>` 인자):
1. `skills/<name>/SKILL.md` 읽기
2. WebSearch로 해당 기술 스택 최신 트렌드 및 패턴 조사
3. 개선안(추가할 내용, 삭제할 outdated 내용) 제시
4. 사용자 승인 후 SKILL.md 수정
5. `tools/skills-meta.json`의 해당 엔트리 갱신 — Korean + English 번역 정확히 반영

**추가** (`--add <name>`):
1. 동일 이름 스킬 중복 여부 확인 — 있으면 "이미 존재" 안내 후 종료
2. 카테고리 결정 (10개 카테고리 중 선택)
3. 워크플로우(Gates/Rules/Checklist) 또는 도메인(Role/Principles/Process) 포맷 선택
4. `skills/<name>/SKILL.md` 생성 (YAML frontmatter 포함, 40-60줄 목표)
5. `tools/skills-meta.json` `skills` 배열에 새 엔트리 추가

**삭제** (`--remove <name>`):
1. `skills/<name>/SKILL.md` 존재 확인 — 없으면 "스킬 없음" 안내 후 종료
2. 사용자에게 삭제 여부 재확인 (되돌릴 수 없음 명시)
3. 사용자 승인 후 `skills/<name>/` 디렉토리 삭제
4. `tools/skills-meta.json`에서 해당 엔트리 제거

**완료 시 필수 안내**:
- 모든 작업 완료 후 "/skillbook:sync 실행으로 웹사이트와 마켓플레이스에 배포하세요" 안내

## 완료 체크리스트 (통과해야 완료)

- [ ] SKILL.md가 워크플로우/도메인 포맷을 정확히 준수하는가
- [ ] skills-meta.json에 변경 사항이 반영되었는가 (추가/수정/삭제)
- [ ] Korean 콘텐츠와 English 번역이 의미상 정확하게 일치하는가
- [ ] 작업 완료 후 `/skillbook:sync` 실행을 사용자에게 안내했는가
