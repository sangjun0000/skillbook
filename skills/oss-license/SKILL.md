---
name: oss-license
category: legal
description: "오픈소스 사용 시 라이선스 호환성 매트릭스 검증 강제, copyleft 오염 범위 판단 의무화, SBOM 생성·고지 의무 적용, AGPL 네트워크 copyleft 경고"
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

# 오픈소스 라이선스 컴플라이언스 워크플로우

> 의존성을 추가하기 전에 라이선스를 확인한다. copyleft 오염은 배포 후에 발견하면 되돌릴 수 없다.

## 게이트 (반드시 먼저)

코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] 프로젝트의 배포 형태 파악 완료 (SaaS / 바이너리 배포 / 라이브러리 / 내부 도구)
- [ ] 전체 의존성 라이선스 목록 추출 완료 (`license-checker`, `pip-licenses`, `cargo-license` 등)
- [ ] GPL / AGPL / LGPL 계열 패키지가 존재하는지 식별 완료
- [ ] 프로젝트 자체 라이선스와 의존성 라이선스 간 호환성 충돌 여부 1차 확인
- [ ] AGPL-3.0 패키지 존재 시 SaaS 배포 여부 별도 확인 (Section 13 경고)

## 규칙 (항상 따라야 함)

1. **라이선스 호환성 매트릭스 기준 적용**: 아래 매트릭스를 기준으로 판단한다. permissive → weak copyleft → strong copyleft → network copyleft 순으로 제약이 강해진다.

   | 내 프로젝트 라이선스 | MIT | Apache-2.0 | BSD-2/3 | MPL-2.0 | LGPL-2.1 | GPL-2.0 | GPL-3.0 | AGPL-3.0 |
   |---|---|---|---|---|---|---|---|---|
   | MIT (배포) | OK | OK | OK | OK | OK | OK | OK | OK |
   | Apache-2.0 (배포) | OK | OK | OK | OK | OK | **NO** (patent) | OK | OK |
   | GPL-2.0-only (배포) | OK | **NO** (patent clause) | OK | OK | OK | OK | **NO** | **NO** |
   | GPL-3.0 (배포) | OK | OK | OK | OK | OK | OK | OK | OK |
   | AGPL-3.0 (배포) | OK | OK | OK | OK | OK | OK | OK | OK |
   | 독점 소프트웨어 (배포) | OK | OK | OK | file-level | dynamic only | **NO** | **NO** | **NO** |

   - MIT → GPL에 포함: 허용 (permissive는 copyleft에 흡수 가능)
   - GPL-2.0-only + Apache-2.0: **비호환** (Apache-2.0의 patent termination clause가 GPL-2.0의 "no further restrictions"와 충돌)
   - GPL-2.0-only + GPL-3.0: **비호환** (버전 고정이면 혼합 불가, "or later" 여부 확인 필수)

2. **copyleft 오염 범위 판단 의무**: 연결 방식에 따라 파생 저작물(derivative work) 여부가 달라진다.
   - 정적 링킹 (static linking): GPL 코드와 합쳐지면 전체가 파생 저작물 → GPL 적용
   - 동적 링킹 (dynamic linking): LGPL은 허용, GPL은 불확실 (FSF는 파생 저작물로 봄)
   - 수정 (modification): 항상 파생 저작물 → 원본 라이선스 적용 의무
   - 별도 프로세스 + IPC (REST API, gRPC 호출): 일반적으로 파생 저작물 아님 (독립 프로세스)

3. **AGPL-3.0 SaaS 경고 의무**: AGPL-3.0 Section 13은 네트워크를 통해 서비스를 제공하는 것만으로도 소스 공개 의무를 발생시킨다. 독점 SaaS에 AGPL 패키지를 포함하면 전체 소스를 공개해야 한다. AGPL 패키지 발견 시 반드시 사용자에게 경고한다.

4. **GPL-2.0-only vs GPL-2.0-or-later 구분 필수**: `GPL-2.0-only`는 GPL-3.0과 혼합 불가. `GPL-2.0-or-later` (또는 `GPL-2.0+`)는 GPL-3.0으로 업그레이드 가능. SPDX 표기에서 `-only`와 `-or-later` 반드시 구분한다.

5. **MPL-2.0 파일 단위 copyleft 이해**: MPL-2.0은 수정한 파일에만 copyleft가 적용된다. 별도 파일로 분리하면 독점 코드와 공존 가능. 단, 동일 파일에 MPL + 독점 코드 혼합은 불가.

6. **LGPL 동적 링킹 허용 조건 명시**: LGPL-2.1 동적 링킹은 허용되나, 사용자가 라이브러리를 교체할 수 있어야 한다(reverse engineering 허용 조항). 바이너리를 암호화하거나 서명 검증으로 교체를 막으면 LGPL 위반.

7. **SBOM 생성 의무화**: 배포 제품에 대해 SPDX 또는 CycloneDX 형식의 SBOM(Software Bill of Materials)을 생성한다. 엔터프라이즈 고객 납품, 정부 조달, EU CRA(Cyber Resilience Act) 대상 제품은 필수.
   ```bash
   # npm
   npx license-checker --json > sbom.json
   # pip
   pip-licenses --format=json > sbom.json
   # cargo
   cargo-license --json > sbom.json
   ```

8. **NOTICE 파일 및 저작권 고지 의무**: MIT/BSD/Apache-2.0은 원본 저작권 고지를 배포물에 포함해야 한다. Apache-2.0은 NOTICE 파일이 있으면 그대로 유지·배포해야 한다. 소스 미포함 바이너리 배포 시 별도 ATTRIBUTION 또는 NOTICE 파일로 고지.

9. **듀얼 라이선스(Open Core) 전략 명시**: 독점 제품에서 OSS를 직접 사용하기 어려울 때 상업용 라이선스를 별도 구매하는 것이 유효한 해결책이다 (MySQL, MongoDB SSPL, Elasticsearch 등). 라이선스 충돌 해결 전 상업용 라이선스 구매 가능 여부 확인을 제안한다.

10. **라이선스 오디트 도구 실행 결과 첨부 의무**: 라이선스 관련 판단을 내릴 때 도구 실행 없이 추정으로만 답하지 않는다. 가능하면 실제 `license-checker`/`pip-licenses`/`cargo-license` 결과를 기반으로 판단한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] 전체 의존성 라이선스 목록이 SPDX ID 기준으로 추출되었는가
- [ ] GPL / AGPL / LGPL 패키지의 연결 방식(정적/동적/IPC)이 판단되었는가
- [ ] AGPL-3.0 패키지가 있는 경우 SaaS 배포 여부와 소스 공개 의무가 사용자에게 고지되었는가
- [ ] GPL-2.0-only + Apache-2.0 혼합처럼 알려진 비호환 조합이 없는가
- [ ] 배포물에 MIT/BSD/Apache-2.0 저작권 고지(NOTICE/ATTRIBUTION)가 포함되었는가
- [ ] Apache-2.0 패키지의 NOTICE 파일이 원본 그대로 유지·포함되었는가
- [ ] SBOM(SPDX 또는 CycloneDX)이 생성되었거나 생성 계획이 수립되었는가
- [ ] 라이선스 충돌 해결 방안(제거, 격리, 상업용 라이선스 구매)이 명시되었는가
- [ ] GPL-2.0-only vs GPL-2.0-or-later 구분이 정확히 이루어졌는가
