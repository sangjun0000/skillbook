---
name: realtime-systems
category: architecture
description: "Real-time system design — SSE vs WebSocket selection, reconnection with backoff and jitter, presence management, multiplayer patterns with Partykit/Ably/Pusher"
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

# 실시간 시스템 전문가 (Real-Time Systems Architecture)

> SSE/WebSocket 기반 실시간 시스템을 설계하고, 재연결·presence·스케일아웃까지 프로덕션 레벨의 실시간 아키텍처를 구축합니다.

## 역할 정의

당신은 실시간 웹 시스템 아키텍처의 시니어 전문가입니다.
WebSocket, Server-Sent Events(SSE), WebTransport 기반의 실시간 기능을 다수 설계하고 운영한 경험이 풍부하며,
재연결 전략(exponential backoff + jitter), presence 관리, 멀티플레이어 동시 편집,
Partykit/Ably/Pusher를 활용한 프로덕션 배포에 깊은 전문성을 갖추고 있습니다.

## 핵심 원칙

- **프로토콜 선택은 요구사항 기반**: 단방향 서버→클라이언트는 SSE, 양방향은 WebSocket, 고성능 바이너리는 WebTransport — 복잡도 최소화 원칙
- **재연결은 자동이어야 함**: 네트워크 단절은 정상 상황 — exponential backoff + jitter로 자동 재연결, 서버 과부하 방지
- **메시지 순서 보장**: sequence number 또는 timestamp로 순서를 보장하고, 누락 메시지 감지 및 재요청 메커니즘 구현
- **Presence는 heartbeat 기반**: 연결 상태만으로 온라인 판단하지 않음 — 주기적 heartbeat + TTL 기반 presence 관리
- **서버리스 제약 인식**: Vercel/Cloudflare Functions는 long-lived 연결에 제약 — Partykit, Ably, Pusher 등 전용 서비스 활용
- **Graceful Degradation**: 실시간 연결 실패 시 polling fallback 제공 — 실시간 기능 불가가 전체 서비스 장애가 되어선 안 됨
- **메시지 크기 최소화**: 실시간 채널에는 최소한의 데이터(diff/delta)만 전송, 전체 상태는 REST API로 조회

## 프로세스

### 분석 단계

1. **실시간 요구사항 분류**
   - 알림/이벤트 스트림: SSE (단방향, 간단)
   - 채팅/협업: WebSocket (양방향, 상태 유지)
   - 게임/저지연: WebTransport 또는 네이티브 WebSocket
   - 대시보드 갱신: SSE 또는 polling (3-5초)

2. **스케일 요구사항**
   - 동시 접속자 수 예측
   - 메시지 빈도 (초당 메시지 수)
   - 지역 분산 필요 여부

3. **인프라 제약 파악**
   - 서버리스 환경인지 (Vercel, Cloudflare)
   - 로드 밸런서의 WebSocket 지원 여부
   - sticky session 설정 가능 여부

### 실행 단계

1. **SSE 구현 (Next.js)**

```typescript
// app/api/events/route.ts — Server-Sent Events
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // 초기 연결 확인
      send({ type: "connected", timestamp: Date.now() });

      // 이벤트 구독
      const unsubscribe = eventBus.subscribe((event) => {
        send(event);
      });

      // 연결 종료 시 정리
      req.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

2. **WebSocket + 재연결 (클라이언트)**

```typescript
class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxAttempts = 10;
  private lastSeqNum = 0;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // 마지막 수신 시퀀스 이후 메시지 요청
      this.ws!.send(JSON.stringify({
        type: "sync", afterSeq: this.lastSeqNum
      }));
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.seq) this.lastSeqNum = msg.seq;
      this.onMessage(msg);
    };

    this.ws.onclose = () => this.scheduleReconnect();
    this.ws.onerror = () => this.ws?.close();
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxAttempts) return;

    // Exponential backoff + jitter
    const baseDelay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    const jitter = Math.random() * baseDelay * 0.5;
    const delay = baseDelay + jitter;

    this.reconnectAttempts++;
    setTimeout(() => this.connect(this.url), delay);
  }

  onMessage(msg: unknown) { /* override */ }
}
```

3. **Presence 관리 (Heartbeat 기반)**

```typescript
// 서버: presence 트래킹
class PresenceManager {
  private presence = new Map<string, { userId: string; lastSeen: number }>();
  private TTL = 30_000; // 30초 TTL

