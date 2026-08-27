import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../c2c/sales/SalesActivityShared';
import styles from './SystemManagement.module.css';

type SystemKind = 'service' | 'codes' | 'integrations' | 'jobs';

interface SystemItem {
  id: string;
  kind: SystemKind;
  name: string;
  category: string;
  value: string;
  environment: string;
  status: '정상' | '점검 필요' | '중지';
  owner: string;
  updatedAt: string;
  description: string;
}

const SYSTEM_ITEMS: SystemItem[] = [
  { id: 'CFG-001', kind: 'service', name: '서비스 점검 모드', category: '접근 제어', value: '사용 안 함', environment: 'Production', status: '정상', owner: '플랫폼운영', updatedAt: '2026-08-25 17:42', description: '전체 또는 채널별 사용자 접근을 제한하고 점검 안내 화면을 노출합니다.' },
  { id: 'CFG-002', kind: 'service', name: '기본 시간대', category: '지역화', value: 'Asia/Seoul', environment: '전체', status: '정상', owner: '플랫폼운영', updatedAt: '2026-08-18 09:10', description: '관리 화면과 배치 기준 시간을 결정합니다.' },
  { id: 'CFG-003', kind: 'service', name: '개인정보 마스킹', category: '보안', value: '강화', environment: 'Production', status: '점검 필요', owner: '보안운영', updatedAt: '2026-08-27 10:22', description: '목록·다운로드·로그에서 개인정보 표시 수준을 제어합니다.' },
  { id: 'CODE-101', kind: 'codes', name: 'ORDER_STATUS', category: '주문', value: '12개 코드', environment: '전체', status: '정상', owner: '주문플랫폼', updatedAt: '2026-08-24 13:30', description: '주문 처리 단계에서 공통으로 사용하는 상태 코드 그룹입니다.' },
  { id: 'CODE-102', kind: 'codes', name: 'DELIVERY_EXCEPTION', category: '배송', value: '8개 코드', environment: '전체', status: '정상', owner: '배송운영', updatedAt: '2026-08-23 16:20', description: '배송 실패·보류 원인과 운영 조치 코드를 관리합니다.' },
  { id: 'CODE-103', kind: 'codes', name: 'CLAIM_REASON', category: '클레임', value: '21개 코드', environment: '전체', status: '점검 필요', owner: 'CS운영', updatedAt: '2026-08-27 11:05', description: '취소·반품·교환 사유의 공통 분류 체계입니다.' },
  { id: 'INT-201', kind: 'integrations', name: 'PG 결제 승인 API', category: '결제', value: '평균 182ms', environment: 'Production', status: '정상', owner: '결제플랫폼', updatedAt: '2026-08-27 15:01', description: '결제 승인·취소·망취소 API 상태와 인증 정보를 관리합니다.' },
  { id: 'INT-202', kind: 'integrations', name: 'CJ대한통운 트래킹', category: '배송', value: '성공률 99.7%', environment: 'Production', status: '정상', owner: '배송운영', updatedAt: '2026-08-27 14:58', description: '송장 등록과 배송 이벤트 Webhook 연동입니다.' },
  { id: 'INT-203', kind: 'integrations', name: 'SMS 발송 게이트웨이', category: '메시지', value: '성공률 96.8%', environment: 'Production', status: '점검 필요', owner: 'CRM플랫폼', updatedAt: '2026-08-27 14:40', description: 'SMS·LMS 발송과 결과 수신 연동입니다.' },
  { id: 'JOB-301', kind: 'jobs', name: '포인트 소멸 예정 생성', category: '포인트', value: '매일 02:10', environment: 'Production', status: '정상', owner: '혜택플랫폼', updatedAt: '2026-08-27 02:11', description: '소멸 30일 전 대상 포인트와 사전 알림 대상을 생성합니다.' },
  { id: 'JOB-302', kind: 'jobs', name: '배송 상태 동기화', category: '배송', value: '10분 간격', environment: 'Production', status: '정상', owner: '배송운영', updatedAt: '2026-08-27 15:10', description: '배송사 Polling 대상 송장의 최신 이벤트를 동기화합니다.' },
  { id: 'JOB-303', kind: 'jobs', name: '프로모션 종료 처리', category: '프로모션', value: '5분 간격', environment: 'Production', status: '중지', owner: '혜택플랫폼', updatedAt: '2026-08-27 14:55', description: '종료 시각이 지난 프로모션을 마감하고 캐시를 갱신합니다.' },
];

const CONFIG: Record<SystemKind, { title: string; subtitle: string; unit: string }> = {
  service: { title: '서비스 설정', subtitle: '서비스 공통 환경, 접근 제어와 보안 기본값을 변경 이력과 함께 관리합니다.', unit: '개' },
  codes: { title: '공통 코드 관리', subtitle: '여러 업무에서 공유하는 코드 그룹과 값, 사용 여부와 영향 범위를 관리합니다.', unit: '개 그룹' },
  integrations: { title: '외부 연동 관리', subtitle: '외부 API·Webhook·인증 정보의 운영 상태와 장애 지표를 관리합니다.', unit: '개 연동' },
  jobs: { title: '배치 / 작업 관리', subtitle: '정기 배치와 스케줄러의 실행 주기, 최근 결과와 재실행 여부를 관리합니다.', unit: '개 작업' },
};

