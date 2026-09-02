import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './ReportManagement.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import {
  REPORT_AUDIT_LOGS,
  REPORT_CASES,
  REPORT_PRIORITY_META,
  REPORT_STATUS_META,
  type ReportCase,
  type ReportPriority,
  type ReportStatus,
  type ReportTargetType,
} from './reportData';

type ReportQuick = '전체' | '처리 필요' | '검토중' | '소명대기' | '조치 연계' | '종결';

const TARGET_BY_PARAM: Record<string, ReportTargetType> = { members: '회원', products: '상품', trades: '거래', messages: '메시지', reviews: '리뷰' };
const PARAM_BY_TARGET: Record<ReportTargetType, string> = { 회원: 'members', 상품: 'products', 거래: 'trades', 메시지: 'messages', 리뷰: 'reviews' };
const TARGETS: ReportTargetType[] = ['회원', '상품', '거래', '메시지', '리뷰'];

function quickFromQuery(value: string | null): ReportQuick {
  if (value === 'pending') return '처리 필요';
  if (value === 'completed') return '종결';
  return '전체';
}

function matchesQuick(item: ReportCase, quick: ReportQuick) {
  if (quick === '전체') return true;
  if (quick === '처리 필요') return item.status === '접수';
  if (quick === '조치 연계') return item.status === '조치연계';
  if (quick === '종결') return item.status === '처리완료' || item.status === '반려';
  return item.status === quick;
}

function actionLabel(type: ReportTargetType) {
  if (type === '회원') return '회원 제재 검토';
  if (type === '상품') return '상품 조치 검토';
  if (type === '거래') return '분쟁 / 안전 검토';
  if (type === '메시지') return '채팅 제한 검토';
  return '리뷰 조치 검토';
}

