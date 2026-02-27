---
name: clean-architecture
category: architecture
description: "클린 아키텍처 구현 시 의존성 방향을 검증하고, Entity 순수성을 강제하며, Port 정의 전에는 Adapter를 절대 작성하지 않는다"
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

# 클린 아키텍처 워크플로우

> Port(인터페이스)가 먼저 정의되지 않으면 Adapter(구현체)를 절대 작성하지 않는다.

## 게이트 (반드시 먼저)

코드를 작성하기 전에 반드시 완료해야 하는 선행 조건.
통과하지 않으면 다음 단계로 진행하지 않는다.

- [ ] 기존 코드의 import 방향을 스캔하여 레이어 간 의존성 위반이 없는지 확인했는가
- [ ] 도메인 Entity/Use Case 파일에 Prisma, Express, NestJS 등 프레임워크 import가 있는지 확인했는가
- [ ] 구현할 기능의 Use Case 목록과 각 Use Case가 필요로 하는 Port(인터페이스) 목록을 먼저 정의했는가

## 규칙 (항상 따라야 함)

1. **Port 선행 의무**: Adapter(예: PrismaUserRepository)를 작성하기 전에 반드시 Port 인터페이스(예: UserRepository)를 먼저 정의한다.
2. **Entity 순수성 강제**: Domain Entity와 Value Object에 ORM 데코레이터(`@Entity`, `@Column`), 프레임워크 import, 비동기 I/O를 절대 포함시키지 마라.
3. **의존성 방향 단방향**: 안쪽 레이어(domain, application)에서 바깥 레이어(infrastructure, interfaces)를 절대 import하지 마라. 위반 시 즉시 Port로 역전한다.
4. **Use Case 단일 책임**: 하나의 Use Case 클래스에 여러 비즈니스 기능을 묶지 마라. `CreateOrder`, `CancelOrder`는 별도 클래스다.
5. **컨트롤러 무로직**: 컨트롤러에서 직접 DB 쿼리, 비즈니스 규칙 검증, 도메인 계산을 절대 하지 마라. Use Case를 호출하고 응답을 변환하는 것만 허용한다.
6. **DI 컨테이너 위치**: 의존성 조립(new PrismaUserRepository, new CreateUserUseCase)은 반드시 가장 바깥 레이어(infrastructure/config)에서만 수행한다.

## 완료 체크리스트 (통과해야 완료)

작업 완료 전 반드시 확인. 하나라도 실패하면 완료 아님.

- [ ] Entity/Use Case 파일에 프레임워크(Prisma, Express 등) import가 없는가
- [ ] 모든 외부 의존성이 Port(인터페이스)를 통해서만 접근되는가
- [ ] 의존성 방향이 바깥→안쪽으로만 향하는가 (domain이 infrastructure를 모르는가)
- [ ] Use Case가 Port를 mock으로 대체하여 인프라 없이 단위 테스트 가능한가
- [ ] Value Object가 불변이며 생성 시점에 유효성 검사를 수행하는가
- [ ] DI 컨테이너 조립 코드가 infrastructure 레이어에만 위치하는가
