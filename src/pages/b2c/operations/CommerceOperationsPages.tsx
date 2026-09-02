import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { Cell, GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../../c2c/sales/SalesActivity.module.css';
import {
  ControlArea,
  DetailDrawer,
  FilterBox,
  GridArea,
  Metrics,
  PageHeading,
  ResultBar,
} from '../../c2c/sales/SalesActivityShared';
import styles from './CommerceOperations.module.css';
import { CommonButton } from '../../../components/common';

type ClaimKind = 'cancel' | 'return' | 'exchange';

interface ClaimRecord {
  id: string;
  kind: ClaimKind;
  orderId: string;
  member: string;
  product: string;
  reason: string;
  stage: string;
  requestedAt: string;
  updatedAt: string;
  amount: number;
  assignee: string;
  channel: string;
}

const CLAIM_CONFIG: Record<ClaimKind, { label: string; stages: string[]; subtitle: string }> = {
  cancel: { label: '취소', stages: ['접수', '검토중', '승인대기', '완료', '반려'], subtitle: '결제 취소 가능 여부, 부분 취소 금액과 환불 연계를 한 처리 큐에서 관리합니다.' },
  return: { label: '반품', stages: ['접수', '승인', '회수중', '상품검수', '환불대기', '완료', '반려'], subtitle: '반품 승인부터 회수·상품 검수·환불 연계까지 전체 흐름을 관리합니다.' },
  exchange: { label: '교환', stages: ['접수', '승인', '회수중', '교환상품준비', '재출고', '완료', '반려'], subtitle: '교환 승인, 회수, 대체 상품 준비와 재출고를 하나의 흐름으로 관리합니다.' },
};

const CLAIMS: ClaimRecord[] = [
  { id: 'CAN-260827-0184', kind: 'cancel', orderId: 'ORD-20260827-8841', member: '김지은', product: '오버핏 코튼 셔츠 외 1건', reason: '배송 전 단순 변심', stage: '접수', requestedAt: '2026-08-27 14:32', updatedAt: '2026-08-27 14:32', amount: 68400, assignee: '미배정', channel: '고객 신청' },
  { id: 'CAN-260827-0179', kind: 'cancel', orderId: 'ORD-20260827-8793', member: '박서연', product: '무선 키보드', reason: '옵션 변경 희망', stage: '승인대기', requestedAt: '2026-08-27 13:18', updatedAt: '2026-08-27 13:44', amount: 129000, assignee: '이정민', channel: 'CS 접수' },
  { id: 'CAN-260826-0151', kind: 'cancel', orderId: 'ORD-20260826-7312', member: '최준혁', product: '캠핑 테이블', reason: '이미 출고되어 취소 불가', stage: '반려', requestedAt: '2026-08-26 16:04', updatedAt: '2026-08-26 17:10', amount: 89000, assignee: '박지수', channel: '고객 신청' },
  { id: 'CAN-260826-0142', kind: 'cancel', orderId: 'ORD-20260826-7085', member: '윤소희', product: '세라믹 머그 세트', reason: '중복 주문', stage: '완료', requestedAt: '2026-08-26 10:21', updatedAt: '2026-08-26 11:02', amount: 39800, assignee: 'SYSTEM', channel: '자동 처리' },
  { id: 'RET-260827-0098', kind: 'return', orderId: 'ORD-20260823-5128', member: '이민수', product: '러닝화 270', reason: '사이즈 불일치', stage: '회수중', requestedAt: '2026-08-27 11:42', updatedAt: '2026-08-27 14:12', amount: 112000, assignee: '정하늘', channel: '고객 신청' },
  { id: 'RET-260827-0092', kind: 'return', orderId: 'ORD-20260822-4981', member: '강태양', product: '블루투스 스피커', reason: '전원 불량', stage: '상품검수', requestedAt: '2026-08-27 09:16', updatedAt: '2026-08-27 13:38', amount: 76000, assignee: '한유진', channel: 'CS 접수' },
  { id: 'RET-260826-0084', kind: 'return', orderId: 'ORD-20260821-4420', member: '한예린', product: '리넨 침구 세트', reason: '포장 훼손', stage: '환불대기', requestedAt: '2026-08-26 15:30', updatedAt: '2026-08-27 10:10', amount: 149000, assignee: '한유진', channel: '고객 신청' },
  { id: 'RET-260825-0072', kind: 'return', orderId: 'ORD-20260819-3902', member: '노민재', product: '가죽 카드지갑', reason: '사용 흔적 확인', stage: '반려', requestedAt: '2026-08-25 13:08', updatedAt: '2026-08-26 09:50', amount: 54000, assignee: '정하늘', channel: '고객 신청' },
  { id: 'EXC-260827-0061', kind: 'exchange', orderId: 'ORD-20260824-5480', member: '배수정', product: '데님 팬츠 M', reason: 'L 사이즈로 교환', stage: '교환상품준비', requestedAt: '2026-08-27 12:01', updatedAt: '2026-08-27 14:18', amount: 79000, assignee: '문서현', channel: '고객 신청' },
  { id: 'EXC-260827-0058', kind: 'exchange', orderId: 'ORD-20260823-5274', member: '서지우', product: '스테인리스 텀블러', reason: '색상 오배송', stage: '재출고', requestedAt: '2026-08-27 10:35', updatedAt: '2026-08-27 13:58', amount: 32000, assignee: '문서현', channel: 'CS 접수' },
  { id: 'EXC-260826-0049', kind: 'exchange', orderId: 'ORD-20260821-4615', member: '오세훈', product: 'USB-C 허브', reason: '포트 인식 불량', stage: '회수중', requestedAt: '2026-08-26 14:22', updatedAt: '2026-08-27 09:12', amount: 61000, assignee: '김민호', channel: '고객 신청' },
  { id: 'EXC-260825-0038', kind: 'exchange', orderId: 'ORD-20260819-4021', member: '임도현', product: '기계식 키보드', reason: '재고 소진', stage: '반려', requestedAt: '2026-08-25 11:02', updatedAt: '2026-08-25 15:44', amount: 138000, assignee: '김민호', channel: 'CS 접수' },
];

const STATUS_META: Record<string, { bg: string; fg: string }> = {
  접수: { bg: '#fff7ed', fg: '#c2410c' }, 검토중: { bg: '#eff6ff', fg: '#2563eb' }, 승인대기: { bg: '#f5f3ff', fg: '#7c3aed' },
  승인: { bg: '#eff6ff', fg: '#2563eb' }, 회수중: { bg: '#fefce8', fg: '#a16207' }, 상품검수: { bg: '#f5f3ff', fg: '#7c3aed' },
  환불대기: { bg: '#fff7ed', fg: '#c2410c' }, 교환상품준비: { bg: '#f5f3ff', fg: '#7c3aed' }, 재출고: { bg: '#ecfeff', fg: '#0e7490' },
  완료: { bg: '#ecfdf5', fg: '#047857' }, 반려: { bg: '#fef2f2', fg: '#dc2626' },
  '조치 필요': { bg: '#fef2f2', fg: '#dc2626' }, 처리중: { bg: '#fff7ed', fg: '#c2410c' }, 해제: { bg: '#ecfdf5', fg: '#047857' },
  실패: { bg: '#fef2f2', fg: '#dc2626' }, 지연: { bg: '#fff7ed', fg: '#c2410c' }, 배송중: { bg: '#eff6ff', fg: '#2563eb' }, 배송완료: { bg: '#ecfdf5', fg: '#047857' },
  정상: { bg: '#ecfdf5', fg: '#047857' }, 점검: { bg: '#fff7ed', fg: '#c2410c' }, 중지: { bg: '#f4f4f5', fg: '#52525b' },
};

const fmtWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;
const pages = [{ label: '‹' }, { label: '1', active: true }, { label: '›' }];

function ClaimPage({ kind, history = false }: { kind: ClaimKind; history?: boolean }) {
  const config = CLAIM_CONFIG[kind];
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') ?? '전체';
  const [records, setRecords] = useState(() => CLAIMS.filter((item) => item.kind === kind));
  const [quick, setQuick] = useState(config.stages.includes(initialStatus) ? initialStatus : '전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const selected = records.find((item) => item.id === selectedId) ?? null;
  const filtered = useMemo(() => records.filter((item) => (quick === '전체' || item.stage === quick) && (!assignee || (assignee === '미배정' ? item.assignee === '미배정' : item.assignee !== '미배정')) && (!search || `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))), [assignee, quick, records, search]);
  const reset = () => { setQuick('전체'); setKeyword(''); setSearch(''); setAssignee(''); };
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const advance = () => {
    if (!selected) return;
    const current = config.stages.indexOf(selected.stage);
    const next = config.stages[Math.min(current + 1, config.stages.length - 2)];
    setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, stage: next, assignee: item.assignee === '미배정' ? 'admin01' : item.assignee, updatedAt: '2026-08-27 15:20' } : item));
    notify(`${selected.id} 건을 ${next} 단계로 변경했습니다.`);
  };
  const rows: GridRow[] = filtered.map((item) => {
    const meta = STATUS_META[item.stage] ?? STATUS_META.검토중;
    const cells: Cell[] = [
      { kind: 'stack', title: item.id, subtitle: item.requestedAt },
      { kind: 'stack', title: item.orderId, subtitle: item.member },
      { kind: 'stack', title: item.product, subtitle: item.reason },
      { kind: 'text', text: fmtWon(item.amount), align: 'right', numeric: true, weight: 600 },
      { kind: 'badge', text: item.stage, bg: meta.bg, fg: meta.fg },
      { kind: 'stack', title: item.assignee, subtitle: item.channel },
      { kind: 'text', text: item.updatedAt, color: '#71717a', size: '11px', numeric: true },
      { kind: 'link', text: '상세' },
    ];
    return { id: item.id, cells, onClick: () => setSelectedId(item.id) };
  });
  return <section className={shared.page}>
    <PageHeading title={`${config.label} ${history ? '처리 이력' : '처리'}`} subtitle={history ? `${config.label} 접수부터 최종 처리까지 상태 변경과 담당자 작업 기록을 조회합니다.` : config.subtitle}/>
    <Metrics items={[{ label: '전체', value: `${records.length}건`, note: `${config.label} 업무 기준` }, { label: '처리 필요', value: `${records.filter((item) => !['완료', '반려'].includes(item.stage)).length}건`, note: '완료·반려 제외', dot: '#f59e0b' }, { label: '완료', value: `${records.filter((item) => item.stage === '완료').length}건`, note: '정상 종료', dot: '#10b981' }, { label: '반려', value: `${records.filter((item) => item.stage === '반려').length}건`, note: '사유 기록 필수', dot: '#ef4444' }]}/>
    <ControlArea><div className={shared.quickFilters}>{['전체', ...config.stages].map((status) => { const active = quick === status; return <CommonButton key={status} variant={active ? 'primary-light' : 'secondary'} size="md" className={`${shared.qfBtn} ${active ? styles.quickActive : ''}`} onClick={() => setQuick(status)}><span className={shared.qfLabel}>{status}</span><span className={shared.qfCount}>{records.filter((item) => status === '전체' || item.stage === status).length}</span></CommonButton>; })}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>처리번호</option><option>주문번호</option><option>회원</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={`${config.label}번호 / 주문번호 / 회원 / 상품 / 사유`}/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={shared.selectSm} value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="">전체 담당자</option><option value="미배정">미배정</option><option value="배정">배정 완료</option></select></label><span>접수일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => notify(`${filtered.length}건의 목록을 다운로드합니다.`)}>목록 다운로드</button></ResultBar><DataGrid columns={[{ label: `${config.label}번호 / 접수일` }, { label: '주문 / 회원' }, { label: '상품 / 사유' }, { label: '금액', align: 'right' }, { label: '처리 단계' }, { label: '담당 / 채널' }, { label: '최근 변경' }, { label: '관리' }]} rows={rows} gridTemplate="165px 165px minmax(230px,1.4fr) 100px 100px 130px 130px 55px" minWidth="1110px" empty={!filtered.length} emptyText="조건에 맞는 처리 건이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'}/></GridArea>
    {selected && <DetailDrawer eyebrow={`${config.label} ${history ? '감사 이력' : '처리'} · ${selected.id}`} title={selected.product} status={selected.stage} statusMeta={STATUS_META[selected.stage] ?? STATUS_META.검토중} subtitle={`${selected.orderId} · ${selected.member}`} onClose={() => setSelectedId(null)} actions={!history && !['완료', '반려'].includes(selected.stage) ? <><button type="button" className={drawer.primaryBtn} onClick={advance}>다음 단계 처리</button><button type="button" className={drawer.dangerBtn} onClick={() => { setRecords((items) => items.map((item) => item.id === selected.id ? { ...item, stage: '반려' } : item)); notify(`${selected.id} 건을 반려했습니다.`); }}>반려</button></> : undefined} stats={[{ label: '처리 금액', value: fmtWon(selected.amount) }, { label: '현재 단계', value: selected.stage }, { label: '담당자', value: selected.assignee }]} fields={[{ label: '접수 채널', value: selected.channel }, { label: '접수 사유', value: selected.reason }, { label: '접수일', value: selected.requestedAt }, { label: '최근 변경', value: selected.updatedAt }]}><div className={drawer.sectionTitleLoose}>상태 변경 이력</div><div className={styles.historyList}><div className={styles.historyItem}><span>고객 요청 접수</span><strong>{selected.channel}</strong><time>{selected.requestedAt}</time></div><div className={styles.historyItem}><span>최근 상태 변경</span><strong>{selected.stage} · {selected.assignee}</strong><time>{selected.updatedAt}</time></div></div></DetailDrawer>}
    {toast && <div className={styles.toast}>{toast}</div>}
  </section>;
}

export const CancelProcessingPage = () => <ClaimPage kind="cancel"/>;
export const CancelHistoryPage = () => <ClaimPage kind="cancel" history/>;
export const ReturnProcessingPage = () => <ClaimPage kind="return"/>;
export const ReturnHistoryPage = () => <ClaimPage kind="return" history/>;
export const ExchangeProcessingPage = () => <ClaimPage kind="exchange"/>;
export const ExchangeHistoryPage = () => <ClaimPage kind="exchange" history/>;

interface DeliveryRecord {
  id: string; orderId: string; member: string; carrier: string; invoice: string; status: string; issue: string; location: string; shippedAt: string; updatedAt: string; assignee: string;
}

const DELIVERIES: DeliveryRecord[] = [
  { id: 'DLV-260827-4418', orderId: 'ORD-20260825-8412', member: '김지은', carrier: 'CJ대한통운', invoice: '6891-4421-0834', status: '실패', issue: '수취인 부재 2회', location: '마포SUB', shippedAt: '2026-08-26 09:20', updatedAt: '2026-08-27 14:28', assignee: '배송운영1' },
  { id: 'DLV-260827-4402', orderId: 'ORD-20260825-8379', member: '박서연', carrier: '한진택배', invoice: '5418-0921-7720', status: '지연', issue: '도서산간 선편 지연', location: '제주HUB', shippedAt: '2026-08-25 18:40', updatedAt: '2026-08-27 13:50', assignee: '배송운영2' },
  { id: 'DLV-260827-4387', orderId: 'ORD-20260826-8620', member: '이민수', carrier: '롯데택배', invoice: '2387-1140-9301', status: '배송중', issue: '-', location: '성남SUB', shippedAt: '2026-08-26 16:10', updatedAt: '2026-08-27 12:18', assignee: 'SYSTEM' },
  { id: 'DLV-260827-4372', orderId: 'ORD-20260824-7904', member: '최준혁', carrier: '로젠택배', invoice: '9981-4210-3375', status: '배송완료', issue: '-', location: '고객 전달', shippedAt: '2026-08-25 10:24', updatedAt: '2026-08-27 11:03', assignee: 'SYSTEM' },
  { id: 'DLV-260827-4359', orderId: 'ORD-20260826-8588', member: '윤소희', carrier: 'CJ대한통운', invoice: '6891-4421-0762', status: '실패', issue: '주소 불명', location: '강남SUB', shippedAt: '2026-08-26 15:02', updatedAt: '2026-08-27 10:42', assignee: '미배정' },
  { id: 'DLV-260826-4291', orderId: 'ORD-20260823-7241', member: '강태양', carrier: '우체국택배', invoice: '66012-3401-8812', status: '배송완료', issue: '-', location: '문 앞', shippedAt: '2026-08-24 08:55', updatedAt: '2026-08-26 16:11', assignee: 'SYSTEM' },
];

function DeliveryTablePage({ mode }: { mode: 'exceptions' | 'shipments' | 'history' }) {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState(DELIVERIES);
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const source = mode === 'exceptions' ? items.filter((item) => item.issue !== '-') : items;
  const filtered = source.filter((item) => (!status || item.status === status) && (!search || `${item.id} ${item.orderId} ${item.member} ${item.carrier} ${item.invoice} ${item.issue}`.toLowerCase().includes(search.toLowerCase())));
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const title = mode === 'exceptions' ? '배송 예외 관리' : mode === 'shipments' ? '송장 / 배송 추적' : '배송 이력';
  const subtitle = mode === 'exceptions' ? '배송 실패와 배송 보류를 원인·조치 상태로 통합 관리합니다.' : mode === 'shipments' ? '송장 등록 결과와 배송사 트래킹 상태를 주문 단위로 함께 조회합니다.' : '출고 이후 배송 상태와 관리자·배송사 이벤트를 시간순으로 조회합니다.';
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const rows: GridRow[] = filtered.map((item) => { const meta = STATUS_META[item.status] ?? STATUS_META.배송중; return { id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'stack', title: item.id, subtitle: item.updatedAt }, { kind: 'stack', title: item.orderId, subtitle: item.member }, { kind: 'stack', title: item.carrier, subtitle: item.invoice }, { kind: 'badge', text: item.status, bg: meta.bg, fg: meta.fg }, { kind: 'stack', title: item.location, subtitle: item.issue }, { kind: 'text', text: item.shippedAt, color: '#71717a', size: '11px' }, { kind: 'text', text: item.assignee, color: '#52525b', size: '11.5px' }, { kind: 'link', text: '상세' }] }; });
  const reset = () => { setStatus(''); setKeyword(''); setSearch(''); };
  return <section className={shared.page}><PageHeading title={title} subtitle={subtitle}/><Metrics items={[{ label: '조회 대상', value: `${source.length}건`, note: mode === 'exceptions' ? '예외 발생 배송' : '최근 배송' }, { label: '배송중', value: `${items.filter((item) => item.status === '배송중').length}건`, note: '배송사 이동중', dot: '#3b82f6' }, { label: '실패 / 지연', value: `${items.filter((item) => ['실패', '지연'].includes(item.status)).length}건`, note: '운영 확인 필요', dot: '#ef4444' }, { label: '완료', value: `${items.filter((item) => item.status === '배송완료').length}건`, note: '배송 종료', dot: '#10b981' }]}/><ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>배송번호</option><option>주문번호</option><option>송장번호</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="배송번호 / 주문번호 / 회원 / 배송사 / 송장번호"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>배송 상태</span><select aria-label="배송 상태" className={shared.selectSm} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">전체 배송 상태</option>{['배송중', '배송완료', '실패', '지연'].map((item) => <option key={item}>{item}</option>)}</select></label><span>출고일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button></div></FilterBox></ControlArea><GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => notify(`${filtered.length}건을 다운로드합니다.`)}>목록 다운로드</button></ResultBar><DataGrid columns={[{ label: '배송번호 / 갱신일' }, { label: '주문 / 회원' }, { label: '배송사 / 송장' }, { label: '상태' }, { label: '현재 위치 / 예외' }, { label: '출고일' }, { label: '담당자' }, { label: '관리' }]} rows={rows} gridTemplate="165px 165px 165px 90px minmax(190px,1.3fr) 130px 100px 55px" minWidth="1080px" empty={!filtered.length} emptyText="조건에 맞는 배송 건이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'}/></GridArea>{selected && <DetailDrawer eyebrow={`${title} · ${selected.id}`} title={selected.orderId} status={selected.status} statusMeta={STATUS_META[selected.status] ?? STATUS_META.배송중} subtitle={`${selected.carrier} · ${selected.invoice}`} onClose={() => setSelectedId(null)} actions={mode === 'exceptions' && selected.issue !== '-' ? <button type="button" className={drawer.primaryBtn} onClick={() => { setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: '배송중', issue: '-', assignee: 'admin01', updatedAt: '2026-08-27 15:20' } : item)); notify('예외를 해제하고 배송을 재개했습니다.'); }}>배송 재개</button> : undefined} stats={[{ label: '현재 위치', value: selected.location }, { label: '배송 상태', value: selected.status }, { label: '담당자', value: selected.assignee }]} fields={[{ label: '회원', value: selected.member }, { label: '출고일', value: selected.shippedAt }, { label: '최근 갱신', value: selected.updatedAt }, { label: '예외 사유', value: selected.issue }]}>{selected.issue !== '-' && <div className={styles.issueBox}>{selected.issue} — 고객 연락과 배송사 확인 후 재배송·주소 보정·반송 중 하나로 처리합니다.</div>}<div className={drawer.sectionTitleLoose}>배송 이벤트</div><div className={base.timeline}><div className={base.timelineItem}><strong>상품 출고</strong><p>{selected.carrier} 송장 등록</p><time>{selected.shippedAt}</time></div><div className={base.timelineItem}><strong>최근 배송 상태</strong><p>{selected.location} · {selected.status}</p><time>{selected.updatedAt}</time></div></div></DetailDrawer>}{toast && <div className={styles.toast}>{toast}</div>}</section>;
}

export const DeliveryExceptionPage = () => <DeliveryTablePage mode="exceptions"/>;
export const ShipmentTrackingPage = () => <DeliveryTablePage mode="shipments"/>;
export const DeliveryHistoryPage = () => <DeliveryTablePage mode="history"/>;

interface Carrier { id: string; name: string; service: string; cutoff: string; tracking: string; successRate: string; status: string; owner: string; updatedAt: string }
const CARRIERS: Carrier[] = [
  { id: 'CAR-001', name: 'CJ대한통운', service: '일반·당일', cutoff: '평일 15:00', tracking: '실시간 Webhook', successRate: '99.7%', status: '정상', owner: '배송운영', updatedAt: '2026-08-26 17:40' },
  { id: 'CAR-002', name: '한진택배', service: '일반·예약', cutoff: '평일 14:30', tracking: '10분 Polling', successRate: '99.2%', status: '정상', owner: '배송운영', updatedAt: '2026-08-25 11:18' },
  { id: 'CAR-003', name: '롯데택배', service: '일반', cutoff: '평일 15:00', tracking: '실시간 Webhook', successRate: '98.9%', status: '점검', owner: '플랫폼', updatedAt: '2026-08-27 13:05' },
  { id: 'CAR-004', name: '우체국택배', service: '일반·도서산간', cutoff: '평일 13:30', tracking: '30분 Polling', successRate: '99.8%', status: '정상', owner: '배송운영', updatedAt: '2026-08-24 09:12' },
  { id: 'CAR-005', name: '로젠택배', service: '일반', cutoff: '평일 14:00', tracking: '연동 중지', successRate: '97.4%', status: '중지', owner: '플랫폼', updatedAt: '2026-08-20 16:30' },
];

export function CarrierManagementPage() {
  const [carriers, setCarriers] = useState(CARRIERS);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = carriers.find((item) => item.id === selectedId) ?? null;
  const filtered = carriers.filter((item) => (!status || item.status === status) && (!search || `${item.id} ${item.name} ${item.service}`.toLowerCase().includes(search.toLowerCase())));
  const rows: GridRow[] = filtered.map((item) => { const meta = STATUS_META[item.status]; return { id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'stack', title: item.name, subtitle: item.id }, { kind: 'text', text: item.service }, { kind: 'text', text: item.cutoff }, { kind: 'text', text: item.tracking }, { kind: 'text', text: item.successRate, align: 'right', weight: 700 }, { kind: 'badge', text: item.status, bg: meta.bg, fg: meta.fg }, { kind: 'stack', title: item.owner, subtitle: item.updatedAt }, { kind: 'link', text: '설정' }] }; });
  return <section className={shared.page}><PageHeading title="배송사 관리" subtitle="배송사별 서비스 범위, 출고 마감, 송장·트래킹 연동 상태를 관리합니다."/><Metrics items={[{ label: '등록 배송사', value: `${carriers.length}개`, note: '계약 배송사' }, { label: '정상 연동', value: `${carriers.filter((item) => item.status === '정상').length}개`, note: '송장·추적 정상', dot: '#10b981' }, { label: '점검 필요', value: `${carriers.filter((item) => item.status === '점검').length}개`, note: '연동 상태 확인', dot: '#f59e0b' }, { label: '평균 성공률', value: '99.0%', note: '최근 24시간' }]}/><ControlArea><FilterBox><div className={shared.filterRow2}><input className={shared.searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="배송사명 / 배송사 코드 / 서비스"/><label className="globalFilterField"><span>상태</span><select aria-label="상태" className={shared.selectSm} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">전체 상태</option><option>정상</option><option>점검</option><option>중지</option></select></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={() => { setSearch(''); setStatus(''); }}>필터 초기화</button></div></FilterBox></ControlArea><GridArea><ResultBar count={filtered.length} unit="개"/><DataGrid columns={[{ label: '배송사 / 코드' }, { label: '서비스 범위' }, { label: '출고 마감' }, { label: '추적 연동' }, { label: '성공률', align: 'right' }, { label: '상태' }, { label: '담당 / 수정일' }, { label: '관리' }]} rows={rows} gridTemplate="170px 130px 115px 145px 85px 75px minmax(150px,1fr) 55px" minWidth="1020px" showPagination pages={pages} rangeLabel={`1–${filtered.length} / ${filtered.length}`}/></GridArea>{selected && <DetailDrawer eyebrow={`배송사 설정 · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={STATUS_META[selected.status]} subtitle={selected.service} onClose={() => setSelectedId(null)} actions={<button type="button" className={selected.status === '중지' ? drawer.primaryBtn : drawer.dangerBtn} onClick={() => setCarriers((items) => items.map((item) => item.id === selected.id ? { ...item, status: item.status === '중지' ? '정상' : '중지' } : item))}>{selected.status === '중지' ? '연동 재개' : '연동 중지'}</button>} stats={[{ label: '송장 성공률', value: selected.successRate }, { label: '출고 마감', value: selected.cutoff }, { label: '담당 조직', value: selected.owner }]} fields={[{ label: '서비스 범위', value: selected.service }, { label: '트래킹 방식', value: selected.tracking }, { label: '최근 수정', value: selected.updatedAt }]}><div className={drawer.sectionTitleLoose}>관리 경계</div><p className={styles.carrierNote}>배송사는 배송 실행 인프라 설정입니다. 상품별 배송비·묶음·도서산간 조건은 배송 정책에서 관리하고, 상품 마스터에는 배송 정책 연결값만 둡니다.</p></DetailDrawer>}</section>;
}
