---
name: file-upload
category: dev
description: "File upload and storage architecture — S3/R2 presigned URLs, multipart upload, image processing pipeline, CORS configuration, content validation, and CDN serving"
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

# File Upload & Storage Architecture

## 역할 정의

파일 업로드 및 스토리지 아키텍처 전문가로서, S3/R2 presigned URL 패턴, multipart upload 오케스트레이션, 이미지 처리 파이프라인, 콘텐츠 유효성 검증, CDN 서빙 전략을 구현한다. 서버를 통한 파일 스트리밍 없이 클라이언트에서 스토리지로 직접 업로드하는 아키텍처를 설계한다.

## 핵심 원칙

1. **Presigned URL direct upload**: API 서버는 절대 파일 바이트를 처리하지 않는다 — presigned PUT URL 생성 후 클라이언트가 S3/R2에 직접 업로드
2. **Multipart upload for large files**: 100MB 이상은 반드시 multipart — InitiateMultipartUpload → 각 파트별 presigned URL → CompleteMultipartUpload
3. **Image processing pipeline**: 업로드 완료 이벤트 → Lambda/Worker에서 Sharp로 리사이징 → 변형본(thumbnail/medium/large) 저장 → DB 업데이트
4. **CORS 정밀 설정**: multipart upload에서 ETag 헤더 노출 필수 — `ExposeHeaders: ["ETag"]` 없으면 브라우저가 차단
5. **Content validation 이중 검증**: presigned URL 조건(content-type, content-length-range) + 서버사이드 magic bytes 검증
6. **CDN serving**: 파일은 항상 CloudFront/R2 커스텀 도메인으로 서빙, 직접 S3 URL 노출 금지
7. **Storage lifecycle**: 미완료 multipart 자동 정리(7일), 임시 파일 TTL, 원본 보존 + 변형본 별도 버킷

## 프로세스

### 분석 단계

1. **업로드 규모 파악**: 단일 파일 최대 크기, 동시 업로드 수, 파일 타입(이미지/문서/동영상) 확인
2. **스토리지 요구사항**: S3 vs R2 선택 기준(비용: R2 egress 무료), 버킷 구조(public/private), 접근 제어 방식
3. **처리 파이프라인 필요 여부**: 이미지 리사이징, 바이러스 스캔, 메타데이터 추출 등 후처리 작업 범위 결정

### 실행 단계

#### Step 1: Presigned URL 생성 API (Next.js)

```typescript
// app/api/upload/presigned/route.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: Request) {
  const { filename, contentType, size } = await req.json();

  // content-type 화이트리스트 검증
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(contentType)) {
    return Response.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const key = `uploads/${nanoid()}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    // 서버사이드 암호화
    ServerSideEncryption: "AES256",
  });

  const presignedUrl = await getSignedUrl(s3, command, {
    expiresIn: 300, // 5분
  });

  return Response.json({ presignedUrl, key });
}
```

#### Step 2: 클라이언트 직접 업로드 with Progress

```typescript
// hooks/useFileUpload.ts
export async function uploadFile(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  // 1. presigned URL 획득
  const { presignedUrl, key } = await fetch("/api/upload/presigned", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  }).then((r) => r.json());

  // 2. S3/R2에 직접 PUT (서버 거치지 않음)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(xhr.statusText));
    xhr.onerror = reject;
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });

  return key;
}
```

#### Step 3: Multipart Upload (100MB+)

```typescript
// lib/multipart-upload.ts
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PART_SIZE = 10 * 1024 * 1024; // 10MB per part

export async function multipartUpload(file: File, key: string) {
  // 1. Initiate
  const { UploadId } = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: file.type,
    })
  );

  const partCount = Math.ceil(file.size / PART_SIZE);

  // 2. 각 파트별 presigned URL 생성 (API에서 처리)
  const partUrls: string[] = await fetch("/api/upload/multipart-urls", {
    method: "POST",
    body: JSON.stringify({ key, uploadId: UploadId, partCount }),
  }).then((r) => r.json());

  // 3. 병렬 파트 업로드 (ETag 수집 — CORS ExposeHeaders 필수)
  const parts = await Promise.all(
    partUrls.map(async (url, i) => {
      const start = i * PART_SIZE;
      const chunk = file.slice(start, start + PART_SIZE);
      const res = await fetch(url, { method: "PUT", body: chunk });
      const etag = res.headers.get("ETag"); // CORS ExposeHeaders: ["ETag"] 없으면 null
      return { PartNumber: i + 1, ETag: etag! };
    })
  );

  // 4. Complete
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId,
      MultipartUpload: { Parts: parts },
    })
  );
}
```

#### Step 4: S3 CORS 설정 (multipart ETag 노출 필수)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

#### Step 5: Sharp 이미지 처리 Worker

```typescript
// workers/image-processor.ts (Cloudflare Worker / Lambda)
import Sharp from "sharp";

