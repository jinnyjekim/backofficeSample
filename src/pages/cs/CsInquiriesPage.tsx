import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import { BUSINESS_BADGE_META, BUSINESS_SCOPES, type BusinessScope } from '../../lib/business';
import { InquiryDetailDrawer } from './InquiryDetailDrawer';
import shared from '../ops/opsShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './CsInquiriesPage.module.css';
import {
  fmtDateTime,
  getSlaInfo,
  INQUIRIES,
  INQUIRY_CATEGORIES,
  INQUIRY_MANAGERS,
  INQUIRY_PRIORITIES,
  INQUIRY_STATUSES,
  inquiryIssues,
  matchesQuickFilter,
  nextMessageId,
  PRIORITY_META,
  QUICK_FILTERS,
  STATUS_META,
  type InquiryEntry,
  type InquiryPriority,
  type InquiryQuickFilter,
  type InquiryStatus,
} from './inquiriesData';

type DialogState = { kind: 'assign'; ids: string[] } | { kind: 'complete'; ids: string[] } | null;

const COLUMNS = [
  { label: '문의번호' }, { label: '서비스' }, { label: '유형' }, { label: '문의 제목' }, { label: '고객' }, { label: '관련 대상' },
  { label: '접수일' }, { label: '1차 답변 기한' }, { label: '담당자' }, { label: '상태' }, { label: '우선순위' }, { label: '관리', align: 'right' as const },
];

const TEAM_BY_MANAGER: Record<string, string> = {
  admin01: '배송 CS팀', admin02: '결제 CS팀', admin03: '일반 CS팀', admin04: '정산 CS팀',
};

function appendHistory(inquiry: InquiryEntry, action: string, detail?: string): InquiryEntry {
  return {
    ...inquiry,
    history: [...inquiry.history, {
      id: `H-${Date.now()}-${inquiry.id}`,
      at: '2026-08-24 14:00', action, actor: 'admin01', detail, kind: 'admin',
    }],
  };
}

