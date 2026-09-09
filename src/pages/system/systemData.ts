export type SystemKind = "service" | "codes" | "integrations" | "jobs";
export type SystemStatus = "정상" | "점검 필요" | "중지";

export interface SystemItem {
  id: string;
  kind: SystemKind;
  name: string;
  category: string;
  value: string;
  environment: string;
  status: SystemStatus;
  owner: string;
  updatedAt: string;
  description: string;
}

export const STATUS_META: Record<SystemStatus, { bg: string; fg: string }> = {
  정상: { bg: "#ecfdf5", fg: "#047857" },
  "점검 필요": { bg: "#fff7ed", fg: "#c2410c" },
  중지: { bg: "#f4f4f5", fg: "#52525b" },
};

export const SERVICE_ITEMS: SystemItem[] = [
  {
    id: "CFG-001",
    kind: "service",
    name: "서비스 점검 모드",
    category: "접근 제어",
    value: "사용 안 함",
    environment: "Production",
    status: "정상",
    owner: "플랫폼운영",
    updatedAt: "2026-08-25 17:42",
    description:
      "전체 또는 채널별 사용자 접근을 제한하고 점검 안내 화면을 노출합니다.",
  },
  {
    id: "CFG-002",
    kind: "service",
    name: "기본 시간대",
    category: "지역화",
    value: "Asia/Seoul",
    environment: "전체",
    status: "정상",
    owner: "플랫폼운영",
    updatedAt: "2026-08-18 09:10",
    description: "관리 화면과 배치 기준 시간을 결정합니다.",
  },
  {
    id: "CFG-003",
    kind: "service",
    name: "개인정보 마스킹",
    category: "보안",
    value: "강화",
    environment: "Production",
    status: "점검 필요",
    owner: "보안운영",
    updatedAt: "2026-08-27 10:22",
    description: "목록·다운로드·로그에서 개인정보 표시 수준을 제어합니다.",
  },
];

export const CODE_ITEMS: SystemItem[] = [
  {
    id: "CODE-101",
    kind: "codes",
    name: "ORDER_STATUS",
    category: "주문",
    value: "12개 코드",
    environment: "전체",
    status: "정상",
    owner: "주문플랫폼",
    updatedAt: "2026-08-24 13:30",
    description: "주문 처리 단계에서 공통으로 사용하는 상태 코드 그룹입니다.",
  },
  {
    id: "CODE-102",
    kind: "codes",
    name: "DELIVERY_EXCEPTION",
    category: "배송",
    value: "8개 코드",
    environment: "전체",
    status: "정상",
    owner: "배송운영",
    updatedAt: "2026-08-23 16:20",
    description: "배송 실패·보류 원인과 운영 조치 코드를 관리합니다.",
  },
  {
    id: "CODE-103",
    kind: "codes",
    name: "CLAIM_REASON",
    category: "클레임",
    value: "21개 코드",
    environment: "전체",
    status: "점검 필요",
    owner: "CS운영",
    updatedAt: "2026-08-27 11:05",
    description: "취소·반품·교환 사유의 공통 분류 체계입니다.",
  },
];

export const INTEGRATION_ITEMS: SystemItem[] = [
  {
    id: "INT-201",
    kind: "integrations",
    name: "PG 결제 승인 API",
    category: "결제",
    value: "평균 182ms",
    environment: "Production",
    status: "정상",
    owner: "결제플랫폼",
    updatedAt: "2026-08-27 15:01",
    description: "결제 승인·취소·망취소 API 상태와 인증 정보를 관리합니다.",
  },
  {
    id: "INT-202",
    kind: "integrations",
    name: "CJ대한통운 트래킹",
    category: "배송",
    value: "성공률 99.7%",
    environment: "Production",
    status: "정상",
    owner: "배송운영",
    updatedAt: "2026-08-27 14:58",
    description: "송장 등록과 배송 이벤트 Webhook 연동입니다.",
  },
  {
    id: "INT-203",
    kind: "integrations",
    name: "SMS 발송 게이트웨이",
    category: "메시지",
    value: "성공률 96.8%",
    environment: "Production",
    status: "점검 필요",
    owner: "CRM플랫폼",
    updatedAt: "2026-08-27 14:40",
    description: "SMS·LMS 발송과 결과 수신 연동입니다.",
  },
];

export const JOB_ITEMS: SystemItem[] = [
  {
    id: "JOB-301",
    kind: "jobs",
    name: "포인트 소멸 예정 생성",
    category: "포인트",
    value: "매일 02:10",
    environment: "Production",
    status: "정상",
    owner: "혜택플랫폼",
    updatedAt: "2026-08-27 02:11",
    description: "소멸 30일 전 대상 포인트와 사전 알림 대상을 생성합니다.",
  },
  {
    id: "JOB-302",
    kind: "jobs",
    name: "배송 상태 동기화",
    category: "배송",
    value: "10분 간격",
    environment: "Production",
    status: "정상",
    owner: "배송운영",
    updatedAt: "2026-08-27 15:10",
    description: "배송사 Polling 대상 송장의 최신 이벤트를 동기화합니다.",
  },
  {
    id: "JOB-303",
    kind: "jobs",
    name: "프로모션 종료 처리",
    category: "프로모션",
    value: "5분 간격",
    environment: "Production",
    status: "중지",
    owner: "혜택플랫폼",
    updatedAt: "2026-08-27 14:55",
    description: "종료 시각이 지난 프로모션을 마감하고 캐시를 갱신합니다.",
  },
];

export const SYSTEM_ITEMS: SystemItem[] = [
  ...SERVICE_ITEMS,
  ...CODE_ITEMS,
  ...INTEGRATION_ITEMS,
  ...JOB_ITEMS,
];

export const CONFIG: Record<
  SystemKind,
  { title: string; subtitle: string; unit: string; valueLabel: string }
> = {
  service: {
    title: "서비스 설정",
    subtitle:
      "서비스 공통 환경, 접근 제어와 보안 기본값을 변경 이력과 함께 관리합니다.",
    unit: "개",
    valueLabel: "설정값",
  },
  codes: {
    title: "공통 코드 관리",
    subtitle:
      "여러 업무에서 공유하는 코드 그룹과 값, 사용 여부와 영향 범위를 관리합니다.",
    unit: "개 그룹",
    valueLabel: "코드 수",
  },
  integrations: {
    title: "외부 연동 관리",
    subtitle:
      "외부 API·Webhook·인증 정보의 운영 상태와 장애 지표를 관리합니다.",
    unit: "개 연동",
    valueLabel: "운영 지표",
  },
  jobs: {
    title: "배치 / 작업 관리",
    subtitle:
      "정기 배치와 스케줄러의 실행 주기, 최근 결과와 재실행 여부를 관리합니다.",
    unit: "개 작업",
    valueLabel: "실행 주기",
  },
};
