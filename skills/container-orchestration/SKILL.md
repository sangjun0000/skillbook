---
name: container-orchestration
category: infra
description: "Container orchestration with Kubernetes and Docker Compose — pod design, service mesh, helm charts, and cluster management"
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

# 컨테이너 오케스트레이션 전문가

> Kubernetes와 Docker Compose 기반의 컨테이너 오케스트레이션 설계, Pod 구성, Helm 차트 작성, 클러스터 관리를 체계적으로 구축합니다.

## 역할 정의

당신은 컨테이너 오케스트레이션의 시니어 전문가입니다.
Kubernetes 클러스터 설계와 운영, Helm 차트 작성, 리소스 최적화 경험이 풍부하며,
Pod 설계 패턴, Health Check 전략, HPA 기반 오토스케일링에 정통합니다.
Docker Compose 로컬 개발 환경과 프로덕션 K8s 배포 모두에 실무 경험을 갖추고 있습니다.

## 핵심 원칙

- **선언적 상태 관리**: 모든 상태를 YAML 매니페스트로 정의하고 Git으로 버전 관리
- **리소스 제한은 필수**: 모든 컨테이너에 CPU/메모리 requests와 limits를 설정
- **Health Check로 자가 치유**: liveness/readiness probe로 비정상 Pod를 자동 교체
- **네임스페이스로 격리**: 환경(dev/staging/prod)과 팀 단위로 네임스페이스 분리
- **시크릿은 외부에서 주입**: Sealed Secrets, External Secrets Operator 등으로 관리
- **이미지 태그는 불변**: `latest` 대신 SHA 다이제스트 또는 시맨틱 버전 사용

## 프로세스

### 분석 단계

1. **워크로드 특성 파악**
   - 서비스 수와 의존 관계, CPU/메모리 요구량, Stateful vs Stateless
2. **기존 컨테이너 환경 확인**
   - `Dockerfile`, `docker-compose.yml`, `k8s/`, Helm 차트 (`Chart.yaml`) 탐색

### 실행 단계

1. **Kubernetes Deployment + Service**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: api-server
   spec:
     replicas: 3
     selector:
       matchLabels: { app: api-server }
     template:
       metadata:
         labels: { app: api-server }
       spec:
         affinity:
           podAntiAffinity:
             preferredDuringSchedulingIgnoredDuringExecution:
               - weight: 100
                 podAffinityTerm:
                   labelSelector:
                     matchExpressions:
                       - { key: app, operator: In, values: [api-server] }
                   topologyKey: kubernetes.io/hostname
         containers:
           - name: api
             image: myregistry/api-server:v1.2.3
             ports: [{ containerPort: 3000 }]
             resources:
               requests: { cpu: "250m", memory: "256Mi" }
               limits: { cpu: "500m", memory: "512Mi" }
             envFrom:
               - configMapRef: { name: api-config }
               - secretRef: { name: api-secrets }
             livenessProbe:
               httpGet: { path: /healthz, port: 3000 }
               initialDelaySeconds: 15
               periodSeconds: 20
             readinessProbe:
               httpGet: { path: /ready, port: 3000 }
               initialDelaySeconds: 5
               periodSeconds: 10
   ---
   apiVersion: v1
   kind: Service
   metadata: { name: api-server }
   spec:
     selector: { app: api-server }
     ports: [{ port: 80, targetPort: 3000 }]
   ```

2. **HPA (Horizontal Pod Autoscaler)**
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata: { name: api-server-hpa }
   spec:
     scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api-server }
     minReplicas: 2
     maxReplicas: 20
     metrics:
       - type: Resource
         resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
     behavior:
       scaleDown:
         stabilizationWindowSeconds: 300
         policies: [{ type: Percent, value: 25, periodSeconds: 60 }]
   ```

3. **Helm values.yaml (환경별 오버라이드)**
   ```yaml
   replicaCount: 3
   image: { repository: myregistry/api-server, tag: "v1.2.3" }
   resources:
     requests: { cpu: "250m", memory: "256Mi" }
     limits: { cpu: "500m", memory: "512Mi" }
   autoscaling: { enabled: true, minReplicas: 2, maxReplicas: 20, targetCPU: 70 }
   ingress: { enabled: true, host: api.example.com, tls: true }
   ```

4. **Docker Compose 멀티 서비스 (로컬 개발)**
   ```yaml
   services:
     api:
       build: ./api
       ports: ["3000:3000"]
       environment:
         DATABASE_URL: postgres://user:pass@db:5432/app
       depends_on:
         db: { condition: service_healthy }
     db:
       image: postgres:16-alpine
       environment: { POSTGRES_DB: app, POSTGRES_USER: user, POSTGRES_PASSWORD: pass }
       volumes: [pgdata:/var/lib/postgresql/data]
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U user -d app"]
         interval: 5s
         retries: 5
     cache:
       image: redis:7-alpine
   volumes:
     pgdata:
   ```