export function ReportProcessingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<ReportCase[]>(REPORT_CASES);
  const [quick, setQuickState] = useState<ReportQuick>(() => quickFromQuery(searchParams.get('status')));
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<ReportPriority | ''>('');
  const [assignee, setAssignee] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const targetType = TARGET_BY_PARAM[searchParams.get('target') ?? ''] ?? '';
  const selected = reports.find((item) => item.id === selectedId) ?? null;
  const quicks: ReportQuick[] = ['전체', '처리 필요', '검토중', '소명대기', '조치 연계', '종결'];

  const filtered = useMemo(() => reports.filter((item) => {
    if (!matchesQuick(item, quick)) return false;
    if (targetType && item.targetType !== targetType) return false;
    if (priority && item.priority !== priority) return false;
    if (assignee && (assignee === '미배정' ? item.assignee !== '미배정' : item.assignee === '미배정')) return false;
    if (search && !`${item.id} ${item.targetId} ${item.targetTitle} ${item.reporterId} ${item.reportedUserId} ${item.category} ${item.summary}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [assignee, priority, quick, reports, search, targetType]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const updateParams = (target: ReportTargetType | '', statusQuick: ReportQuick) => {
    const next = new URLSearchParams(searchParams);
    if (target) next.set('target', PARAM_BY_TARGET[target]); else next.delete('target');
    if (statusQuick === '처리 필요') next.set('status', 'pending'); else if (statusQuick === '종결') next.set('status', 'completed'); else next.delete('status');
    setSearchParams(next, { replace: true });
  };
  const selectTarget = (value: ReportTargetType | '') => updateParams(value, quick);
  const selectQuick = (value: ReportQuick) => { setQuickState(value); updateParams(targetType, value); };
  const patchSelected = (status: ReportStatus, action: string, detail: string) => {
    if (!selected) return;
    setReports((items) => items.map((item) => item.id === selected.id ? { ...item, status, assignee: item.assignee === '미배정' ? 'admin01' : item.assignee, actionResult: action === '전문 메뉴 조치 연계' ? `${actionLabel(item.targetType)} 요청` : item.actionResult, history: [{ at: '2026-08-27 13:10', actor: 'admin01', action, detail }, ...item.history] } : item));
    notify(`${selected.id} 신고를 ${action} 처리했습니다.`);
  };
  const reset = () => { setKeyword(''); setSearch(''); setPriority(''); setAssignee(''); setQuickState('전체'); updateParams('', '전체'); };

  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), bg: item.priority === '긴급' && !['처리완료', '반려'].includes(item.status) ? '#fffafa' : undefined, mark: item.priority === '긴급' && !['처리완료', '반려'].includes(item.status) ? 'inset 3px 0 #ef4444' : undefined, cells: [
    { kind: 'stack', title: item.id, subtitle: item.receivedAt },
    { kind: 'pillText', text: item.targetType, bg: '#f4f4f5', fg: '#52525b' },
    { kind: 'stack', title: item.targetTitle, subtitle: item.targetId },
    { kind: 'stack', title: item.category, subtitle: item.summary },
    { kind: 'stack', title: item.reporterId, subtitle: `피신고 ${item.reportedUserId}` },
    { kind: 'badgeSub', text: item.priority, subText: item.duplicateCount > 1 ? `병합 ${item.duplicateCount}건` : '단일 신고', ...REPORT_PRIORITY_META[item.priority] },
    { kind: 'badge', text: item.status, ...REPORT_STATUS_META[item.status] },
    { kind: 'stack', title: item.assignee, subtitle: item.dueAt.slice(5) },
    { kind: 'link', text: '검토' },
  ] }));

  return <section className={shared.page}>
    <PageHeading title="신고 처리" subtitle="회원·상품·거래·메시지·리뷰 신고를 하나의 업무 큐에서 접수하고 전문 조치 메뉴로 연계합니다." />
    <Metrics items={[{ label: '처리 필요', value: `${reports.filter((item) => item.status === '접수').length}건`, note: '담당자 배정 필요', tone: 'down', dot: '#ef4444' }, { label: 'SLA 임박', value: `${reports.filter((item) => !['처리완료', '반려'].includes(item.status) && item.dueAt.slice(0, 10) === '2026-08-27').length}건`, note: '오늘 처리 기한', tone: 'down', dot: '#f59e0b' }, { label: '소명 대기', value: `${reports.filter((item) => item.status === '소명대기').length}건`, note: '피신고자 응답 대기', dot: '#8b5cf6' }, { label: '조치 연계', value: `${reports.filter((item) => item.status === '조치연계').length}건`, note: '전문 메뉴 처리 확인', dot: '#4f7bd9' }]} />
    <ControlArea><div className={shared.quickFilters}>{quicks.map((item) => <button type="button" key={item} className={`${shared.qfBtn} ${quick === item ? base.quickActive : ''}`} onClick={() => selectQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{reports.filter((report) => matchesQuick(report, item)).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>신고번호</option><option>신고 대상</option><option>신고자 / 피신고자</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="신고번호 / 대상 / 신고자 / 피신고자 / 사유" /><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>신고 대상</span><select aria-label="신고 대상" className={shared.selectSm} value={targetType} onChange={(event) => selectTarget(event.target.value as ReportTargetType | '')}><option value="">전체 신고 대상</option>{TARGETS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>우선순위</span><select aria-label="우선순위" className={shared.selectSm} value={priority} onChange={(event) => setPriority(event.target.value as ReportPriority | '')}><option value="">전체 우선순위</option><option>긴급</option><option>높음</option><option>보통</option><option>낮음</option></select></label><label className="globalFilterField"><span>배정 상태</span><select aria-label="배정 상태" className={shared.selectSm} value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="">전체 배정 상태</option><option>미배정</option><option value="배정">담당자 배정</option></select></label><span>접수일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" /><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-reports.csv', ['신고번호', '접수일', '대상 유형', '대상', '사유', '우선순위', '상태', '담당자'], filtered.map((item) => [item.id, item.receivedAt, item.targetType, item.targetId, item.category, item.priority, item.status, item.assignee]))}>다운로드</button></ResultBar><DataGrid columns={[{ label: '신고번호 / 접수일' }, { label: '대상 유형' }, { label: '신고 대상' }, { label: '신고 사유 / 내용' }, { label: '신고자 / 피신고자' }, { label: '우선순위' }, { label: '처리 상태' }, { label: '담당자 / 기한' }, { label: '관리' }]} rows={rows} gridTemplate="122px 58px 164px minmax(240px,1.45fr) 102px 58px 74px 78px 55px" minWidth="1000px" empty={!filtered.length} emptyText="조건에 맞는 신고가 없습니다." emptySubtext="신고 대상이나 상태 필터를 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} /></GridArea>
    {selected && <DetailDrawer eyebrow={`신고 처리 · ${selected.id}`} title={selected.targetTitle} status={selected.status} statusMeta={REPORT_STATUS_META[selected.status]} subtitle={`${selected.targetType} 신고 · ${selected.receivedAt}`} onClose={() => setSelectedId(null)} actions={<>{selected.status === '접수' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('검토중', '검토 시작', '담당자 배정 및 신고 증빙 확인')}>검토 시작</button>}{(selected.status === '접수' || selected.status === '검토중') && <button type="button" className={drawer.actionLink} onClick={() => patchSelected('소명대기', '소명 요청', '피신고자에게 사실관계 및 증빙 제출 요청')}>소명 요청</button>}{['접수', '검토중', '소명대기'].includes(selected.status) && selected.linkedAction !== '-' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('조치연계', '전문 메뉴 조치 연계', actionLabel(selected.targetType))}>조치 연계</button>}{selected.status === '조치연계' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('처리완료', '신고 처리 완료', '연계 조치 결과 확인 완료')}>처리 완료</button>}<span className={drawer.spacer} />{!['처리완료', '반려'].includes(selected.status) && <button type="button" className={drawer.dangerBtn} onClick={() => patchSelected('반려', '신고 반려', '운영 정책 위반 또는 피해 사실 확인 불가')}>신고 반려</button>}</>} stats={[{ label: '우선순위', value: selected.priority }, { label: '병합 신고', value: `${selected.duplicateCount}건` }, { label: '처리 기한', value: selected.dueAt.slice(0, 10) }]} fields={[{ label: '신고 대상', value: `${selected.targetType} · ${selected.targetId}` }, { label: '신고자', value: selected.reporterId }, { label: '피신고자', value: selected.reportedUserId }, { label: '신고 유형', value: selected.category }, { label: '담당자', value: selected.assignee }, { label: '연계 결과', value: selected.actionResult }]}><div className={drawer.sectionTitleLoose}>신고 내용</div><div className={styles.reportSummary}>{selected.summary}</div><div className={drawer.sectionTitleLoose}>증빙 자료</div><div className={styles.evidenceList}>{selected.evidence.map((item) => <div key={item} className={styles.evidenceItem}>{item}</div>)}</div>{selected.linkedAction !== '-' && <><div className={drawer.sectionTitleLoose}>전문 조치 연계</div><div className={styles.linkBox}><div><span>조치 책임 메뉴</span><strong>{actionLabel(selected.targetType)}</strong></div><button type="button" className={styles.linkBadge} onClick={() => window.location.assign(selected.linkedAction)}>연결 화면 ↗</button></div><div className={styles.boundaryNote}>신고 관리에서는 접수·증빙·판단을 관리합니다. 상품 숨김, 회원 제재, 거래 조정, 채팅 제한 같은 실제 조치는 연결된 전문 메뉴에서 실행합니다.</div></>}<div className={drawer.sectionTitleLoose}>처리 이력</div><div className={base.timeline}>{selected.history.map((item, index) => <div className={base.timelineItem} key={`${item.at}-${index}`}><strong>{item.action}</strong><p>{item.detail} · {item.actor}</p><time>{item.at}</time></div>)}</div></DetailDrawer>}
    {toast && <div className={base.toast}>{toast}</div>}
  </section>;
}

export function ReportHistoryPage() {
  const [targetType, setTargetType] = useState<ReportTargetType | ''>('');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [actor, setActor] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = REPORT_AUDIT_LOGS.find((item) => item.id === selectedId) ?? null;
  const filtered = useMemo(() => REPORT_AUDIT_LOGS.filter((item) => (!targetType || item.targetType === targetType) && (!actor || (actor === 'SYSTEM' ? item.actor === 'SYSTEM' : item.actor !== 'SYSTEM')) && (!search || `${item.id} ${item.reportId} ${item.targetId} ${item.action} ${item.reason} ${item.actor}`.toLowerCase().includes(search.toLowerCase()))), [actor, search, targetType]);
  const reset = () => { setTargetType(''); setKeyword(''); setSearch(''); setActor(''); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'stack', title: item.occurredAt, subtitle: item.id }, { kind: 'stack', title: item.reportId, subtitle: `${item.targetType} · ${item.targetId}` }, { kind: 'text', text: item.action, weight: 600 }, { kind: 'text', text: item.before, color: '#71717a' }, { kind: 'text', text: item.after, weight: 600 }, { kind: 'stack', title: item.actor, subtitle: item.linkedAction }, { kind: 'titleWarn', title: item.reason }, { kind: 'link', text: '상세' }] }));
  return <section className={shared.page}>
    <PageHeading title="신고 처리 이력" subtitle="신고 접수부터 검토·소명·전문 조치 연계·종결까지의 상태 변경을 감사 로그로 조회합니다." />
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>로그 ID</option><option>신고번호</option><option>대상 ID</option><option>처리자</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="로그 / 신고 / 대상 ID 또는 처리 사유" /><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>신고 대상</span><select aria-label="신고 대상" className={shared.selectSm} value={targetType} onChange={(event) => setTargetType(event.target.value as ReportTargetType | '')}><option value="">전체 신고 대상</option>{TARGETS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>처리 주체</span><select aria-label="처리 주체" className={shared.selectSm} value={actor} onChange={(event) => setActor(event.target.value)}><option value="">전체 처리 주체</option><option value="관리자">관리자</option><option>SYSTEM</option></select></label><span>처리일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" /><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-report-history.csv', ['처리일', '로그 ID', '신고번호', '대상', '처리', '변경 전', '변경 후', '처리자', '사유'], filtered.map((item) => [item.occurredAt, item.id, item.reportId, `${item.targetType}:${item.targetId}`, item.action, item.before, item.after, item.actor, item.reason]))}>다운로드</button></ResultBar><DataGrid columns={[{ label: '처리일 / 로그 ID' }, { label: '신고 / 대상' }, { label: '처리' }, { label: '변경 전' }, { label: '변경 후' }, { label: '처리자 / 연계' }, { label: '처리 사유' }, { label: '관리' }]} rows={rows} gridTemplate="128px 134px 106px 48px 58px 222px minmax(230px,1.4fr) 55px" minWidth="1030px" empty={!filtered.length} emptyText="조건에 맞는 신고 처리 이력이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} /></GridArea>
    {selected && <DetailDrawer eyebrow={`신고 처리 로그 · ${selected.id}`} title={selected.action} status="감사 이력" statusMeta={{ bg: '#f4f4f5', fg: '#52525b' }} subtitle={`${selected.reportId} · ${selected.occurredAt}`} onClose={() => setSelectedId(null)} stats={[{ label: '대상 유형', value: selected.targetType }, { label: '대상 ID', value: selected.targetId }, { label: '처리자', value: selected.actor }]} fields={[{ label: '신고번호', value: selected.reportId }, { label: '연계 화면', value: selected.linkedAction }, { label: '처리 사유', value: selected.reason }]}><div className={drawer.sectionTitleLoose}>상태 변경</div><div className={styles.compare}><b>{selected.before}</b><span>→</span><strong>{selected.after}</strong></div><div className={drawer.sectionTitleLoose}>감사 원칙</div><div className={styles.boundaryNote}>신고 처리 이력은 수정하거나 삭제하지 않습니다. 후속 변경은 새로운 로그로 추가되며 전문 메뉴의 실제 조치 이력과 연결 근거를 함께 보존합니다.</div></DetailDrawer>}
  </section>;
}
