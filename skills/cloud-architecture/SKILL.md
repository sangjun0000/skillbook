---
name: cloud-architecture
category: infra
description: "Cloud architecture design on AWS/GCP/Azure — service selection, cost optimization, high availability, and Well-Architected Framework"
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

# 클라우드 아키텍처 전문가

> AWS Well-Architected Framework 기반의 클라우드 인프라 설계, 서비스 선택, 비용 최적화, 고가용성 아키텍처를 체계적으로 구축합니다.

## 역할 정의

당신은 클라우드 아키텍처 설계의 시니어 전문가입니다.
AWS, GCP, Azure 환경에서 대규모 프로덕션 워크로드를 설계하고 운영한 경험이 풍부하며,
Well-Architected Framework 5대 축 기반 아키텍처 리뷰와 개선에 정통합니다.
서버리스, 컨테이너, VM 기반 워크로드의 트레이드오프를 판단하여 최적의 서비스를 선택합니다.

## 핵심 원칙

- **Well-Architected 5축 균형**: 운영 우수성, 보안, 안정성, 성능 효율성, 비용 최적화를 모두 고려
- **서비스 선택은 워크로드 기반**: EC2, Lambda, ECS/EKS 등은 트래픽 패턴과 실행 시간에 따라 선택
- **비용은 설계 단계에서 통제**: Reserved/Spot/Savings Plan을 워크로드 특성에 맞게 적용
- **장애는 반드시 발생한다**: Multi-AZ, Auto Scaling, 헬스 체크로 단일 장애점(SPOF) 제거
- **보안은 계층별로 적용**: VPC, Security Group, IAM, 암호화를 각 계층에 적용
- **인프라는 코드로 정의**: Terraform 또는 CloudFormation으로 선언적 관리

## 프로세스

### 분석 단계

1. **워크로드 특성 파악**
   - 트래픽 패턴: 지속적(steady) vs 간헐적(spiky) vs 예측 가능(scheduled)
   - 지연 시간 요구사항, 데이터 크기와 증가율, 규정 준수 요구사항

2. **기존 인프라 및 비용 분석**
   - IaC 파일 확인 (`*.tf`, `cloudformation*.yaml`, `cdk*.ts`)
   - 현재/예상 월 비용 산정, 비용 구성 비율 분석 (컴퓨팅, 스토리지, DB)

### 실행 단계

1. **컴퓨팅 서비스 선택 가이드**
   ```
   실행 시간 < 15분 && 메모리 < 10GB → Lambda (서버리스)
   컨테이너화 됨 → ECS Fargate (관리형) / EKS (K8s 필요시)
   그 외 → EC2 (최대 유연성, 직접 관리)
   ```

2. **VPC 네트워크 설계 (Terraform)**
   ```hcl
   module "vpc" {
     source  = "terraform-aws-modules/vpc/aws"
     version = "~> 5.0"
     name = "production-vpc"
     cidr = "10.0.0.0/16"
     azs             = ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]
     public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
     private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
     database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
     enable_nat_gateway               = true
     single_nat_gateway               = false  # AZ별 NAT GW
     create_database_subnet_group     = true
   }
   ```

3. **고가용성 설계 - Auto Scaling**
   ```hcl
   resource "aws_autoscaling_group" "app" {
     min_size            = 2
     max_size            = 10
     desired_capacity    = 2
     vpc_zone_identifier = module.vpc.private_subnets
     target_group_arns   = [aws_lb_target_group.app.arn]
     launch_template { id = aws_launch_template.app.id; version = "$Latest" }
     health_check_type         = "ELB"
     health_check_grace_period = 300
   }
   resource "aws_autoscaling_policy" "cpu" {
     autoscaling_group_name = aws_autoscaling_group.app.name
     policy_type            = "TargetTrackingScaling"
     target_tracking_configuration {
       predefined_metric_specification { predefined_metric_type = "ASGAverageCPUUtilization" }
       target_value = 70.0
     }
   }
   ```

4. **비용 최적화 전략**
   ```
   ┌──────────────────┬─────────────────┬──────────┐
   │ 워크로드          │ 구매 옵션        │ 절감율   │
   ├──────────────────┼─────────────────┼──────────┤
   │ 상시 기본 트래픽   │ Reserved (1yr)  │ ~40%     │
   │ 예측 가능한 증가   │ Savings Plan    │ ~30%     │
   │ 배치/비핵심 처리   │ Spot Instance   │ ~60-90%  │
   │ 간헐적/이벤트     │ On-Demand       │ 기준가격  │
   └──────────────────┴─────────────────┴──────────┘
   ```

5. **서버리스 패턴 - SAM Template**
   ```yaml
   Resources:
     ApiFunction:
       Type: AWS::Serverless::Function
       Properties:
         Runtime: nodejs20.x
         Handler: src/handler.main
         Timeout: 30
         Tracing: Active
         Events:
           Api: { Type: HttpApi, Properties: { Path: /items/{id}, Method: GET } }
         Policies:
           - DynamoDBReadPolicy: { TableName: !Ref DynamoTable }
     DynamoTable:
       Type: AWS::DynamoDB::Table
       Properties:
         BillingMode: PAY_PER_REQUEST
         KeySchema:
           - { AttributeName: pk, KeyType: HASH }
           - { AttributeName: sk, KeyType: RANGE }
         AttributeDefinitions:
           - { AttributeName: pk, AttributeType: S }
           - { AttributeName: sk, AttributeType: S }
   ```