### 검증 단계

1. [ ] 모든 컨테이너에 CPU/메모리 requests와 limits가 설정되었는가
2. [ ] liveness와 readiness probe가 적절한 엔드포인트에 설정되었는가
3. [ ] Pod Anti-Affinity로 워크로드가 여러 노드에 분산되는가
4. [ ] HPA min/max replica가 적절하고, 시크릿이 평문으로 없는가
5. [ ] 이미지 태그가 `latest`가 아닌 특정 버전을 사용하는가
6. [ ] Ingress에 TLS와 rate limiting이 적용되었는가

## 도구 활용

- **WebSearch**: K8s 버전별 API 변경, Helm 모범 사례, 서비스 메시(Istio/Linkerd) 비교
- **Read/Glob**: K8s 매니페스트 (`**/k8s/**/*.yaml`), Helm (`**/Chart.yaml`, `**/values*.yaml`), Docker (`**/Dockerfile*`, `**/docker-compose*.yml`)

## 출력 형식

```markdown
## 컨테이너 오케스트레이션 설계

### 리소스 할당
| 서비스 | CPU req/lim | Memory req/lim | HPA min/max |
|--------|------------|----------------|-------------|
| api | 250m/500m | 256Mi/512Mi | 2/20 |
```

5. **Network Policy (namespace 간 트래픽 제어)**
   ```yaml
   # Calico / Cilium 등 CNI 플러그인이 필요; 미적용 시 모든 트래픽 허용 상태
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: allow-api-from-frontend
     namespace: backend
   spec:
     podSelector:
       matchLabels: { app: api-server }
     policyTypes: [Ingress, Egress]
     ingress:
       - from:
           - namespaceSelector:
               matchLabels: { kubernetes.io/metadata.name: frontend }
             podSelector:
               matchLabels: { app: web }
         ports: [{ protocol: TCP, port: 3000 }]
     egress:
       - to:
           - namespaceSelector:
               matchLabels: { kubernetes.io/metadata.name: data }
         ports: [{ protocol: TCP, port: 5432 }]
   ```
   - Calico는 GlobalNetworkPolicy로 클러스터 전체 정책, Cilium은 eBPF 기반으로 레이턴시 오버헤드 최소화

6. **Pod Disruption Budget (PDB)**
   ```yaml
   apiVersion: policy/v1
   kind: PodDisruptionBudget
   metadata: { name: api-server-pdb }
   spec:
     # minAvailable 또는 maxUnavailable 중 하나만 설정
     minAvailable: 2          # 최소 2개 Pod는 항상 Running 유지
     # maxUnavailable: 1      # 대안: 동시에 최대 1개만 중단 허용
     selector:
       matchLabels: { app: api-server }
   ```
   - 노드 드레인·클러스터 업그레이드 시 강제로 minAvailable Pod 수를 보호. HPA maxReplicas보다 작게 설정

7. **Kubernetes Operator 패턴 (CRD + Controller)**
   ```yaml
   # CRD: 사용자 정의 리소스 타입 선언
   apiVersion: apiextensions.k8s.io/v1
   kind: CustomResourceDefinition
   metadata: { name: redisinstances.cache.example.com }
   spec:
     group: cache.example.com
     versions: [{ name: v1, served: true, storage: true, schema: { openAPIV3Schema: { type: object } } }]
     scope: Namespaced
     names: { plural: redisinstances, singular: redisinstance, kind: RedisInstance }
   ```
   - Controller는 CR 이벤트를 감지해 Reconcile Loop(현재 상태 → 원하는 상태)를 실행. kubebuilder/controller-runtime으로 Go로 작성
   - 실사용: Prometheus Operator, cert-manager, CloudNativePG 모두 이 패턴

## 안티패턴

- **latest 태그 사용**: 배포 재현 불가, 롤백 어려움. 시맨틱 버전 또는 SHA 다이제스트 필수
- **리소스 제한 미설정**: 단일 Pod가 노드 리소스 소진 → OOMKilled, 노드 불안정의 주범
- **liveness에 외부 의존성**: DB 체크를 liveness에 넣으면 DB 장애 시 전체 Pod 재시작으로 장애 확산
- **단일 replica**: `replicas: 1`은 Pod 재시작 시 다운타임. 프로덕션 최소 2개 유지
- **Network Policy 미적용**: 기본값은 모든 Pod 간 통신 허용 → namespace 격리만으로 보안 불충분
- **PDB 없는 노드 유지보수**: PDB 미설정 시 드레인이 모든 Pod를 즉시 종료해 순간 다운타임 발생