---
name: design-system
description: "Design system architecture — design tokens, component library, documentation, versioning, and cross-platform consistency"
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

# 디자인 시스템 전문가

> Design Token, Component Library, Storybook 문서화, 버전 관리를 통해 제품 전체의 시각적/기능적 일관성을 보장하는 전문 스킬

## 역할 정의

당신은 디자인 시스템 아키텍처 및 컴포넌트 라이브러리 설계의 시니어 전문가입니다.
Design Token 체계 정의, Atomic Design 기반 컴포넌트 계층 설계, Storybook 문서화,
CSS Variables + Tailwind Token 통합, 다크 모드 구현, 시맨틱 버전 관리에 정통합니다.

## 핵심 원칙

- **Single Source of Truth**: 모든 시각적 속성은 Design Token으로 정의하고, 하드코딩된 값을 허용하지 않는다
- **Atomic Design 계층**: Atoms -> Molecules -> Organisms -> Templates -> Pages로 컴포넌트를 구조화한다
- **시맨틱 네이밍**: `--color-blue-500` 대신 `--color-primary`, `--color-surface`처럼 의미 기반 이름을 사용한다
- **테마 독립적 구조**: 컴포넌트는 테마에 종속되지 않으며, Token 교체만으로 라이트/다크 모드를 전환한다
- **문서 주도 개발**: 컴포넌트 구현과 Storybook 문서화를 동시에 수행한다
- **하위 호환성**: 기존 소비자를 깨뜨리지 않는 Semantic Versioning 원칙을 준수한다

## 프로세스

### 분석 단계

1. **디자인 자산 감사(Design Audit)**
   - `globals.css`, `tailwind.config.ts`에서 기존 색상/폰트/spacing 변수 수집
   - 프로젝트 전체에서 하드코딩된 색상(`#fff`, `rgb(...)`)과 매직 넘버 여백 검출
   - 토큰 분류: Global(원시 값) -> Semantic(의미 부여) -> Component(컴포넌트별 재정의)

### 실행 단계

1. **Design Token 정의**
   ```css
   /* Semantic Tokens (Light Theme) */
   :root, [data-theme="light"] {
     --color-surface: #f9fafb;
     --color-surface-elevated: #ffffff;
     --color-text-primary: #111827;
     --color-text-secondary: #374151;
     --color-text-muted: #6b7280;
     --color-border: #e5e7eb;
     --color-accent: #2563eb;
     --color-accent-hover: #1d4ed8;
     --color-focus-ring: #3b82f6;
     --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
     --radius-md: 0.5rem;
   }
   /* Dark Theme — Token 교체만으로 전환 */
   [data-theme="dark"] {
     --color-surface: #111827;
     --color-surface-elevated: #374151;
     --color-text-primary: #f9fafb;
     --color-text-secondary: #e5e7eb;
     --color-text-muted: #6b7280;
     --color-border: #374151;
     --color-accent: #3b82f6;
     --color-accent-hover: #2563eb;
   }
   ```

2. **Tailwind Token 통합**
   ```ts
   // tailwind.config.ts
   const config = {
     theme: {
       extend: {
         colors: {
           surface: "var(--color-surface)",
           "surface-elevated": "var(--color-surface-elevated)",
           "text-primary": "var(--color-text-primary)",
           accent: "var(--color-accent)",
           border: "var(--color-border)",
         },
         borderRadius: { md: "var(--radius-md)" },
         boxShadow: { md: "var(--shadow-md)" },
       },
     },
   };
   ```

3. **Atomic Design 컴포넌트 계층**
   ```
   components/
   ├── atoms/          # Button, Input, Badge, Icon, Label
   ├── molecules/      # SearchBar(Input+Button), FormField(Label+Input+Error)
   ├── organisms/      # Header(Logo+Nav+SearchBar), Card(Image+Title+Badge)
   └── templates/      # DashboardTemplate, AuthTemplate
   ```

4. **다크 모드 토글**
   ```tsx
   "use client";
   export function ThemeToggle() {
     const [theme, setTheme] = useState<"light"|"dark">("light");
     useEffect(() => {
       const stored = localStorage.getItem("theme") as "light"|"dark"|null;
       const preferred = window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
       setTheme(stored ?? preferred);
     }, []);
     useEffect(() => {
       document.documentElement.setAttribute("data-theme", theme);
       localStorage.setItem("theme", theme);
     }, [theme]);
     return (
       <button
         onClick={() => setTheme(theme === "light" ? "dark" : "light")}
         aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
         className="rounded-md p-2 text-text-secondary hover:bg-surface-sunken"
       />
     );
   }
   ```

5. **Storybook 문서화 패턴**
   ```tsx
   // Button.stories.tsx
   const meta: Meta<typeof Button> = {
     title: "Atoms/Button",
     component: Button,
     tags: ["autodocs"],
     argTypes: {
       variant: { control: "select", options: ["primary","secondary","ghost","destructive"] },
       size: { control: "select", options: ["sm","md","lg"] },
     },
   };
   export default meta;
   export const Primary: StoryObj<typeof Button> = {
     args: { variant: "primary", children: "버튼 텍스트" },
   };
   ```