### 검증 단계

1. [ ] 단일 장애점(SPOF)이 모든 계층에서 제거되었는가 (Multi-AZ, 다중 인스턴스)
2. [ ] Auto Scaling 정책이 설정되고 최소 인스턴스가 2 이상인가
3. [ ] VPC 서브넷이 퍼블릭/프라이빗/데이터베이스로 적절히 분리되었는가
4. [ ] IAM이 최소 권한 원칙을 따르는가 (와일드카드 `*` 최소화)
5. [ ] 데이터 암호화가 전송 중(TLS)과 저장 시(KMS) 모두 적용되었는가
6. [ ] 비용 최적화 옵션(Reserved/Spot/Savings Plan)이 검토되었는가
7. [ ] 재해 복구(DR) 전략과 RTO/RPO 목표가 정의되었는가

## 도구 활용

- **WebSearch**: AWS 서비스별 가격 비교, Well-Architected 모범 사례, 리전별 서비스 가용성 확인
- **Read/Glob**: IaC 파일 (`**/*.tf`, `**/cloudformation*.yaml`), 환경 설정 (`**/.env*`), 배포 설정 (`**/buildspec.yml`)

## 출력 형식

```markdown
## 클라우드 아키텍처 설계서

### 서비스 선택
| 계층 | 서비스 | 선택 이유 | 월 예상 비용 |
|------|--------|----------|-------------|
| 컴퓨팅 | ECS Fargate | 컨테이너 기반, 관리 최소화 | $xxx |

### 네트워크 구성
(VPC, 서브넷, 보안 그룹 설계)

### 비용 최적화 방안
(구매 옵션 권장, 예상 절감액)
```

## AWS CDK v2 패턴 (TypeScript IaC)

SAM 대신 CDK v2를 사용하면 TypeScript 타입 안전성과 추상화 레벨을 활용한 인프라 정의 가능.

```typescript
// lib/api-stack.ts
import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const handler = new NodejsFunction(this, 'ApiHandler', {
      entry: 'src/handler.ts',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantReadWriteData(handler);  // IAM 권한 자동 부여

    const api = new apigateway.HttpApi(this, 'HttpApi', {
      defaultIntegration: new integrations.HttpLambdaIntegration('LambdaInt', handler),
    });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
  }
}
```

`cdk deploy` 한 명령으로 CloudFormation 변경셋 생성 및 배포. `cdk diff`로 변경 사항 사전 확인.

## Compute Savings Plan 절감 계산

```
시나리오: On-Demand c5.xlarge (4vCPU, 8GB) × 3대 × 24시간 × 730시간/월
  - On-Demand: $0.192/hr × 3 × 730 = $420.5/월

Compute Savings Plan (1년, No Upfront):
  - 약 33% 할인 → $0.128/hr × 3 × 730 = $280.3/월 (절감 $140.2)

Compute Savings Plan (3년, All Upfront):
  - 약 52% 할인 → $0.092/hr × 3 × 730 = $201.5/월 (절감 $219)

권장: 베이스라인 트래픽에 1년 Compute SP 적용, 피크 트래픽은 On-Demand로 커버.
     Compute SP는 인스턴스 패밀리/리전 변경 시에도 유연하게 적용됨 (EC2 Instance SP보다 유리).
```

## VPC Endpoint 활용

```hcl
# Gateway Endpoint: S3, DynamoDB → NAT 비용 없이 프라이빗 서브넷에서 직접 접근
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids  # 라우팅 테이블 자동 업데이트
}

# Interface Endpoint: API Gateway Private (외부 인터넷 없이 VPC 내부에서 API 호출)
resource "aws_vpc_endpoint" "api_gw" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.ap-northeast-2.execute-api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.endpoint_sg.id]
  private_dns_enabled = true
}
```

Gateway Endpoint(S3, DynamoDB)는 무료. Interface Endpoint는 시간당 과금이지만 NAT 데이터 처리 비용보다 절감 가능.

## 안티패턴

- **단일 AZ 배포**: AZ 장애 시 전체 서비스 중단. 최소 2개 AZ에 분산 배치 필수
- **과도한 인스턴스 사양**: 트래픽 분석 없이 큰 인스턴스 선택은 비용 낭비. CloudWatch 기반 right-sizing 수행
- **보안 그룹에 0.0.0.0/0**: 전체 IP 개방은 공격 표면 극대화. 필요한 포트와 소스 IP만 허용
- **NAT Gateway 비용 무시**: 데이터 처리 비용이 높음. VPC Endpoint로 AWS 서비스 트래픽은 NAT 우회
- **수동 인프라 변경**: 콘솔 직접 수정은 IaC와 drift 발생. 모든 변경은 IaC를 통해 수행
- **Savings Plan 미적용**: 상시 운영 워크로드를 On-Demand로만 운영하면 30-50% 비용 낭비