const STATUS_META = {
  정상: { bg: '#ecfdf5', fg: '#047857' },
  '점검 필요': { bg: '#fff7ed', fg: '#c2410c' },
  중지: { bg: '#f4f4f5', fg: '#52525b' },
};

function SystemManagementPage({ kind }: { kind: SystemKind }) {
  const config = CONFIG[kind];
  const [items, setItems] = useState(() => SYSTEM_ITEMS.filter((item) => item.kind === kind));
  const [quick, setQuick] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [environment, setEnvironment] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const filtered = useMemo(() => items.filter((item) => (quick === '전체' || item.status === quick) && (!environment || item.environment === environment) && (!search || `${item.id} ${item.name} ${item.category} ${item.owner}`.toLowerCase().includes(search.toLowerCase()))), [environment, items, quick, search]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const reset = () => { setQuick('전체'); setKeyword(''); setSearch(''); setEnvironment(''); };
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [
    { kind: 'stack', title: item.name, subtitle: item.id },
    { kind: 'text', text: item.category },
    { kind: 'text', text: item.value, weight: 600 },
    { kind: 'text', text: item.environment },
    { kind: 'badge', text: item.status, bg: STATUS_META[item.status].bg, fg: STATUS_META[item.status].fg },
    { kind: 'stack', title: item.owner, subtitle: item.updatedAt },
    { kind: 'link', text: '상세' },
  ] }));
  return <section className={shared.page}><PageHeading title={config.title} subtitle={config.subtitle}/><Metrics items={[{ label: '전체', value: `${items.length}${config.unit}`, note: '등록된 운영 항목' }, { label: '정상', value: `${items.filter((item) => item.status === '정상').length}개`, note: '정상 운영', dot: '#10b981' }, { label: '점검 필요', value: `${items.filter((item) => item.status === '점검 필요').length}개`, note: '담당자 확인 필요', dot: '#f59e0b' }, { label: '중지', value: `${items.filter((item) => item.status === '중지').length}개`, note: '운영 제외', dot: '#a1a1aa' }]}/><ControlArea><div className={shared.quickFilters}>{['전체', '정상', '점검 필요', '중지'].map((status) => <button type="button" key={status} className={`${shared.qfBtn} ${quick === status ? styles.quickActive : ''}`} onClick={() => setQuick(status)}><span className={shared.qfLabel}>{status}</span><span className={shared.qfCount}>{items.filter((item) => status === '전체' || item.status === status).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><select className={shared.selectSm}><option>통합 검색</option><option>관리 ID</option><option>항목명</option><option>담당 조직</option></select><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="관리 ID / 항목명 / 분류 / 담당 조직"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={environment} onChange={(event) => setEnvironment(event.target.value)}><option value="">전체 환경</option><option>Production</option><option>Staging</option><option>전체</option></select><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button></div></FilterBox></ControlArea><GridArea><ResultBar count={filtered.length} unit={config.unit}/><DataGrid columns={[{ label: '항목 / 관리 ID' }, { label: '분류' }, { label: kind === 'jobs' ? '실행 주기' : kind === 'integrations' ? '운영 지표' : '설정값' }, { label: '환경' }, { label: '상태' }, { label: '담당 / 최근 변경' }, { label: '관리' }]} rows={rows} gridTemplate="minmax(210px,1.4fr) 110px 145px 105px 90px 180px 55px" minWidth="940px" empty={!filtered.length} emptyText="조건에 맞는 시스템 항목이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0개'}/></GridArea>{selected && <DetailDrawer eyebrow={`${config.title} · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={STATUS_META[selected.status]} subtitle={`${selected.category} · ${selected.environment}`} onClose={() => setSelectedId(null)} actions={<button type="button" className={selected.status === '중지' ? drawer.primaryBtn : drawer.dangerBtn} onClick={() => { setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: item.status === '중지' ? '정상' : '중지', updatedAt: '2026-08-27 15:20' } : item)); notify(`${selected.name} 상태를 변경했습니다.`); }}>{selected.status === '중지' ? '사용 재개' : '사용 중지'}</button>} stats={[{ label: '현재 값', value: selected.value }, { label: '운영 환경', value: selected.environment }, { label: '담당 조직', value: selected.owner }]} fields={[{ label: '관리 ID', value: selected.id }, { label: '분류', value: selected.category }, { label: '최근 변경', value: selected.updatedAt }, { label: '설명', value: selected.description }]}><div className={drawer.sectionTitleLoose}>관리 원칙</div><div className={styles.boundaryNote}>시스템 설정은 상품 정보가 아니라 전체 서비스 실행 방식에 영향을 줍니다. 변경 사유와 작업자를 감사 로그에 남기고 Production 변경은 권한과 승인 절차를 거쳐야 합니다.</div></DetailDrawer>}{toast && <div className={styles.toast}>{toast}</div>}</section>;
}

export const ServiceSettingsPage = () => <SystemManagementPage kind="service"/>;
export const CommonCodesPage = () => <SystemManagementPage kind="codes"/>;
export const IntegrationManagementPage = () => <SystemManagementPage kind="integrations"/>;
export const JobManagementPage = () => <SystemManagementPage kind="jobs"/>;