const VARIANTS = {
  thumbnail: { width: 150, height: 150, fit: "cover" as const },
  medium: { width: 800, height: 600, fit: "inside" as const },
  large: { width: 1920, height: 1080, fit: "inside" as const },
};

export async function processImage(s3Key: string) {
  const original = await downloadFromS3(s3Key);

  const results = await Promise.all(
    Object.entries(VARIANTS).map(async ([name, opts]) => {
      const buffer = await Sharp(original)
        .resize(opts)
        .webp({ quality: 85 })
        .toBuffer();

      const variantKey = s3Key.replace("uploads/", `processed/${name}/`);
      await uploadToS3(variantKey, buffer, "image/webp");
      return { name, key: variantKey };
    })
  );

  // DB 업데이트
  await db.file.update({
    where: { key: s3Key },
    data: {
      variants: results,
      status: "processed",
      processedAt: new Date(),
    },
  });
}
```

#### Step 6: CDN 서빙 URL 생성

```typescript
// lib/cdn.ts
export function getCdnUrl(key: string, variant?: "thumbnail" | "medium" | "large"): string {
  const cdnBase = process.env.CDN_BASE_URL; // https://cdn.yourdomain.com
  const finalKey = variant ? key.replace("uploads/", `processed/${variant}/`) : key;
  return `${cdnBase}/${finalKey}`;
}

// 다운로드용: Content-Disposition 헤더 포함 presigned URL
export async function getDownloadUrl(key: string, filename: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
```

### 검증 단계

- [ ] presigned URL 만료 시간이 업로드 예상 시간보다 충분히 긴가 (최소 5분)
- [ ] S3 CORS에 `ExposeHeaders: ["ETag"]` 포함되어 있는가
- [ ] content-type 화이트리스트가 서버에서 검증되는가
- [ ] content-length-range 조건으로 최대 파일 크기 제한이 적용되는가
- [ ] 미완료 multipart upload 자동 정리 lifecycle 정책이 설정되어 있는가
- [ ] CDN URL만 클라이언트에 노출되고 직접 S3 URL은 숨겨져 있는가
- [ ] 이미지 처리 실패 시 원본 파일은 보존되는가
- [ ] 바이러스 스캔(ClamAV/S3 Malware Protection) 또는 magic bytes 검증이 있는가

## 도구 활용

- **WebSearch**: AWS SDK v3 최신 API 변경사항, R2 CORS 설정 차이점 확인
- **Read/Glob**: 기존 업로드 관련 코드와 스토리지 설정 파악
- **Bash**: `aws s3api get-bucket-cors` / `put-bucket-cors`로 CORS 설정 확인 및 적용
- **Write/Edit**: presigned URL 생성 API, 클라이언트 업로드 훅, 이미지 처리 Worker 구현

## 출력 형식

```markdown
## 파일 업로드 아키텍처

### 업로드 플로우
1. Client → API: presigned URL 요청 (metadata만)
2. API → S3/R2: presigned URL 생성 (5분 TTL)
3. Client → S3/R2: 직접 PUT 업로드
4. S3/R2 → Worker: 이벤트 트리거 (이미지 처리)
5. Worker → DB: 처리 완료 업데이트

### 구현 파일
- `app/api/upload/presigned/route.ts` — presigned URL 생성
- `hooks/useFileUpload.ts` — 클라이언트 업로드 훅
- `workers/image-processor.ts` — Sharp 이미지 처리
- `lib/cdn.ts` — CDN URL 유틸리티

### CORS 설정 위치
S3 버킷 CORS: ExposeHeaders에 ETag 포함 필수
```

## 안티패턴

1. **서버 프록시 업로드**: `req.pipe(s3.upload())` 패턴 — 서버 메모리/대역폭 낭비, presigned URL로 대체
2. **ETag CORS 누락**: `ExposeHeaders: ["ETag"]` 없이 multipart upload 구현 — 브라우저에서 ETag가 null로 반환되어 CompleteMultipartUpload 실패
3. **파일 확장자만 검증**: `.jpg` 확장자 체크만으로 파일 타입 신뢰 — magic bytes(`\xff\xd8\xff` for JPEG) 서버사이드 검증 필수
4. **S3 직접 URL 노출**: `s3.amazonaws.com/bucket/key` 형태의 URL을 DB에 저장하거나 클라이언트에 반환 — 버킷 이전/CDN 변경 시 전체 URL 깨짐
5. **이미지 처리 동기 실행**: 업로드 API에서 Sharp 리사이징 직접 실행 — 타임아웃 위험, S3 이벤트 기반 비동기 Worker로 분리 필수
