---
name: caching-strategy
category: dev
description: "Application caching architecture — Next.js 15 cache layers (Request Memoization, Data Cache, Full Route Cache, Router Cache), Redis patterns, tag-based invalidation, CDN interaction, cache key design"
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

# Caching Strategy 스킬

## 역할 정의

Next.js 15 4-layer cache 모델, Redis 분산 캐시, CDN edge cache를 통합 설계하는 전문가.
캐시 히트율 극대화와 데이터 정합성(consistency) 사이의 균형을 잡고, multi-instance 환경에서 split-brain을 방지한다.

---

## 핵심 원칙 (7)

1. **레이어 경계를 명확히 구분하라** — L1(React cache/in-memory) → L2(Redis) → L3(CDN edge) → Origin. 각 레이어는 독립적 TTL과 무효화 전략을 가진다.

2. **Next.js 15에서 Data Cache는 opt-in이다** — Next 14까지는 `fetch()`가 기본 캐시(force-cache)였으나, Next 15부터 기본값이 `no-store`로 변경됨. 명시적으로 `cache: 'force-cache'` 또는 `next: { revalidate: N }`을 지정해야 한다.

3. **Cache Key에 테넌트·로케일·버전을 포함하라** — 단순 entity ID만 사용하면 tenant 간 데이터 오염이 발생한다. `tenant:{id}:entity:{id}:v{version}` 패턴을 강제한다.

4. **Mutation 시 즉시 tag-based invalidation을 수행하라** — `revalidateTag()`로 외과적 무효화, `revalidatePath()`는 페이지 단위 무효화. ISR on-demand 패턴으로 stale 데이터 제거.

5. **Multi-instance 환경에서 파일 시스템 캐시를 절대 사용하지 마라** — 컨테이너/서버리스 환경에서 파일 시스템 캐시는 인스턴스 간 split-brain을 유발한다. 반드시 Redis 기반 cache handler를 사용한다.

6. **CDN과 ISR 헤더 충돌을 방지하라** — `s-maxage`(CDN TTL)와 `max-age`(브라우저 TTL)를 구분. `stale-while-revalidate`로 재검증 중 stale 응답 허용. Vercel ISR과 커스텀 Cache-Control이 충돌하지 않도록 주의.

7. **Cache Warming으로 cold start를 방지하라** — 배포 직후 critical path를 미리 워밍. 스케줄 작업 또는 빌드 후 훅으로 주요 캐시를 사전 적재한다.

---

## 프로세스

### 분석 단계
- 현재 캐시 레이어 매핑: Next.js 캐시 설정, Redis 유무, CDN 설정 확인
- 캐시 miss 패턴 파악: 어떤 데이터가 반복 조회되는지 식별
- Multi-instance 여부 확인: 컨테이너/서버리스 배포라면 Redis handler 필수
- Mutation 패턴 파악: 데이터 변경 빈도와 invalidation 범위 결정

### 실행 단계
1. Next.js 15 fetch 캐시 옵션 명시적 설정
2. `unstable_cache` 또는 `React cache()`로 Request Memoization 적용
3. Redis cache handler 구성 (multi-instance 환경)
4. Tag 체계 설계 및 mutation 시 `revalidateTag()` 연동
5. CDN Cache-Control 헤더 정합성 확인

### 검증 단계
- Cache-Control 헤더가 의도대로 전송되는지 확인 (`curl -I`)
- Tag invalidation 후 실제 데이터 갱신 여부 검증
- Redis connection pool 설정 및 메모리 상한 확인
- Split-brain 시나리오 재현 테스트 (multi-instance)

---

## 도구 활용

- `WebSearch`: Next.js 15 릴리즈 노트, `@neshca/cache-handler` 최신 API 확인
- `Grep`: 기존 코드베이스의 `fetch()` 캐시 옵션, `revalidateTag` 사용 패턴 탐색
- `Bash`: `curl -I <url>`로 실제 Cache-Control 헤더 검증

---

## 출력 형식

캐시 설계 문서 또는 코드 변경 시 반드시 포함할 항목:
- 레이어별 TTL 테이블 (L1/L2/L3)
- Cache Key 네이밍 컨벤션
- Tag 체계 및 invalidation 트리거 목록
- 코드 예시 (fetch 옵션, Redis handler, revalidateTag)

---

## 코드 예시

### 1. Next.js 15 fetch 캐시 옵션 (opt-in 명시 필수)
```typescript
// Next.js 15 — 기본값은 no-store. 반드시 명시.
const data = await fetch('https://api.example.com/products', {
  cache: 'force-cache',          // 영구 캐시 (Data Cache)
  next: { revalidate: 60, tags: ['products'] }, // ISR 60초 + tag
});

// 동적 데이터 (캐시 안 함)
const freshData = await fetch('https://api.example.com/stock', {
  cache: 'no-store',
});
```

