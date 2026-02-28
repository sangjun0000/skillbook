---
name: i18n-localization
category: dev
description: "Internationalization architecture — next-intl App Router integration, ICU MessageFormat, Server Component translation, RTL layout support, Intl API formatting, locale negotiation middleware"
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

# i18n-Localization Skill

## 역할 정의

App Router 기반 Next.js 애플리케이션의 국제화(i18n)를 설계하고 구현한다.
next-intl을 중심으로 Server/Client Component 번역 전략, ICU MessageFormat, RTL 레이아웃, Intl API 포매팅, 미들웨어 기반 locale 협상을 다룬다.

---

## 핵심 원칙 (7)

1. **next-intl이 App Router 표준이다** — `next-i18next`는 Pages Router 전용. App Router에서는 반드시 `next-intl` 사용.
2. **Server Component 우선** — 번역 목적만으로 `"use client"`를 붙이지 않는다. `getTranslations()`는 JS bundle에 포함되지 않는다.
3. **ICU MessageFormat으로 동적 메시지 처리** — 복수형/성별/조건을 문자열 연결로 구현하지 않는다.
4. **Intl API로 로케일 인식 포매팅** — 날짜/숫자/상대시간은 `Intl.*` 또는 next-intl `useFormatter()`로 처리한다.
5. **CSS 논리 속성(Logical Properties)으로 RTL 지원** — `margin-left` 대신 `margin-inline-start`. 방향 고정 속성은 RTL에서 깨진다.
6. **Middleware가 locale 진입점** — Accept-Language, 쿠키, URL 순으로 협상하고, 누락 locale은 미들웨어에서 redirect한다.
7. **타입 안전성 유지** — `useTranslations<'Namespace'>()`로 네임스페이스를 고정하고, 메시지 키를 타입 추론한다.

---

## 프로세스

### 분석
- 지원 locale 목록과 기본 locale 결정 (`defaultLocale`)
- Server Component vs Client Component 번역 필요 여부 구분
- RTL 언어 포함 여부 확인 (Arabic, Hebrew, Persian 등)
- 날짜/숫자 포매팅 요구사항 파악

### 실행 — next-intl App Router 완전 설정

**1. 패키지 설치**
```bash
npm install next-intl
```

**2. `src/i18n.ts` — 요청별 메시지 로더**
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**3. `middleware.ts` — locale 협상**
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

**4. `src/i18n/routing.ts` — 라우팅 설정**
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en', 'ar'],
  defaultLocale: 'ko',
  localePrefix: 'always',         // URL에 항상 /ko/, /en/ 포함
  localeCookie: true,             // 쿠키 기반 locale 저장
});

// createNavigation: Link, redirect, useRouter를 locale-aware로 교체
export const { Link, redirect, useRouter, usePathname } =
  createNavigation(routing);
```

**5. `app/[locale]/layout.tsx` — HTML lang + dir 설정**
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) notFound();

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';  // RTL 언어 감지

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**6. Server Component에서 번역 사용**
```typescript
// app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  // getTranslations: Server Component 전용 — JS bundle 미포함
  const t = await getTranslations('Home');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </main>
  );
}
```

**7. Client Component에서 번역 사용**
```typescript
'use client';
import { useTranslations } from 'next-intl';

// 번역 외 다른 이유가 있을 때만 "use client" 사용
export function Counter({ count }: { count: number }) {
  const t = useTranslations('Counter');
  return <span>{t('label', { count })}</span>;
}
```

---

### ICU MessageFormat — 복수형, 성별, 중첩

```json
// messages/ko.json
{
  "Cart": {
    "itemCount": "{count, plural, =0 {항목 없음} one {# 개} other {# 개}}",
    "greeting": "{gender, select, male {그는} female {그녀는} other {그들은}} 로그인했습니다",
    "deadline": "{days, plural, =0 {오늘 마감} one {내일 마감} other {# 일 후 마감}}",
    "richText": "가격: <bold>{price}</bold>"
  }
}
```

```typescript
// 복수형 사용
t('itemCount', { count: 3 })         // "3 개"
t('greeting', { gender: 'female' })  // "그녀는 로그인했습니다"