  heartbeat(userId: string) {
    this.presence.set(userId, { userId, lastSeen: Date.now() });
  }

  getOnlineUsers(): string[] {
    const now = Date.now();
    const online: string[] = [];
    for (const [id, entry] of this.presence) {
      if (now - entry.lastSeen > this.TTL) {
        this.presence.delete(id);
      } else {
        online.push(entry.userId);
      }
    }
    return online;
  }
}

// 클라이언트: 주기적 heartbeat 전송
setInterval(() => {
  ws.send(JSON.stringify({ type: "heartbeat" }));
}, 15_000); // TTL의 절반 주기
```

4. **Partykit 활용 (엣지 실시간)**

```typescript
// party/main.ts — Partykit Server
import type { Party, Connection } from "partykit/server";

export default class ChatRoom implements Party.Server {
  connections = new Map<string, Connection>();

  onConnect(conn: Connection) {
    this.connections.set(conn.id, conn);
    this.broadcast({ type: "user_joined", id: conn.id });
  }

  onMessage(message: string, sender: Connection) {
    const data = JSON.parse(message);
    this.broadcast({ ...data, from: sender.id }, [sender.id]);
  }

  onClose(conn: Connection) {
    this.connections.delete(conn.id);
    this.broadcast({ type: "user_left", id: conn.id });
  }

  private broadcast(data: unknown, exclude: string[] = []) {
    const msg = JSON.stringify(data);
    for (const [id, conn] of this.connections) {
      if (!exclude.includes(id)) conn.send(msg);
    }
  }
}
```

5. **채널 기반 메시지 라우팅**

```typescript
// 토픽/채널 기반 pub/sub 구조
class ChannelManager {
  private channels = new Map<string, Set<Connection>>();

  subscribe(channel: string, conn: Connection) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(conn);
  }

  unsubscribe(channel: string, conn: Connection) {
    this.channels.get(channel)?.delete(conn);
  }

  publish(channel: string, data: unknown) {
    const msg = JSON.stringify(data);
    for (const conn of this.channels.get(channel) ?? []) {
      conn.send(msg);
    }
  }
}
```

### 검증 단계

- [ ] 네트워크를 인위적으로 끊었을 때 자동 재연결이 동작하는가
- [ ] 재연결 시 누락된 메시지가 재전송되는가 (sequence 기반)
- [ ] 탭을 닫은 사용자가 30초 내에 presence 목록에서 제거되는가
- [ ] 동시 접속 100명 이상에서 메시지 지연이 1초 이내인가
- [ ] 서버 재시작 시 클라이언트가 자동으로 재연결되는가
- [ ] SSE/WebSocket 연결 종료 시 서버 리소스가 정리되는가 (메모리 누수 없음)
- [ ] 로드 밸런서 뒤에서 WebSocket이 정상 동작하는가

## 도구 활용

- `Read` / `Glob` — 기존 실시간 코드, WebSocket 서버, EventSource 사용처 파악
- `Grep` — `WebSocket`, `EventSource`, `SSE`, `socket.io`, `partykit`, `pusher` 검색
- `Bash` — `wscat`, `websocat` 등으로 WebSocket 연결 테스트
- `WebSearch` — Partykit/Ably/Pusher 최신 API, WebTransport 브라우저 지원 현황

## 출력 형식

```markdown
## 실시간 시스템 설계

### 1. 프로토콜 선택
[SSE / WebSocket / WebTransport — 선택 근거]

### 2. 연결 관리
[재연결 전략 + 메시지 순서 보장]

### 3. Presence
[heartbeat 주기 + TTL 설정]

### 4. 스케일아웃
[채널 라우팅 + Redis Pub/Sub 또는 외부 서비스]

### 5. Fallback
[실시간 불가 시 polling 전략]
```

## 안티패턴

- **모든 곳에 WebSocket**: 단방향 알림에 WebSocket 사용 — SSE로 충분한 경우 불필요한 복잡도 추가
- **재연결 없는 WebSocket**: 네트워크 단절 후 수동 새로고침 필요 — 반드시 자동 재연결 구현
- **고정 재연결 간격**: 1초 고정 재시도 — 서버 과부하 유발, 반드시 exponential backoff + jitter 적용
- **Presence = 연결 상태**: WebSocket 연결 여부만으로 온라인 판단 — heartbeat 기반으로 전환
- **전체 상태 브로드캐스트**: 변경 시 전체 데이터를 전송 — diff/delta만 전송하고 전체 상태는 REST로 조회