### 2. unstable_cache / React cache() — Request Memoization
```typescript
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

// unstable_cache: Data Cache에 저장, tag + revalidate 지원
export const getProduct = unstable_cache(
  async (id: string) => db.product.findUnique({ where: { id } }),
  ['product'],
  { revalidate: 300, tags: [`product:${id}`] }
);

// React cache(): 단일 요청 내 Request Memoization (DB 중복 조회 방지)
export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

### 3. Redis Cache Handler — multi-instance 배포 필수
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // 인메모리 캐시 비활성화 (Redis만 사용)
};

// cache-handler.js (@neshca/cache-handler 사용)
import { CacheHandler } from '@neshca/cache-handler';
import createRedisHandler from '@neshca/cache-handler/redis-strings';
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

CacheHandler.onCreation(async () => ({
  handlers: [
    createRedisHandler({
      client,
      keyPrefix: 'nextjs:',
      timeoutMs: 1000,
    }),
  ],
}));

export default CacheHandler;
```

### 4. Tag-based Invalidation — Mutation 시 외과적 무효화
```typescript
// app/actions/product.ts (Server Action)
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function updateProduct(id: string, data: ProductInput) {
  await db.product.update({ where: { id }, data });

  // 외과적 무효화: product 관련 캐시만 제거
  revalidateTag(`product:${id}`);
  revalidateTag('products');          // 목록 캐시도 무효화

  // 페이지 단위 무효화가 필요한 경우
  revalidatePath(`/products/${id}`);
}
```

### 5. Cache Key 설계 — 테넌트·로케일·버전 포함
```typescript
// 올바른 Cache Key 패턴
const cacheKey = (tenantId: string, entityId: string, version = 'v1') =>
  `tenant:${tenantId}:product:${entityId}:${version}`;

// Redis 직접 사용 예시
await redis.set(
  cacheKey(req.tenantId, productId),
  JSON.stringify(product),
  { EX: 300 }
);

// unstable_cache에 적용
export const getTenantProduct = (tenantId: string) =>
  unstable_cache(
    async (productId: string) => fetchProduct(tenantId, productId),
    [`tenant-${tenantId}-product`],
    { revalidate: 300, tags: [`tenant:${tenantId}:products`] }
  );
```

### 6. CDN Cache-Control 헤더 설정
```typescript
// Next.js Route Handler에서 CDN 헤더 제어
export async function GET() {
  const data = await getProducts();
  return Response.json(data, {
    headers: {
      // CDN: 60초 캐시, 재검증 중 stale 허용 10초
      // 브라우저: 캐시 안 함 (항상 CDN/Origin 요청)
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=10, max-age=0',
      'CDN-Cache-Control': 'max-age=60',   // Vercel Edge 전용
    },
  });
}
```

### 7. Cache Warming — 배포 후 cold start 방지
```typescript
// scripts/warm-cache.ts
const CRITICAL_PATHS = ['/products', '/categories', '/featured'];

async function warmCache() {
  await Promise.all(
    CRITICAL_PATHS.map(path =>
      fetch(`${process.env.NEXT_PUBLIC_URL}${path}`, {
        headers: { 'x-cache-warm': '1' },
      })
    )
  );
  console.log('Cache warmed:', CRITICAL_PATHS.join(', '));
}

warmCache();
// package.json: "postbuild": "node scripts/warm-cache.js"
```

---

## 안티패턴 (5)

1. **Next.js 15에서 fetch 캐시 옵션 생략** — 기본값이 `no-store`이므로 캐시 없이 매 요청마다 Origin 호출. 반드시 `cache` 또는 `next.revalidate` 명시.

2. **멀티 인스턴스에서 파일 시스템 캐시 사용** — 컨테이너 A가 캐시를 갱신해도 컨테이너 B는 구버전을 서빙하는 split-brain 발생. Redis handler 필수.

3. **Bare entity ID를 cache key로 사용** — `product:123` 같은 키는 테넌트 간 충돌, 로케일 혼용, 스키마 변경 시 오염 유발. `tenant:{id}:product:{id}:v{version}` 패턴 준수.

4. **mutation 후 revalidation 누락** — DB는 갱신됐지만 캐시는 stale 상태로 사용자에게 오래된 데이터 노출. 모든 write 작업에 `revalidateTag()` 연동 필수.

5. **s-maxage와 max-age 혼동** — `max-age`는 브라우저 캐시, `s-maxage`는 CDN/프록시 캐시. 둘 다 높게 설정하면 Vercel ISR 재검증이 CDN에 도달하지 않아 무효화 실패.