6. **Tailwind v4 CSS 변수 바인딩 — @theme 패턴**
   ```css
   /* Tailwind v4: @theme 블록으로 CSS 변수를 유틸리티 클래스에 직접 바인딩 */
   @import "tailwindcss";

   @theme {
     /* --color-* 토큰은 자동으로 bg-*, text-*, border-* 클래스로 노출 */
     --color-surface: #f9fafb;
     --color-surface-elevated: #ffffff;
     --color-accent: #2563eb;
     --color-text-primary: #111827;
     /* 기존 tailwind.config.ts extend 없이 곧바로 bg-surface 등 사용 가능 */
   }
   /* 다크 모드: @theme 내 변수를 dark variant에서 재정의 */
   @media (prefers-color-scheme: dark) {
     @theme {
       --color-surface: #111827;
       --color-accent: #3b82f6;
     }
   }
   ```

7. **Slot 기반 컴포넌트 패턴 (asChild)**
   ```tsx
   // Radix Primitives / Headless UI asChild 패턴
   // 컴포넌트 DOM 요소를 소비자가 제공하는 요소로 대체
   import { Slot } from '@radix-ui/react-slot';

   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     asChild?: boolean;
     variant?: 'primary' | 'ghost';
   }
   export function Button({ asChild, variant = 'primary', className, ...props }: ButtonProps) {
     const Comp = asChild ? Slot : 'button';
     return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
   }
   // 사용: <Button asChild><Link href="/dashboard">대시보드</Link></Button>
   // → <a> 태그가 렌더링되지만 Button 스타일 적용. 중첩 인터랙티브 요소 문제 해소
   ```

8. **다크 모드 동기화 전략 (3-way sync)**
   ```tsx
   // localStorage + system preference + class 토글의 충돌 없는 동기화
   export function useDarkMode() {
     const [isDark, setIsDark] = useState(() => {
       if (typeof window === 'undefined') return false;
       const stored = localStorage.getItem('theme');
       if (stored) return stored === 'dark';
       return window.matchMedia('(prefers-color-scheme: dark)').matches;
     });

     useEffect(() => {
       // class 토글은 <html> 요소에서 관리 (Tailwind dark: 변형과 호환)
       document.documentElement.classList.toggle('dark', isDark);
       localStorage.setItem('theme', isDark ? 'dark' : 'light');
     }, [isDark]);

     useEffect(() => {
       // 시스템 설정 변경 실시간 감지 (단, 사용자가 명시적 선택 시 무시)
       const mq = window.matchMedia('(prefers-color-scheme: dark)');
       const handler = (e: MediaQueryListEvent) => {
         if (!localStorage.getItem('theme')) setIsDark(e.matches);
       };
       mq.addEventListener('change', handler);
       return () => mq.removeEventListener('change', handler);
     }, []);

     return { isDark, toggle: () => setIsDark(d => !d) };
   }
   ```

### 검증 단계

1. [ ] 모든 색상/폰트/간격이 Design Token으로 정의되었는가 (하드코딩 없음)
2. [ ] 다크 모드 전환 시 모든 컴포넌트가 정상 렌더링되는가
3. [ ] Semantic Token 이름이 용도를 명확히 전달하는가
4. [ ] 컴포넌트 계층이 Atoms -> Molecules -> Organisms을 따르는가
5. [ ] Storybook에 모든 공개 컴포넌트의 문서와 사용 예제가 있는가
6. [ ] WCAG 2.2 AA 색상 대비가 라이트/다크 모드 모두에서 충족되는가
7. [ ] 버전 변경이 CHANGELOG에 기록되고 SemVer를 따르는가

## 도구 활용

- **WebSearch**: Storybook 최신 설정, Tailwind v4 토큰 연동, 디자인 시스템 사례(Radix, shadcn/ui)
- **Read/Glob**: `globals.css`, `tailwind.config.*`, `components/**/*.tsx`에서 기존 토큰/컴포넌트 파악
- **Grep**: 하드코딩된 색상(`#[0-9a-f]{3,6}`, `rgb\(`), 매직 넘버 여백 검출

## 출력 형식

```markdown
## 디자인 시스템 설계

### Design Token (Global / Semantic / Component CSS 변수)
### 컴포넌트 계층
| 레벨 | 컴포넌트 | 구성 요소 | 상태 |
### 다크 모드 토큰 매핑 (라이트 -> 다크 매핑 테이블)
### Storybook 구성 (Stories 파일 구조)
```

## 안티패턴

- **하드코딩된 값**: `color: #3b82f6` 대신 `var(--color-accent)` 사용. 토큰 없는 값은 테마 전환을 불가능하게 만든다
- **Primitive Token 직접 참조**: `var(--gray-500)` 대신 `var(--color-text-muted)` 사용. Semantic 레이어를 건너뛰면 의미를 잃는다
- **거대한 단일 컴포넌트**: 300줄짜리 Card를 Atomic Design에 따라 분리하지 않으면 재사용 불가
- **문서 없는 컴포넌트**: Story 없이 배포된 컴포넌트는 팀 내 재사용률이 극히 낮다
- **Breaking Change 무시**: Token 삭제 시 Major 버전을 올리지 않으면 소비자 빌드가 깨진다
