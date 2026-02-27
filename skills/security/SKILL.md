---
name: security
category: dev
description: "보안 작업 시 완료 전 OWASP 감사 강제, CSP/보안 헤더 의무화, 파라미터화 쿼리 강제, bcrypt cost 12+ 요구"
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

# 웹 보안 워크플로우

> 기능 구현보다 공격 표면 분석이 먼저다. 보안 헤더 없이, 입력 검증 없이, Raw 쿼리로 완료 선언하지 않는다.

## 게이트 (반드시 먼저)

코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] 사용자 입력을 받는 모든 엔드포인트 목록화 완료
- [ ] 현재 인증/인가 방식 파악 (세션 / JWT / OAuth)
- [ ] `middleware.ts` 또는 `next.config.js`에서 보안 헤더 설정 현황 확인
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `npm audit`으로 high/critical 취약점 현황 파악

## 규칙 (항상 따라야 함)

1. **서버 측 검증 필수**: 클라이언트 검증(프론트엔드 Zod 등)만으로 완료하지 않는다. 서버 엔드포인트에서 동일한 검증을 반드시 수행한다.
2. **파라미터화 쿼리만 허용**: Raw SQL에 사용자 입력을 직접 삽입하지 않는다. ORM의 안전한 API 또는 tagged template literal을 사용한다. `$queryRawUnsafe` 등 unsafe 메서드는 절대 사용 금지.
3. **bcrypt cost 12 이상 의무**: 비밀번호 해싱 시 cost factor를 12 미만으로 설정하지 않는다. argon2도 허용하나 bcrypt 사용 시 12가 최솟값이다.
4. **보안 쿠키 플래그 3종 세트**: 인증 쿠키에 `httpOnly`, `secure`, `sameSite` 세 가지를 모두 설정한다. 하나라도 빠지면 완료 아님.
5. **CSP 헤더 설정 의무**: `Content-Security-Policy`를 반드시 설정한다. `unsafe-eval`은 절대 포함하지 않는다.
6. **보안 헤더 5종 의무**: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`를 모든 응답에 포함한다.
7. **시크릿 코드 금지**: API 키, DB 비밀번호, JWT secret을 코드에 직접 작성하지 않는다. 환경 변수로만 관리한다.
8. **에러 메시지 일반화**: 에러 응답에 스택 트레이스, DB 오류, 내부 경로를 절대 노출하지 않는다. "인증에 실패했습니다"처럼 일반화된 메시지만 반환한다.
9. **Rate Limiting 적용**: 로그인, 회원가입, 비밀번호 재설정 엔드포인트에 반드시 rate limiting을 적용한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] 모든 사용자 입력 엔드포인트에 서버 측 검증(Zod 등)이 적용되었는가
- [ ] CSP 헤더가 설정되고 `unsafe-eval`이 없는가
- [ ] 보안 헤더 5종(HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)이 모두 설정되었는가
- [ ] 인증 쿠키에 `httpOnly` + `secure` + `sameSite`가 모두 설정되었는가
- [ ] 비밀번호가 bcrypt(cost 12+) 또는 argon2로 해싱되고 평문 저장이 없는가
- [ ] 로그인/회원가입/비밀번호 재설정에 rate limiting이 적용되었는가
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가
- [ ] `npm audit`에서 high/critical 취약점이 0건인가
- [ ] 에러 응답에 스택 트레이스나 내부 정보가 없는가
