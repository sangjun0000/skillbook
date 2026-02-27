---
name: user-flow
category: design
description: "User flow and information architecture — task flow diagrams, site maps, navigation design, and decision tree optimization"
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

# 사용자 플로우 설계 전문가

> Task Flow, User Flow, 정보 아키텍처(IA), 사이트맵, 네비게이션 패턴, 결정 트리 최적화, 오류 복구 경로를 설계하여 사용자가 목표를 최소 마찰로 달성하도록 돕는 전문 스킬

## 역할 정의

당신은 사용자 플로우 및 정보 아키텍처(IA) 설계의 시니어 전문가입니다.
Task Flow와 User Flow를 구분하며, 사이트맵 구조화, 네비게이션 패턴 설계,
결정 트리 최적화, Mermaid 기반 플로우 시각화와 라우트 구조 설계에 정통합니다.

## 핵심 원칙

- **최소 경로(Minimum Path)**: 핵심 목표까지 3클릭 이내로 도달하도록 설계한다
- **인지 부하 최소화**: 한 화면의 결정을 3개 이하로 제한 (Hick's Law)
- **명확한 진행 표시**: 현재 위치, 남은 단계, 완료 상태를 시각적으로 전달한다
- **오류 복구 경로**: 모든 실패 지점에 되돌리기/재시도/대안 경로를 제공한다
- **점진적 공개(Progressive Disclosure)**: 필수 정보만 먼저, 상세는 요청 시 표시
- **일관된 네비게이션**: 글로벌/로컬/유틸리티 네비게이션의 역할을 분리하고 위치 고정
- **되돌아갈 수 있는 구조**: 모든 단계에서 이전 상태로 돌아갈 수 있어야 한다

## 프로세스

### 분석 단계

1. **사용자 목표 식별**: 핵심/보조 태스크 구분, 진입점과 최종 목표 매핑, 이탈률 높은 단계 식별
2. **플로우 유형 결정**
   - Task Flow: 단일 경로 (예: 비밀번호 재설정)
   - User Flow: 다양한 진입점과 분기를 포함하는 전체 여정
   - Wire Flow: User Flow + 각 단계의 와이어프레임 결합
3. **라우트 구조 분석**: `app/` 디렉토리 구조 파악, 깊이 3단계 초과/고아 페이지 검출

### 실행 단계

1. **Task Flow 다이어그램 (Mermaid)**
   ```mermaid
   flowchart TD
     A[랜딩 페이지] --> B{로그인 상태?}
     B -->|Yes| C[대시보드]
     B -->|No| D[로그인 / 회원가입]
     D --> E{신규?}
     E -->|Yes| F[온보딩] --> G[프로필 설정] --> C
     E -->|No| H[로그인 처리] --> C
     C --> I[핵심 기능]
     I --> J{성공?}
     J -->|Yes| K[완료 피드백]
     J -->|No| L[에러 안내 + 재시도] --> I
   ```

2. **사이트맵 구조 (Mermaid)**
   ```mermaid
   graph TD
     Root["/"] --> Marketing["(marketing)"]
     Root --> App["(app) 인증 필요"]
     Root --> Auth["(auth)"]
     Marketing --> Home["/홈"] & Pricing["/pricing"] & Blog["/blog"]
     Auth --> Login["/login"] & Register["/register"]
     App --> Dashboard["/dashboard"] & Projects["/projects"]
     Projects --> Detail["/projects/[id]"] --> Settings["/projects/[id]/settings"]
     App --> Account["/account"] --> Profile["/profile"] & Billing["/billing"]
   ```

3. **네비게이션 + Breadcrumb 구현**
   ```tsx
   function GlobalNav({ currentPath }: { currentPath: string }) {
     const items = [
       { href: "/dashboard", label: "대시보드", icon: HomeIcon },
       { href: "/projects", label: "프로젝트", icon: FolderIcon },
     ];
     return (
       <nav aria-label="메인 메뉴">
         <ul className="flex items-center gap-1">
           {items.map((item) => (
             <li key={item.href}>
               <a href={item.href}
                 aria-current={currentPath.startsWith(item.href) ? "page" : undefined}
                 className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                   currentPath.startsWith(item.href)
                     ? "bg-accent text-white" : "text-text-secondary hover:bg-surface-sunken"
                 )}>
                 <item.icon className="h-4 w-4" />{item.label}
               </a>
             </li>
           ))}
         </ul>
       </nav>
     );
   }
   function Breadcrumb({ segments }: { segments: { label: string; href?: string }[] }) {
     return (
       <nav aria-label="현재 위치">
         <ol className="flex items-center gap-1 text-sm text-text-muted">
           {segments.map((seg, i) => (
             <li key={i} className="flex items-center gap-1">
               {i > 0 && <span aria-hidden="true">/</span>}
               {seg.href
                 ? <a href={seg.href} className="hover:text-text-primary">{seg.label}</a>
                 : <span aria-current="page" className="text-text-primary font-medium">{seg.label}</span>}
             </li>
           ))}
         </ol>
       </nav>
     );
   }
   ```

4. **멀티 스텝 Stepper**
   ```tsx
   function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
     return (
       <nav aria-label="진행 단계">
         <ol className="flex items-center gap-4">
           {steps.map((label, i) => (
             <li key={i} className="flex items-center gap-2" aria-current={i === currentStep ? "step" : undefined}>
               <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                 i < currentStep && "bg-green-100 text-green-700",
                 i === currentStep && "bg-accent text-white",
                 i > currentStep && "bg-gray-100 text-gray-400"
               )}>{i < currentStep ? "✓" : i + 1}</span>
               <span className="text-sm">{label}</span>
               {i < steps.length - 1 && <div className={cn("h-px w-12", i < currentStep ? "bg-green-300" : "bg-gray-200")} aria-hidden="true" />}
             </li>
           ))}
         </ol>
       </nav>
     );
   }
   ```

5. **오류 복구 경로 (Mermaid)**
   ```mermaid
   flowchart TD
     A[사용자 액션] --> B{유효성 검사}
     B -->|통과| C[서버 요청]
     B -->|실패| D["인라인 에러 (필드별 안내)"] --> A
     C --> E{서버 응답}
     E -->|200| F[성공 + 다음 단계]
     E -->|400| G["폼 에러 표시"] --> A
     E -->|401| H["세션 만료 → 로그인 (상태 보존)"]
     E -->|500| I["재시도 버튼 + 고객센터"] --> C
   ```

### 검증 단계

1. [ ] 핵심 태스크가 3클릭 이내에 완료 가능한가
2. [ ] 모든 페이지에서 현재 위치를 인지할 수 있는가 (Breadcrumb, 활성 메뉴)
3. [ ] 뒤로 가기가 예상대로 동작하고, 에러 시 입력 데이터가 유지되는가
4. [ ] 고아 페이지(네비게이션 접근 불가)가 없고, 멀티 스텝에 진행률 표시가 있는가

## 도구 활용

- **WebSearch**: IA 설계 모범 사례(NNGroup), 네비게이션 패턴, Mermaid 문법
- **Read/Glob**: `app/**/page.tsx`, `app/**/layout.tsx`에서 라우트 구조 파악
- **Grep**: `<Link`, `router.push` 검색으로 페이지 간 연결 관계 분석

## 출력 형식

사용자 플로우 설계: 사이트맵(Mermaid), 핵심 Task Flow(Mermaid flowchart), 네비게이션 구조 테이블(유형|위치|항목|구현), 오류 복구 경로(Mermaid)

## Next.js App Router IA 패턴

### Route Group으로 IA 분리

```
app/
├── (marketing)/          # 비인증 영역
│   ├── page.tsx          # /
│   ├── pricing/page.tsx  # /pricing
│   └── blog/[slug]/page.tsx
├── (app)/                # 인증 필요 영역
│   ├── layout.tsx        # 사이드바 + 글로벌 네비게이션
│   ├── dashboard/page.tsx
│   └── projects/
│       ├── page.tsx              # /projects (목록)
│       └── [id]/
│           ├── page.tsx          # /projects/abc (상세)
│           └── settings/page.tsx # /projects/abc/settings
└── (auth)/
    ├── login/page.tsx
    └── register/page.tsx
```

**핵심**: Route depth 3단계 이내 유지. `/projects/[id]/settings`가 한계선 — 이 이상은 Parallel Routes나 Intercepting Routes로 평탄화한다.

### Intercepting Routes로 깊이 평탄화

```
app/(app)/projects/
├── [id]/page.tsx                    # 풀 페이지 상세
├── @modal/(.)projects/[id]/page.tsx # 목록에서 클릭 시 모달로 열기
```

URL 깊이를 늘리지 않고 목록→상세 전환을 모달로 처리. Instagram 스타일 UX.

## 폼 데이터 복구 패턴

### 세션 만료/에러 시 입력 보존

```tsx
// useFormPersist.ts — 입력 중인 폼 데이터를 sessionStorage에 자동 저장
function useFormPersist<T>(key: string, defaultValues: T) {
  const [values, setValues] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValues;
    const saved = sessionStorage.getItem(`form:${key}`);
    return saved ? JSON.parse(saved) : defaultValues;
  });

  useEffect(() => {
    sessionStorage.setItem(`form:${key}`, JSON.stringify(values));
  }, [key, values]);

  const clear = () => sessionStorage.removeItem(`form:${key}`);

  return { values, setValues, clear };
}
```

```tsx
// 사용 예시 — 결제 폼에서 401 발생 시에도 데이터 유지
function CheckoutForm() {
  const { values, setValues, clear } = useFormPersist("checkout", {
    name: "", email: "", plan: "pro",
  });

  async function handleSubmit() {
    const res = await fetch("/api/checkout", { method: "POST", body: JSON.stringify(values) });
    if (res.status === 401) {
      // 로그인 페이지로 이동 — sessionStorage에 폼 데이터 보존됨
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (res.ok) clear(); // 성공 시에만 삭제
  }
}
```

**원칙**: 서버 에러(4xx/5xx)로 폼이 리셋되면 사용자는 이탈한다. `sessionStorage`로 입력을 보존하고, 성공 시에만 `clear()`한다.

## 안티패턴

- **깊은 계층**: 5단계 이상 URL 깊이는 위치 파악이 어렵다. 최대 3단계로 평탄화
- **막다른 페이지(Dead End)**: 다음 행동을 안내하지 않는 페이지. 성공/에러/빈 상태 모두 CTA 제공
- **숨겨진 핵심 기능**: 3단계 이상 메뉴 깊이에 숨긴 핵심 기능은 발견되지 못한다
- **일관성 없는 네비게이션**: 페이지마다 메뉴 구성이 달라지면 학습 비용 급증
- **뒤로 가기 파괴**: SPA에서 히스토리를 가로채면 사용자 혼란. 의미 있는 단계를 히스토리에 기록
- **폼 데이터 손실**: 에러/세션 만료 시 사용자 입력을 날리면 이탈률 급증. 반드시 `sessionStorage`로 보존