// Rich text (React 컴포넌트 삽입)
t.rich('richText', {
  price: formatCurrency(9900),
  bold: (chunks) => <strong>{chunks}</strong>,
})
```

---

### Intl API 포매팅 — 날짜/숫자/상대시간

```typescript
'use client';
import { useFormatter } from 'next-intl';

export function ProductCard({ price, date, updatedAt }: Props) {
  const format = useFormatter();

  return (
    <div>
      {/* 로케일 인식 통화 포매팅 */}
      <p>{format.number(price, { style: 'currency', currency: 'KRW' })}</p>

      {/* 로케일 인식 날짜 포매팅 */}
      <time>{format.dateTime(date, { dateStyle: 'long' })}</time>

      {/* 상대시간: "3분 전", "2 days ago" */}
      <span>{format.relativeTime(updatedAt)}</span>
    </div>
  );
}

// Server Component에서는 getFormatter() 사용
import { getFormatter } from 'next-intl/server';
const format = await getFormatter();
```

---

### RTL 지원 — CSS 논리 속성

```css
/* 잘못된 방식 — RTL에서 방향이 반전됨 */
.card { margin-left: 16px; padding-right: 24px; }

/* 올바른 방식 — 논리 속성(Logical Properties) */
.card {
  margin-inline-start: 16px;   /* LTR: left, RTL: right */
  padding-inline-end: 24px;    /* LTR: right, RTL: left */
  border-inline-start: 2px solid;  /* 시작 방향 테두리 */
}

/* Tailwind CSS v3 논리 유틸리티 */
/* ms-4 = margin-inline-start: 1rem */
/* pe-6 = padding-inline-end: 1.5rem */
```

```typescript
// Tailwind + RTL 예시
<div className="ms-4 pe-6 border-s-2 text-start">
  {/* ms(margin-start), pe(padding-end), border-s, text-start */}
  {/* RTL 언어에서 자동으로 방향 전환 */}
</div>
```

---

### 동적 locale 전환

```typescript
'use client';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLocale = (locale: string) => {
    router.replace(pathname, { locale });
  };

  return (
    <select value={currentLocale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="ko">한국어</option>
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}
```

---

### 검증

- `[locale]` 세그먼트 없는 URL 접근 시 미들웨어가 올바르게 redirect하는가
- `notFound()`가 지원하지 않는 locale에서 호출되는가
- ICU 복수형이 0/1/other 케이스 모두 처리되는가
- RTL 언어에서 레이아웃 깨짐 없는가 (`dir="rtl"` + 논리 속성)
- 타입 에러 없이 메시지 키가 추론되는가

---

## 도구 활용

- **Glob**: `messages/*.json` — 번역 파일 구조 파악
- **Grep**: `useTranslations|getTranslations` — 번역 사용 위치 탐색
- **Read**: `next.config.ts`, `middleware.ts` — 기존 설정 확인
- **WebSearch**: next-intl 최신 API 변경사항 확인 (버전 주의)

---

## 출력 형식

1. 지원 locale 목록과 기본 locale 명시
2. 파일 경로 포함 완전한 설정 코드 (`i18n.ts`, `routing.ts`, `middleware.ts`, `layout.tsx`)
3. 메시지 JSON 구조 예시 (ICU 포함)
4. RTL 언어 포함 시 논리 속성 적용 가이드

---

## 안티패턴 (5)

1. **next-i18next를 App Router에 사용** — Pages Router 전용 라이브러리. App Router에서는 작동하지 않거나 클라이언트 번들에 불필요한 JS를 포함시킨다.
2. **번역만을 위한 "use client"** — `getTranslations()`로 Server Component에서 처리 가능. 불필요한 클라이언트 컴포넌트 전환은 bundle 크기 증가.
3. **문자열 연결로 복수형 처리** — `count + "개"` 방식은 언어별 복수형 규칙을 무시한다. ICU `plural` 형식 사용.
4. **방향 고정 CSS 속성** — `margin-left`, `padding-right`, `float: left`는 RTL에서 레이아웃을 반전시킨다. CSS 논리 속성으로 교체.
5. **locale 타입 미검증** — URL parameter의 locale을 검증 없이 사용하면 임의 locale로 에러 발생. `routing.locales.includes()` 또는 `notFound()` 처리 필수.
