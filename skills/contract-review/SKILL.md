---
name: contract-review
category: legal
description: "소프트웨어/SaaS 계약서 검토 시 리스크 등급(H/M/L) 분류 강제, IP 양도·비경쟁·배상 비대칭 탐지 의무화, 해지 조건·lock-in 검증 요구"
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

# 소프트웨어 계약서 리스크 검토 워크플로우

> 계약서를 읽는 것이 아니라 위험을 등급화하는 것이다. H/M/L 분류 없이, IP 양도 범위 확인 없이, 해지 조건 검증 없이 검토 완료 선언하지 않는다.

## 게이트 (반드시 먼저)

계약서를 조항별로 분석하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] 계약 유형 확인: 용역 계약 / SaaS 구독 / 파트너십 / NDA / 합작 중 해당 유형 식별
- [ ] 당사자(parties) 확인: 계약 당사자의 법인 유형 및 관할 법원(jurisdiction) 조항 존재 여부 파악
- [ ] 계약 기간 및 자동 갱신(auto-renewal) 조항 존재 여부 확인
- [ ] IP 관련 조항 (IP assignment, work-for-hire, background IP) 섹션 위치 파악
- [ ] 비경쟁(non-compete) / 비유인(non-solicitation) 조항 존재 여부 확인
- [ ] 배상(indemnification) 및 책임 제한(liability cap) 조항 존재 여부 확인

## 규칙 (항상 따라야 함)

1. **리스크 3등급 분류 강제**: 모든 조항을 HIGH(즉각적 법적·재정 리스크), MEDIUM(불리하나 협상 가능), LOW(업계 표준 수준)으로 분류한다. 등급 없이 "주의 필요" 같은 모호한 표현만 사용하지 않는다.

2. **IP 양도 범위 과도성 탐지**: "all work product", "any invention" 같은 광범위한 IP 양도는 HIGH로 분류한다. 기존 보유 IP(background IP)나 계약 이전 개발물(pre-existing IP)까지 포함하는 문구는 즉시 플래그한다. 허용 기준은 "project-specific deliverables"로 명확히 한정된 경우에만 LOW.

3. **비경쟁 조항 3축 검증**: 기간(duration), 지역 범위(geographic scope), 업종 범위(industry scope) 세 가지를 모두 확인한다. 기간 2년 초과, 전 세계 범위, 또는 업종이 지나치게 광범위한 경우 각각 HIGH로 분류한다.

4. **배상 비대칭 탐지 의무**: 한쪽 당사자에게만 배상 의무가 집중된 일방적 배상(one-sided indemnification) 구조를 탐지한다. 배상 한도(cap) 없는 무제한 배상 의무는 HIGH. 상호(mutual) 배상 구조인지 반드시 확인한다.

5. **책임 한도(liability cap) 검증**: 책임 한도가 없는 경우 HIGH. 책임 한도가 계약 금액 미만으로 설정된 경우 플래그한다. "간접 손해(indirect/consequential damages) 배제" 조항이 한쪽에만 적용되는지 확인한다.

6. **해지 조건 불균형 탐지**: 편의 해지(termination for convenience)가 일방적으로 한쪽에만 허용되는 경우 HIGH. 해지 후 데이터 이전(data portability) 및 삭제 조건, 이전 지원 기간을 반드시 확인한다. 통지 기간(notice period)이 30일 미만이면 MEDIUM으로 분류한다.

7. **자동 갱신·가격 인상 조항 검증**: 자동 갱신(auto-renewal) 조항에 가격 인상 상한(price cap) 없이 인상을 허용하면 MEDIUM-HIGH로 분류한다. 갱신 거절 통지 기간이 갱신일로부터 60일 미만이면 플래그한다.

8. **지배구조 변경(change of control) 조항 확인**: 인수·합병 시 계약 자동 승계 또는 해지 여부를 확인한다. 상대방의 경쟁사에 인수될 경우 계약 해지권이 보장되지 않으면 MEDIUM.

9. **NDA 범위 과도성 검토**: 기밀 정보(confidential information)의 정의가 지나치게 광범위한 경우 플래그한다. 공개 정보(public domain) 제외 조항이 없으면 MEDIUM. 기밀 유지 기간이 5년 초과면 플래그한다.

10. **SLA 약속 실효성 검증**: SLA 업타임 수치(예: 99.9%)와 함께 페널티·크레딧 구조, 예외 조항(exclusions)을 반드시 함께 확인한다. 페널티 없는 SLA는 실질적 보호가 없음을 명시한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] 모든 주요 조항에 H/M/L 리스크 등급이 부여되었는가
- [ ] IP 양도 범위가 "project-specific deliverables"로 한정되는지, background IP 포함 여부 확인했는가
- [ ] 비경쟁 조항의 기간·지역·업종 3축을 모두 검증했는가
- [ ] 배상 조항이 상호적(mutual)인지, 무제한 배상 의무가 없는지 확인했는가
- [ ] 책임 한도(liability cap) 존재 및 계약 금액과의 비교를 완료했는가
- [ ] 해지 후 데이터 이전 및 삭제 조건을 확인했는가
- [ ] 자동 갱신 조항에 가격 상한 및 거절 통지 기간을 확인했는가
- [ ] 지배구조 변경 시 계약 처리 방식을 확인했는가
- [ ] 아래 형식의 리스크 요약 테이블을 출력했는가

| 조항 (Clause) | 리스크 등급 | 주요 문제 | 권고 조치 |
|---|---|---|---|
| IP 양도 | HIGH | background IP 포함 | 양도 범위를 deliverables로 한정 요청 |
| 비경쟁 | MEDIUM | 기간 2년, 국내 한정 | 기간 1년으로 단축 협상 |
| 배상 | LOW | 상호 배상, cap 있음 | 수용 가능 |