export function CsInquiriesPage() {
  const [inquiries, setInquiries] = useState(INQUIRIES);
  const [quickFilter, setQuickFilter] = useState<InquiryQuickFilter>('처리 필요');
  const [businessScope, setBusinessScope] = useState<BusinessScope>('통합');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InquiryStatus | ''>('');
  const [category, setCategory] = useState('');
  const [manager, setManager] = useState('');
  const [priority, setPriority] = useState<InquiryPriority | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [receivedFrom, setReceivedFrom] = useState('');
  const [receivedTo, setReceivedTo] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [assignManager, setAssignManager] = useState('admin01');
  const [assignMemo, setAssignMemo] = useState('');
  const [completeReason, setCompleteReason] = useState('안내 완료');
  const [completeMemo, setCompleteMemo] = useState('');
  const [toast, setToast] = useState('');

  const scopeItems = useMemo(() => inquiries.filter((inquiry) => businessScope === '통합' || inquiry.businessType === businessScope), [inquiries, businessScope]);
  const filtered = useMemo(() => scopeItems.filter((inquiry) => {
    if (!matchesQuickFilter(inquiry, quickFilter)) return false;
    const haystack = `${inquiry.id} ${inquiry.title} ${inquiry.body} ${inquiry.customer.id} ${inquiry.customer.name} ${inquiry.relatedItems.map((item) => item.id).join(' ')}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (status && inquiry.status !== status) return false;
    if (category && inquiry.category !== category) return false;
    if (manager === '미배정' ? inquiry.assignee !== null : manager && inquiry.assignee !== manager) return false;
    if (priority && inquiry.priority !== priority) return false;
    if (receivedFrom && inquiry.receivedAt.slice(0, 10) < receivedFrom) return false;
    if (receivedTo && inquiry.receivedAt.slice(0, 10) > receivedTo) return false;
    if (dueTo && inquiry.dueAt.slice(0, 10) > dueTo) return false;
    return true;
  }), [scopeItems, quickFilter, search, status, category, manager, priority, receivedFrom, receivedTo, dueTo]);

  const currentInquiry = inquiries.find((inquiry) => inquiry.id === selectedInquiryId) ?? null;
  const patchInquiry = (id: string, transform: (item: InquiryEntry) => InquiryEntry) => {
    setInquiries((current) => current.map((item) => item.id === id ? transform(item) : item));
  };

  const setToastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const assign = () => {
    if (!dialog || dialog.kind !== 'assign') return;
    setInquiries((current) => current.map((item) => dialog.ids.includes(item.id)
      ? appendHistory({ ...item, assignee: assignManager, team: TEAM_BY_MANAGER[assignManager] }, item.assignee ? '담당자 변경' : '담당자 지정', `${assignManager} · ${assignMemo || TEAM_BY_MANAGER[assignManager]}`)
      : item));
    setDialog(null);
    setSelected([]);
    setAssignMemo('');
    setToastBriefly(`${dialog.ids.length}건의 담당자를 지정했습니다.`);
  };

  const complete = () => {
    if (!dialog || dialog.kind !== 'complete') return;
    setInquiries((current) => current.map((item) => dialog.ids.includes(item.id)
      ? appendHistory({ ...item, status: '처리 완료', completionReason: completeReason }, '처리 완료', `${completeReason}${completeMemo ? ` · ${completeMemo}` : ''}`)
      : item));
    setDialog(null);
    setSelected([]);
    setCompleteMemo('');
    setToastBriefly('문의를 처리 완료했습니다.');
  };

  const start = (id: string) => patchInquiry(id, (item) => appendHistory({
    ...item, status: '처리중', assignee: item.assignee ?? 'admin01', team: item.team ?? TEAM_BY_MANAGER.admin01,
  }, '처리 시작', item.assignee ? undefined : 'admin01 자동 배정'));

  const hold = (id: string) => patchInquiry(id, (item) => appendHistory({ ...item, status: '보류' }, '문의 보류', '내부 확인 필요'));
  const reopen = (id: string) => patchInquiry(id, (item) => appendHistory({ ...item, status: '처리중', reopened: true }, '문의 재오픈', '추가 확인 및 답변 필요'));

  const resetFilters = () => {
    setBusinessScope('통합'); setKeyword(''); setSearch(''); setStatus(''); setCategory(''); setManager(''); setPriority('');
    setReceivedFrom(''); setReceivedTo(''); setDueTo(''); setSelected([]);
  };

  const download = (items: InquiryEntry[]) => {
    const header = '문의번호,서비스,유형,제목,고객,접수일,기한,담당자,상태,우선순위';
    const lines = items.map((item) => [item.id, item.businessType, item.category, item.title, item.customer.name, item.receivedAt, item.dueAt, item.assignee ?? '미배정', item.status, item.priority]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
    const url = URL.createObjectURL(new Blob([`\ufeff${[header, ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'inquiries.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  const menuItems = (inquiry: InquiryEntry) => {
    if (inquiry.status === '접수') return [{ label: '담당자 지정', click: () => setDialog({ kind: 'assign', ids: [inquiry.id] }) }, { label: '처리 시작', click: () => start(inquiry.id) }];
    if (inquiry.status === '답변 완료') return [{ label: '추가 답변', click: () => setSelectedInquiryId(inquiry.id) }, { sep: true }, { label: '처리 완료', click: () => setDialog({ kind: 'complete', ids: [inquiry.id] }) }];
    if (inquiry.status === '처리 완료') return [{ label: '전체 이력 보기', click: () => setSelectedInquiryId(inquiry.id) }, { label: '재오픈', click: () => reopen(inquiry.id) }];
    return [{ label: inquiry.status === '고객 답변 대기' ? '고객 메시지 확인' : '답변 작성', click: () => setSelectedInquiryId(inquiry.id) }, { label: '담당자 변경', click: () => setDialog({ kind: 'assign', ids: [inquiry.id] }) }, { sep: true }, { label: '보류', click: () => hold(inquiry.id) }];
  };

  const rows: GridRow[] = filtered.map((inquiry) => {
    const statusMeta = STATUS_META[inquiry.status];
    const priorityMeta = PRIORITY_META[inquiry.priority];
    const sla = getSlaInfo(inquiry);
    const issues = inquiryIssues(inquiry);
    const related = inquiry.relatedItems[0];
    const [receivedDate, receivedTime] = fmtDateTime(inquiry.receivedAt).split(' ');
    const [dueDate, dueTime] = fmtDateTime(inquiry.dueAt).split(' ');
    return {
      id: inquiry.id,
      selected: selected.includes(inquiry.id),
      onToggleSelect: () => setSelected((current) => current.includes(inquiry.id) ? current.filter((id) => id !== inquiry.id) : [...current, inquiry.id]),
      onClick: () => setSelectedInquiryId(inquiry.id),
      bg: sla.state === 'overdue' ? '#fffafa' : inquiry.reopened ? '#fffdf6' : undefined,
      mark: sla.state === 'overdue' ? 'inset 3px 0 #ef4444' : undefined,
      cells: [
        { kind: 'noTag', no: inquiry.id, hasTag: inquiry.reopened, tagText: '재문의', tagBg: '#fff7ed', tagFg: '#c2410c' },
        { kind: 'badge', text: inquiry.businessType, ...BUSINESS_BADGE_META[inquiry.businessType] },
        { kind: 'pillText', text: inquiry.category, sub: inquiry.subcategory, bg: '#f4f4f5', fg: '#52525b' },
        { kind: 'titleWarn', title: inquiry.title, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'avatarText', title: inquiry.customer.name, subtitle: inquiry.customer.id, avatarChar: inquiry.customer.name.slice(0, 1), avatarBg: '#eef2ff', avatarFg: '#4f46e5' },
        related ? { kind: 'stack', title: related.id, subtitle: `${related.type} · ${related.status}` } : { kind: 'text', text: '연결 없음', size: '13px', color: '#a1a1aa' },
        { kind: 'stack', title: receivedDate, subtitle: receivedTime },
        { kind: 'badgeSub', text: sla.label, subText: `${dueDate} ${dueTime}`, bg: sla.state === 'overdue' ? '#fef2f2' : sla.state === 'imminent' ? '#fffbeb' : '#f4f4f5', fg: sla.color },
        { kind: 'text', text: inquiry.assignee ?? '미배정', size: '12px', color: inquiry.assignee ? '#3f3f46' : '#dc2626', weight: inquiry.assignee ? 500 : 700 },
        { kind: 'badge', text: inquiry.status, bg: statusMeta.bg, fg: statusMeta.fg },
        { kind: 'pillText', text: inquiry.priority, bg: priorityMeta.bg, fg: priorityMeta.fg },
        { kind: 'rowMenu', align: 'right', open: openMenu === inquiry.id, onToggle: () => setOpenMenu(openMenu === inquiry.id ? null : inquiry.id), items: menuItems(inquiry) },
      ],
    };
  });

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div><h1 className={shared.title}>1:1 문의</h1><p className={shared.subtitle}>접수부터 답변, 완료까지 문의 처리 흐름과 SLA를 한 화면에서 관리합니다.</p></div>
          <div className={styles.headerStats}>
            <div><span>답변 필요</span><strong>{scopeItems.filter((item) => matchesQuickFilter(item, '답변 대기')).length}</strong></div>
            <div><span>SLA 임박·초과</span><strong>{scopeItems.filter((item) => ['imminent', 'overdue'].includes(getSlaInfo(item).state)).length}</strong></div>
            <div><span>미배정</span><strong>{scopeItems.filter((item) => !item.assignee).length}</strong></div>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => {
            const count = scopeItems.filter((item) => matchesQuickFilter(item, filter)).length;
            return <button key={filter} type="button" className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`} onClick={() => { setQuickFilter(filter); setSelected([]); }}><span className={shared.qfLabel}>{filter}</span><span className={shared.qfCount}>{count}</span></button>;
          })}
        </div>

        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="문의번호, 제목, 고객, 주문·결제번호 검색" />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <select className={shared.selectSm} value={businessScope} onChange={(event) => { setBusinessScope(event.target.value as BusinessScope); setSelected([]); }} aria-label="비즈니스 범위">{BUSINESS_SCOPES.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={shared.selectSm} value={status} onChange={(event) => setStatus(event.target.value as InquiryStatus | '')}><option value="">전체 상태</option>{INQUIRY_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={shared.selectSm} value={category} onChange={(event) => setCategory(event.target.value)}><option value="">전체 유형</option>{INQUIRY_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={shared.selectSm} value={manager} onChange={(event) => setManager(event.target.value)}><option value="">전체 담당자</option><option>미배정</option>{INQUIRY_MANAGERS.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={shared.selectSm} value={priority} onChange={(event) => setPriority(event.target.value as InquiryPriority | '')}><option value="">전체 우선순위</option>{INQUIRY_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select>
            <button type="button" className={shared.detailFilterBtn} onClick={() => setShowAdvanced((current) => !current)}>상세 조건 {showAdvanced ? '접기' : '열기'}</button>
            <span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={resetFilters}>필터 초기화</button>
          </div>
          {showAdvanced && <div className={styles.advancedFilters}>
            <label>접수일 시작<input type="date" value={receivedFrom} onChange={(event) => setReceivedFrom(event.target.value)} /></label>
            <label>접수일 종료<input type="date" value={receivedTo} onChange={(event) => setReceivedTo(event.target.value)} /></label>
            <label>답변 기한까지<input type="date" value={dueTo} onChange={(event) => setDueTo(event.target.value)} /></label>
          </div>}
        </div>
      </div>

      {selected.length > 0 && <div className={shared.bulkBar}>
        <span className={shared.bulkLabel}>{selected.length}건 선택</span>
        <button type="button" className={shared.bulkBtn} onClick={() => setDialog({ kind: 'assign', ids: selected })}>담당자 일괄 지정</button>
        <select className={shared.selectXs} defaultValue="" onChange={(event) => {
          const value = event.target.value as InquiryPriority;
          if (!value) return;
          setInquiries((current) => current.map((item) => selected.includes(item.id) ? appendHistory({ ...item, priority: value }, '우선순위 변경', value) : item));
          event.target.value = '';
          setToastBriefly('우선순위를 일괄 변경했습니다.');
        }}><option value="">우선순위 변경</option>{INQUIRY_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select>
        <button type="button" className={shared.bulkBtn} onClick={() => download(inquiries.filter((item) => selected.includes(item.id)))}>선택 다운로드</button>
        <span className={styles.bulkGuard}>답변·완료 처리는 개별 문의에서만 가능합니다.</span>
      </div>}

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}건</span>
          <div className={shared.resultActions}><button type="button" className={shared.downloadBtn} onClick={() => download(filtered)}>목록 다운로드</button><select className={shared.pageSizeSelect}><option>20개씩</option><option>50개씩</option></select></div>
        </div>
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="112px 68px 118px minmax(200px,1.7fr) 126px 150px 100px 138px 84px 100px 76px 68px" minWidth="1470px" selectable allSelected={filtered.length > 0 && filtered.every((item) => selected.includes(item.id))} onToggleAll={() => setSelected(filtered.every((item) => selected.includes(item.id)) ? [] : filtered.map((item) => item.id))} empty={filtered.length === 0} emptyText="조건에 맞는 문의가 없습니다." emptySubtext="빠른 필터나 검색 조건을 변경해 보세요." emptyActionLabel="필터 초기화" emptyActionClick={resetFilters} showPagination pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} />
      </div>

      {currentInquiry && <InquiryDetailDrawer key={currentInquiry.id} inquiry={currentInquiry} onClose={() => setSelectedInquiryId(null)} onAssign={() => setDialog({ kind: 'assign', ids: [currentInquiry.id] })} onStart={() => start(currentInquiry.id)} onHold={() => hold(currentInquiry.id)} onComplete={() => setDialog({ kind: 'complete', ids: [currentInquiry.id] })} onReopen={() => reopen(currentInquiry.id)} onSaveDraft={(body) => patchInquiry(currentInquiry.id, (item) => appendHistory({ ...item, replyDraft: body, draftSavedAt: '2026-08-24 14:00' }, '답변 임시저장'))} onSendReply={(body, channels) => patchInquiry(currentInquiry.id, (item) => appendHistory({ ...item, status: '답변 완료', replyDraft: '', draftSavedAt: null, messages: [...item.messages, { id: nextMessageId(item), role: 'admin', author: item.assignee ?? 'admin01', sentAt: '2026-08-24 14:00', body, notificationResult: `${channels.join(' / ') || '서비스 내'} 발송 완료` }] }, '고객 답변 발송', channels.join(' / ')))} onAddMemo={(body) => patchInquiry(currentInquiry.id, (item) => appendHistory({ ...item, internalMemos: [...item.internalMemos, { id: `MEMO-${Date.now()}`, author: 'admin01', createdAt: '2026-08-24 14:00', body }] }, '내부 메모 등록'))} />}

      {dialog && <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setDialog(null); }}>
        <div className={shared.dialogBox}>
          <h2 className={shared.dialogTitle}>{dialog.kind === 'assign' ? '담당자 지정' : '처리 완료'}</h2>
          <p className={shared.dialogBody}>{dialog.ids.length}건의 문의에 변경 사항을 적용합니다. 모든 변경은 처리 이력에 기록됩니다.</p>
          {dialog.kind === 'assign' ? <>
            <label className={drawer.formLabel}>담당자</label><select className={styles.dialogControl} value={assignManager} onChange={(event) => setAssignManager(event.target.value)}>{INQUIRY_MANAGERS.map((item) => <option key={item} value={item}>{item} · {TEAM_BY_MANAGER[item]}</option>)}</select>
            <label className={drawer.formLabel}>인수인계 메모 (선택)</label><textarea className={styles.dialogTextarea} value={assignMemo} onChange={(event) => setAssignMemo(event.target.value)} placeholder="담당자에게 전달할 내용을 입력하세요." />
          </> : <>
            <label className={drawer.formLabel}>완료 사유</label><select className={styles.dialogControl} value={completeReason} onChange={(event) => setCompleteReason(event.target.value)}><option>안내 완료</option><option>조치 완료</option><option>고객 확인 완료</option><option>중복 문의</option><option>처리 불가</option></select>
            <label className={drawer.formLabel}>완료 메모 (선택)</label><textarea className={styles.dialogTextarea} value={completeMemo} onChange={(event) => setCompleteMemo(event.target.value)} placeholder="완료 판단 근거를 입력하세요." />
          </>}
          <div className={shared.dialogActions}><button type="button" className={styles.dialogCancel} onClick={() => setDialog(null)}>취소</button><button type="button" className={styles.primaryButton} onClick={dialog.kind === 'assign' ? assign : complete}>{dialog.kind === 'assign' ? '지정' : '처리 완료'}</button></div>
        </div>
      </div>}
      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
