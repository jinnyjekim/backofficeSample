import { useMemo, useState } from 'react';
import shared from './opsShared.module.css';
import styles from './EventsPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { EventDetailDrawer } from './EventDetailDrawer';
import { EventEditorPage, type EventFormValues } from './EventEditorPage';
import { EventPreviewDialog } from './EventPreviewDialog';
import {
  EVENTS,
  EVENT_MANAGERS,
  EVENT_STATUS_META,
  EVENT_TARGETS,
  EVENT_TYPES,
  QUICK_FILTER_LABELS,
  benefitSummary,
  computeEventStatus,
  eventIssues,
  fmtCompactRange,
  linkedExposureSummary,
  matchesQuickFilter,
  nextEventId,
  type EventEntry,
  type EventQuickFilter,
  type EventStatus,
  type EventTarget,
  type EventType,
} from './eventsData';

const GRID_TEMPLATE = 'minmax(230px,2fr) 76px 168px 82px 76px 110px 98px 112px 90px 78px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '이벤트명' }, { label: '유형' }, { label: '참여 / 노출기간' }, { label: '참여대상' },
  { label: '참여', align: 'right' }, { label: '혜택' }, { label: '상태' }, { label: '연결노출' }, { label: '담당자' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

type ConfirmState = { kind: 'end' | 'delete'; id: string } | null;

function toStoreDate(value: string): string {
  return value ? value.replace('T', ' ') : '';
}

export function EventsPage() {
  const [events, setEvents] = useState<EventEntry[]>(EVENTS);
  const [filter, setFilter] = useState<EventQuickFilter>('전체');
  const [q, setQ] = useState('');
  const [searchField, setSearchField] = useState('전체');
  const [typeFilter, setTypeFilter] = useState<'전체' | EventType>('전체');
  const [targetFilter, setTargetFilter] = useState<'전체' | EventTarget>('전체');
  const [statusFilter, setStatusFilter] = useState<'전체' | EventStatus>('전체');
  const [managerFilter, setManagerFilter] = useState('전체');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<'new' | string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [bulkManager, setBulkManager] = useState('admin01');
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    const result: Record<EventQuickFilter, number> = { 전체: 0, 진행중: 0, '진행 예정': 0, 종료: 0, 비활성: 0, '확인 필요': 0 };
    QUICK_FILTER_LABELS.forEach((key) => { result[key] = events.filter((event) => matchesQuickFilter(event, key)).length; });
    return result;
  }, [events]);

  const filtered = useMemo(() => events.filter((event) => {
    if (!matchesQuickFilter(event, filter)) return false;
    if (typeFilter !== '전체' && event.type !== typeFilter) return false;
    if (targetFilter !== '전체' && event.target !== targetFilter) return false;
    if (statusFilter !== '전체' && computeEventStatus(event) !== statusFilter) return false;
    if (managerFilter !== '전체' && event.manager !== managerFilter) return false;
    if (dateFrom && event.eventEndAt.slice(0, 10) < dateFrom) return false;
    if (dateTo && event.eventStartAt.slice(0, 10) > dateTo) return false;
    if (!q.trim()) return true;
    const query = q.trim().toLowerCase();
    if (searchField === '이벤트번호') return event.id.toLowerCase().includes(query);
    if (searchField === '관리명') return event.managementName.toLowerCase().includes(query);
    if (searchField === '사용자 노출명') return event.displayName.toLowerCase().includes(query);
    return [event.id, event.managementName, event.displayName].some((value) => value.toLowerCase().includes(query));
  }), [events, filter, managerFilter, q, searchField, statusFilter, targetFilter, typeFilter, dateFrom, dateTo]);

  const selected = selectedId ? events.find((event) => event.id === selectedId) ?? null : null;
  const previewEvent = previewId ? events.find((event) => event.id === previewId) ?? null : null;
  const editingEvent = editorTarget && editorTarget !== 'new' ? events.find((event) => event.id === editorTarget) ?? null : null;
  const confirmEvent = confirm ? events.find((event) => event.id === confirm.id) ?? null : null;

  function updateEvent(id: string, updater: (event: EventEntry) => EventEntry) {
    setEvents((prev) => prev.map((event) => event.id === id ? updater(event) : event));
  }

  function openDetail(id: string) {
    setSelectedId(id);
    setEditorTarget(null);
    setMenuId(null);
  }

  function openEditor(target: 'new' | EventEntry) {
    setSelectedId(null);
    setMenuId(null);
    setEditorTarget(target === 'new' ? 'new' : target.id);
  }

  function startEvent(id: string) {
    updateEvent(id, (event) => ({
      ...event, isDraft: false, isActive: true, manuallyEnded: false, updatedAt: '방금',
      history: [...event.history, { when: '방금', title: '진행 설정', by: '관리자', detail: '설정한 일정에 따라 자동 시작' }],
    }));
  }

  function toggleActive(id: string) {
    updateEvent(id, (event) => ({
      ...event, isActive: !event.isActive, updatedAt: '방금',
      history: [...event.history, { when: '방금', title: event.isActive ? '비활성 처리' : '활성화', by: '관리자' }],
    }));
  }

  function endEvent(id: string) {
    updateEvent(id, (event) => ({
      ...event, manuallyEnded: true, updatedAt: '방금',
      history: [...event.history, { when: '방금', title: '이벤트 조기 종료', by: '관리자', detail: '운영상 조기 종료' }],
    }));
    setConfirm(null);
  }

  function addMemo(id: string, text: string) {
    updateEvent(id, (event) => ({ ...event, memos: [...event.memos, { when: '방금', by: '관리자', text }] }));
  }

  function duplicateEvent(id: string) {
    const source = events.find((event) => event.id === id);
    if (!source) return;
    const newId = nextEventId(events);
    const clone: EventEntry = {
      ...source,
      id: newId,
      managementName: `[복사본] ${source.managementName}`,
      displayName: `${source.displayName} (복사본)`,
      eventStartAt: '', eventEndAt: '', displayStartAt: '', displayEndAt: '',
      participants: 0, todayParticipants: 0, pageViews: 0, benefitGranted: 0, benefitPending: 0, benefitFailed: 0,
      linkedBanners: [], linkedPopups: [], linkedNotice: null,
      isDraft: true, isActive: true, manuallyEnded: false,
      issueFlags: ['기간 재설정 필요', '연결 노출 없음'],
      createdAt: '방금', updatedAt: '방금', history: [{ when: '방금', title: '이벤트 복제', by: '관리자', detail: source.id }], memos: [],
      winner: source.winner ? { ...source.winner, totalEntries: 0, confirmedWinners: 0, status: '선정 대기' } : undefined,
    };
    setEvents((prev) => [clone, ...prev]);
    setSelectedId(null);
    setEditorTarget(newId);
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    setSelectedId(null);
    setConfirm(null);
  }

  function submitEditor(values: EventFormValues, mode: 'draft' | 'publish') {
    const current = editingEvent;
    const id = current?.id ?? nextEventId(events);
    const baseIssues = [
      !values.hasHeroImage && '대표 이미지 미등록',
      !values.content.trim() && '콘텐츠 작성 필요',
      !values.bannerLinked && !values.popupLinked && !values.noticeLinked && '연결 노출 없음',
    ].filter(Boolean) as string[];
    const linkedBanners = values.bannerLinked ? (current?.linkedBanners.length ? current.linkedBanners : [{ id: 'BNR-연결대기', name: '연결 배너', status: '노출예정' as const }]) : [];
    const linkedPopups = values.popupLinked ? (current?.linkedPopups.length ? current.linkedPopups : [{ id: 'POP-연결대기', name: '연결 팝업', status: '노출예정' as const }]) : [];
    const linkedNotice = values.noticeLinked ? (current?.linkedNotice ?? { id: 'NOTICE-연결대기', name: '관련 공지', status: '게시중' as const }) : null;
    const next: EventEntry = {
      id,
      managementName: values.managementName || '관리명 미입력',
      displayName: values.displayName || '이벤트명 미입력',
      type: values.type,
      summary: values.summary,
      content: values.content,
      participationGuide: values.participationGuide,
      caution: values.caution,
      imageTone: values.imageTone,
      hasHeroImage: values.hasHeroImage,
      eventStartAt: toStoreDate(values.eventStartAt),
      eventEndAt: toStoreDate(values.eventEndAt),
      displayStartAt: toStoreDate(values.displayStartAt),
      displayEndAt: toStoreDate(values.displayEndAt),
      target: values.target,
      targetDetail: values.targetDetail,
      exclusions: values.exclusions,
      participationMethod: values.participationMethod,
      participationLimit: values.participationLimit,
      benefitType: values.benefitType,
      benefitName: values.benefitType === '혜택 없음' ? '-' : values.benefitName,
      grantMethod: values.grantMethod,
      benefitTotal: values.benefitTotal,
      benefitGranted: current?.benefitGranted ?? 0,
      benefitPending: current?.benefitPending ?? 0,
      benefitFailed: current?.benefitFailed ?? 0,
      participants: current?.participants ?? 0,
      todayParticipants: current?.todayParticipants ?? 0,
      targetCount: current?.targetCount,
      pageViews: current?.pageViews ?? 0,
      linkedBanners,
      linkedPopups,
      linkedNotice,
      manager: values.manager,
      createdAt: current?.createdAt ?? '방금',
      updatedAt: '방금',
      isDraft: mode === 'draft',
      isActive: current?.isActive ?? true,
      manuallyEnded: current?.manuallyEnded ?? false,
      issueFlags: baseIssues,
      winner: values.type === '응모형' ? {
        totalEntries: current?.winner?.totalEntries ?? current?.participants ?? 0,
        plannedWinners: values.plannedWinners,
        confirmedWinners: current?.winner?.confirmedWinners ?? 0,
        announcementAt: toStoreDate(values.announcementAt),
        selectionMethod: values.selectionMethod,
        status: current?.winner?.status ?? '선정 대기',
      } : undefined,
      history: [...(current?.history ?? []), { when: '방금', title: current ? (mode === 'draft' ? '임시 저장' : '이벤트 수정') : (mode === 'draft' ? '임시 저장' : '이벤트 등록'), by: '관리자' }],
      memos: values.memo.trim() ? [...(current?.memos ?? []), { when: '방금', by: '관리자', text: values.memo.trim() }] : current?.memos ?? [],
    };
    setEvents((prev) => current ? prev.map((event) => event.id === current.id ? next : event) : [next, ...prev]);
    setEditorTarget(null);
    setSelectedId(id);
  }

  function resetFilters() {
    setFilter('전체'); setQ(''); setSearchField('전체'); setTypeFilter('전체'); setTargetFilter('전체');
    setStatusFilter('전체'); setManagerFilter('전체'); setDateFrom(''); setDateTo(''); setSelectedIds([]);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  }

  function toggleAll() {
    const visibleIds = filtered.map((event) => event.id);
    setSelectedIds((prev) => visibleIds.every((id) => prev.includes(id)) ? prev.filter((id) => !visibleIds.includes(id)) : [...new Set([...prev, ...visibleIds])]);
  }

  function assignManager() {
    setEvents((prev) => prev.map((event) => selectedIds.includes(event.id) ? { ...event, manager: bulkManager, updatedAt: '방금', history: [...event.history, { when: '방금', title: '담당자 지정', by: '관리자', detail: bulkManager }] } : event));
    setSelectedIds([]);
  }

  function downloadCsv() {
    const header = ['이벤트번호', '관리명', '노출명', '유형', '참여기간', '노출기간', '참여대상', '참여수', '혜택', '상태', '담당자'];
    const source = selectedIds.length ? events.filter((event) => selectedIds.includes(event.id)) : filtered;
    const rows = source.map((event) => [event.id, event.managementName, event.displayName, event.type, fmtCompactRange(event.eventStartAt, event.eventEndAt), fmtCompactRange(event.displayStartAt, event.displayEndAt), event.target, event.participants, event.benefitName, computeEventStatus(event), event.manager]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'events.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  function rowMenuItems(event: EventEntry) {
    const status = computeEventStatus(event);
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(event.id) },
      { label: '수정', click: () => openEditor(event) },
      { label: '미리보기', click: () => setPreviewId(event.id) },
      { sep: true },
    ];
    if (status === '작성중') items.push({ label: '진행 설정', click: () => startEvent(event.id) });
    if (status === '진행 예정') items.push({ label: '비활성', click: () => toggleActive(event.id) });
    if (status === '진행중') items.push({ label: '참여자 보기', click: () => openDetail(event.id) }, { label: '연결 배너 / 팝업', click: () => openDetail(event.id) }, { label: '조기 종료', fg: '#dc2626', click: () => setConfirm({ kind: 'end', id: event.id }) });
    if (status === '종료') items.push({ label: '참여 / 결과', click: () => openDetail(event.id) }, { label: '변경 이력', click: () => openDetail(event.id) });
    if (status === '비활성') items.push({ label: '활성화', click: () => toggleActive(event.id) });
    items.push({ label: '복제', click: () => duplicateEvent(event.id) });
    if (status === '작성중' && event.participants === 0) items.push({ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', id: event.id }) });
    return items.map((item) => item.click ? { ...item, click: () => { item.click?.(); setMenuId(null); } } : item);
  }

  const gridRows: GridRow[] = filtered.map((event) => {
    const status = computeEventStatus(event);
    const meta = EVENT_STATUS_META[status];
    const issues = eventIssues(event);
    const cells: Cell[] = [
      { kind: 'stack', title: event.displayName, subtitle: `${event.managementName} · ${event.id}` },
      { kind: 'pillText', text: event.type, bg: '#f4f4f5', fg: '#52525b' },
      { kind: 'stack', title: fmtCompactRange(event.eventStartAt, event.eventEndAt), subtitle: `노출 ${fmtCompactRange(event.displayStartAt, event.displayEndAt)}` },
      { kind: 'text', text: event.target.replace(' 사용자', ''), color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'text', text: event.participationMethod === '참여 기능 없음' ? '-' : event.participants.toLocaleString('ko-KR'), color: '#27272a', size: '12px', weight: 700, align: 'right', numeric: true },
      { kind: 'stack', title: benefitSummary(event), subtitle: event.benefitType === '혜택 없음' ? '-' : event.benefitName },
      { kind: 'badgeSub', text: status, bg: meta.bg, fg: meta.fg, subText: issues.length ? `⚠ ${issues.length}건` : undefined },
      { kind: 'text', text: linkedExposureSummary(event), color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'stack', title: event.manager, subtitle: event.updatedAt === '방금' ? '방금' : event.updatedAt.slice(5, 10).replace('-', '.') },
      { kind: 'rowMenu', detailLabel: '상세', onDetail: () => openDetail(event.id), open: menuId === event.id, onToggle: () => setMenuId(menuId === event.id ? null : event.id), items: rowMenuItems(event) },
    ];
    return { id: event.id, cells, onClick: () => openDetail(event.id), selected: selectedIds.includes(event.id), onToggleSelect: () => toggleSelect(event.id) };
  });

  if (editorTarget) {
    return <EventEditorPage event={editingEvent} onCancel={() => setEditorTarget(null)} onSubmit={submitEditor} />;
  }

  return (
    <div className={shared.page} onClick={() => menuId && setMenuId(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div><div className={shared.title}>이벤트 관리</div><div className={shared.subtitle}>서비스에서 진행하는 이벤트 콘텐츠와 참여·혜택·노출 현황을 관리합니다.</div></div>
          <button type="button" className={shared.createBtn} onClick={() => openEditor('new')}>＋ 이벤트 등록</button>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTER_LABELS.map((key) => {
            const active = filter === key;
            return <button key={key} type="button" className={shared.qfBtn} style={{ borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: active ? 'var(--accent)' : '#fff' }} onClick={() => setFilter(key)}><span className={shared.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{key}</span><span className={shared.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[key]}</span></button>;
          })}
        </div>

        <div className={shared.filterBox}>
          <div className={shared.filterRow1}>
            <select className={shared.selectSm} value={searchField} onChange={(e) => setSearchField(e.target.value)}><option>전체</option><option>이벤트번호</option><option>관리명</option><option>사용자 노출명</option></select>
            <input className={shared.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="이벤트 관리명, 노출명 또는 번호" />
            <button type="button" className={shared.searchBtn}>검색</button>
          </div>
          <div className={shared.filterRow2}>
            <select className={shared.selectXs} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '전체' | EventStatus)}><option value="전체">진행상태 전체</option>{Object.keys(EVENT_STATUS_META).map((item) => <option key={item}>{item}</option>)}</select>
            <select className={shared.selectXs} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as '전체' | EventType)}><option value="전체">이벤트유형 전체</option>{EVENT_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={shared.selectXs} value={targetFilter} onChange={(e) => setTargetFilter(e.target.value as '전체' | EventTarget)}><option value="전체">참여대상 전체</option>{EVENT_TARGETS.map((item) => <option key={item}>{item}</option>)}</select>
            <button type="button" className={shared.detailFilterBtn} onClick={() => setShowAdvanced((value) => !value)}>상세 필터 {showAdvanced ? '−' : '＋'}</button>
            <div className={shared.rowSpacer} />
            <button type="button" className={shared.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
          {showAdvanced && <div className={styles.advancedFilters}>
            <label className={styles.filterField}><span className={styles.filterLabel}>담당자</span><select className={styles.filterControl} value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}><option>전체</option>{EVENT_MANAGERS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className={styles.filterPeriod}><label className={styles.filterField}><span className={styles.filterLabel}>진행기간 시작</span><input type="date" className={styles.filterControl} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label><span className={styles.periodDash}>~</span><label className={styles.filterField}><span className={styles.filterLabel}>진행기간 종료</span><input type="date" className={styles.filterControl} value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label></div>
            <div className={styles.issueSummary}>⚠ 확인 필요 {counts['확인 필요']}건</div>
          </div>}
        </div>

        <div className={shared.resultRow}><span className={shared.resultLabel}>총 {filtered.length}건</span><div className={shared.resultActions}><button type="button" className={shared.downloadBtn} onClick={downloadCsv}>↓ 다운로드</button><select className={shared.pageSizeSelect} defaultValue="20개씩 보기"><option>20개씩 보기</option><option>50개씩 보기</option></select></div></div>
      </div>

      {selectedIds.length > 0 && <div className={shared.bulkBar}><span className={shared.bulkLabel}>{selectedIds.length}건 선택됨</span><select className={styles.bulkManager} value={bulkManager} onChange={(e) => setBulkManager(e.target.value)}>{EVENT_MANAGERS.map((item) => <option key={item}>{item}</option>)}</select><button type="button" className={shared.bulkBtn} onClick={assignManager}>담당자 지정</button><button type="button" className={shared.bulkBtn} onClick={downloadCsv}>다운로드</button></div>}

      <div className={shared.gridWrap}>
        <DataGrid columns={GRID_COLUMNS} rows={gridRows} gridTemplate={GRID_TEMPLATE} minWidth="1320px" selectable allSelected={filtered.length > 0 && filtered.every((event) => selectedIds.includes(event.id))} onToggleAll={toggleAll} showPagination pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))} empty={gridRows.length === 0} emptyText={filter === '진행중' ? '현재 진행중인 이벤트가 없습니다.' : filter === '진행 예정' ? '예정된 이벤트가 없습니다.' : filter === '확인 필요' ? '현재 운영 확인이 필요한 이벤트가 없습니다.' : q || typeFilter !== '전체' || targetFilter !== '전체' ? '검색 결과가 없습니다.' : '등록된 이벤트가 없습니다.'} emptySubtext={gridRows.length === 0 ? '검색어나 필터 조건을 변경해 주세요.' : undefined} emptyActionLabel={gridRows.length === 0 ? '필터 초기화' : undefined} emptyActionClick={resetFilters} />
      </div>

      {selected && <EventDetailDrawer event={selected} onClose={() => setSelectedId(null)} onEdit={() => openEditor(selected)} onPreview={() => setPreviewId(selected.id)} onDuplicate={() => duplicateEvent(selected.id)} onStart={() => startEvent(selected.id)} onEnd={() => setConfirm({ kind: 'end', id: selected.id })} onToggleActive={() => toggleActive(selected.id)} onAddMemo={(text) => addMemo(selected.id, text)} />}
      {previewEvent && <EventPreviewDialog event={previewEvent} onClose={() => setPreviewId(null)} />}

      {confirm?.kind === 'end' && confirmEvent && <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}><div className={shared.dialogBox}><div className={shared.dialogTitle}>이벤트를 조기 종료하시겠습니까?</div><div className={shared.dialogBody}>{confirmEvent.displayName}</div><div className={shared.dialogSummary}><div className={shared.dialogSummaryRow}><span>기존 종료일</span><span>{confirmEvent.eventEndAt}</span></div><div className={shared.dialogSummaryRow}><span>현재 참여</span><span>{confirmEvent.participants.toLocaleString('ko-KR')}명</span></div><div className={shared.dialogSummaryRow}><span>혜택 지급 대기</span><span>{confirmEvent.benefitPending.toLocaleString('ko-KR')}건</span></div></div><div className={styles.dialogNote}>종료 후 신규 참여는 불가하지만 기존 참여 데이터와 지급 대기 혜택은 유지됩니다.</div><div className={shared.dialogActions} style={{ marginTop: 16 }}><button type="button" className={shared.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button><button type="button" className={shared.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => endEvent(confirmEvent.id)}>이벤트 종료</button></div></div></div>}
      {confirm?.kind === 'delete' && confirmEvent && <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}><div className={shared.dialogBox}><div className={shared.dialogTitle}>이벤트 초안을 삭제하시겠습니까?</div><div className={shared.dialogBody}>{confirmEvent.managementName}<br />참여자와 노출 이력이 없는 작성중 이벤트만 삭제할 수 있습니다.</div><div className={shared.dialogActions}><button type="button" className={shared.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button><button type="button" className={shared.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => deleteEvent(confirmEvent.id)}>삭제</button></div></div></div>}
    </div>
  );
}
