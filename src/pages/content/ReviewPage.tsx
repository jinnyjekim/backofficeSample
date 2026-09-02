import { DatePicker } from '../../components/forms/DatePicker';
import { SearchField } from '../../components/SearchField';
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import sh from './contentShared.module.css';
import styles from './ReviewPage.module.css';
import filterStyles from './ContentListPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CHECK_LABELS_BY_BUSINESS, REJECT_REASONS, REVIEW_ITEMS, type ReviewItem, type ReviewItemStatus } from './reviewData';
import { CONTENT_ITEMS } from '../../data/content';
import { ACCENT } from '../../lib/theme';
import { ContentBusinessSwitch } from './ContentBusinessSwitch';
import { CONTENT_BUSINESS_META, CONTENT_BUSINESS_MODES, type ContentBusinessType } from './contentBusiness';
import { CommonButton } from '../../components/common';

const TABS: Array<ReviewItemStatus | '전체'> = ['대기', '검수중', '승인', '반려', '전체'];
const STATUS_PILL: Record<ReviewItemStatus, { bg: string; fg: string }> = {
  대기: { bg: '#fffbeb', fg: '#b45309' },
  검수중: { bg: '#eef2ff', fg: '#4338ca' },
  승인: { bg: '#ecfdf5', fg: '#059669' },
  반려: { bg: '#fef2f2', fg: '#b91c1c' },
  보류: { bg: '#f4f4f5', fg: '#71717a' },
};

interface ModalState {
  kind: 'approve' | 'reject' | 'hold';
  id: string;
  memo: string;
  reason: string;
  detail: string;
  show: boolean;
}

export function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>(REVIEW_ITEMS);
  const [businessMode, setBusinessMode] = useState<ContentBusinessType>('B2C');
  const [tab, setTab] = useState<string>('대기');
  const [q, setQ] = useState('');
  const [field, setField] = useState('전체');
  const [reqTypeF, setReqTypeF] = useState('전체');
  const [catF, setCatF] = useState('전체');
  const [assigneeF, setAssigneeF] = useState('전체');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [adv, setAdv] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState('');

  function fireToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }

  const byId = (id: string) => items.find((x) => x.id === id);
  function setItem(id: string, patch: Partial<ReviewItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  const modeItems = useMemo(() => items.filter((item) => item.businessType === businessMode), [businessMode, items]);
  const categories = useMemo(() => Array.from(new Set(modeItems.map((it) => it.cat))), [modeItems]);
  const assignees = ['전체', '미지정', 'admin01', 'admin02'];

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = modeItems.filter((it) => {
      if (tab !== '전체' && it.status !== tab) return false;
      if (query) {
        const hay = field === '콘텐츠 ID' ? it.ctid : field === '제목' ? it.title : field === '요청자' ? it.requester : it.ctid + it.title + it.requester;
        if (!hay.toLowerCase().includes(query)) return false;
      }
      if (reqTypeF !== '전체' && it.reqType !== reqTypeF) return false;
      if (catF !== '전체' && it.cat !== catF) return false;
      if (assigneeF !== '전체' && it.assignee !== assigneeF) return false;
      const d = it.reqAt.slice(0, 10).replace(/\./g, '-');
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    out = out.slice().sort((a, b) => (a.reqAt < b.reqAt ? 1 : -1));
    return out;
  }, [modeItems, tab, q, field, reqTypeF, catF, assigneeF, from, to]);

  const sel_ = sel.filter((id) => list.some((it) => it.id === id));

  const chips = [] as { key: string; label: string; clear: () => void }[];
  if (tab !== '전체') chips.push({ key: 'status', label: `상태: ${tab}`, clear: () => setTab('전체') });
  if (q.trim()) chips.push({ key: 'q', label: `검색: ${field} “${q.trim()}”`, clear: () => setQ('') });
  if (reqTypeF !== '전체') chips.push({ key: 'request', label: `요청 유형: ${reqTypeF}`, clear: () => setReqTypeF('전체') });
  if (assigneeF !== '전체') chips.push({ key: 'assignee', label: `담당자: ${assigneeF}`, clear: () => setAssigneeF('전체') });
  if (catF !== '전체') chips.push({ key: 'category', label: `카테고리: ${catF}`, clear: () => setCatF('전체') });
  if (from || to) chips.push({
    key: 'date',
    label: `요청일: ${from ? from.replace(/-/g, '.') : '시작일'} ~ ${to ? to.replace(/-/g, '.') : '종료일'}`,
    clear: () => { setFrom(''); setTo(''); },
  });

  const detailFilterCount = [catF !== '전체', Boolean(from || to)].filter(Boolean).length;

  function resetAll() {
    setTab('전체'); setQ(''); setField('전체'); setReqTypeF('전체'); setCatF('전체'); setAssigneeF('전체');
    setFrom(''); setTo(''); setAdv(false); setSel([]);
  }

  function switchBusiness(next: ContentBusinessType) {
    if (next === businessMode) return;
    setBusinessMode(next);
    resetAll();
    setTab('대기');
    setDetailId(null);
    setModal(null);
  }

  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (event.key === '/' && !isEditing) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  function openDetail(id: string) {
    setDetailId(id); setSel([]);
  }

  function startReview(it: ReviewItem) {
    setItem(it.id, { assignee: 'admin01', status: '검수중', history: it.history.concat([{ at: '2026.08.13 15:00', act: '검수 시작', by: 'admin01' }]) });
  }

  function doApprove(it: ReviewItem, memo: string) {
    setItem(it.id, { status: '승인', doneAt: '2026.08.13 15:10', memo, history: it.history.concat([{ at: '2026.08.13 15:10', act: '승인', by: 'admin01' }]) });
    setModal(null);
    fireToast('검수가 승인 처리되었습니다.');
  }
  function doReject(it: ReviewItem, reason: string, detail: string) {
    setItem(it.id, { status: '반려', doneAt: '2026.08.13 15:10', rejectReason: reason + (detail ? ` — ${detail}` : ''), history: it.history.concat([{ at: '2026.08.13 15:10', act: '반려', by: 'admin01', note: reason }]) });
    setModal(null);
    fireToast('검수가 반려 처리되었습니다.');
  }
  function doHold(it: ReviewItem, reason: string) {
    setItem(it.id, { status: '보류', history: it.history.concat([{ at: '2026.08.13 15:10', act: '보류', by: 'admin01', note: reason }]) });
    setModal(null);
    fireToast('검수가 보류 처리되었습니다.');
  }

  function nextPending(curId: string) {
    const pool = list.filter((it) => it.id !== curId && (it.status === '대기' || it.status === '검수중'));
    return pool[0] ?? null;
  }

  function assignSelected() {
    setItems((prev) => prev.map((it) => (sel_.indexOf(it.id) >= 0 && it.assignee === '미지정' ? { ...it, assignee: 'admin01', status: it.status === '대기' ? '검수중' : it.status } : it)));
    setSel([]);
    fireToast('담당자가 지정되었습니다.');
  }
  function approveSelected() {
    setItems((prev) => prev.map((it) => (sel_.indexOf(it.id) >= 0 && it.status !== '승인' && it.status !== '반려' ? { ...it, status: '승인', doneAt: '2026.08.13 15:10', history: it.history.concat([{ at: '2026.08.13 15:10', act: '승인', by: 'admin01' }]) } : it)));
    setSel([]);
    fireToast('선택한 건이 일괄 승인되었습니다.');
  }

  const modeColumnLabels = {
    B2C: ['쇼핑 콘텐츠', '게시 요청', '요청 관리자'],
    C2C: ['회원 콘텐츠', '검수 요청', '작성 회원'],
    B2B: ['문서 / 공지', '승인 요청', '요청 관리자'],
  }[businessMode];

  const columns: GridColumn[] = [
    { label: modeColumnLabels[0] },
    { label: modeColumnLabels[1] },
    { label: modeColumnLabels[2] },
    { label: '요청일' },
    { label: '담당자' },
    { label: '상태' },
    { label: '처리일' },
    { label: '관리', align: 'right' },
  ];

  const rows: GridRow[] = list.map((it) => {
    const st = STATUS_PILL[it.status];
    const isSel = sel_.indexOf(it.id) >= 0;
    const cells: Cell[] = [
      { kind: 'stack', title: it.title, subtitle: it.ctid },
      { kind: 'text', text: it.reqType, color: '#3f3f46', size: '12px' },
      { kind: 'text', text: it.requester, color: '#3f3f46', size: '12px' },
      { kind: 'text', text: it.reqAt.slice(2), color: '#71717a', size: '11.5px', numeric: true },
      { kind: 'text', text: it.assignee, color: '#71717a', size: '12px' },
      { kind: 'badge', text: it.status, bg: st.bg, fg: st.fg },
      { kind: 'text', text: it.doneAt ? it.doneAt.slice(2) : '—', color: '#a1a1aa', size: '11.5px', numeric: true },
      { kind: 'rowMenu', detailLabel: '검수', onDetail: () => openDetail(it.id), open: false, items: [], onToggle: () => {} },
    ];
    return { id: it.id, cells, selected: isSel, onToggleSelect: () => setSel((prev) => (isSel ? prev.filter((x) => x !== it.id) : prev.concat([it.id]))), bg: isSel ? '#f7f8ff' : 'transparent' };
  });

  const emptySearch = list.length === 0 && chips.length > 0;
  const emptyAll = modeItems.length === 0;

  const det = detailId ? byId(detailId) : null;
  const detCd = det ? CONTENT_ITEMS.find((c) => c.id === det.ctid) : null;
  const decided = det ? det.status === '승인' || det.status === '반려' || det.status === '보류' : false;

  if (det) {
    const isModify = det.reqType === '수정' && det.diff;
    const diffEntries = det.diff ? Object.entries(det.diff) : [];
    const stp = STATUS_PILL[det.status];
    return (
      <div className={sh.page}>
        {toast && <div className={sh.toast}>{toast}</div>}
        {modal && (
          <div className={sh.modalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className={sh.modalBox}>
              <div className={sh.modalTitle}>{modal.kind === 'approve' ? '콘텐츠를 승인하시겠습니까?' : modal.kind === 'reject' ? '반려 처리' : '보류 처리'}</div>

              {modal.kind === 'approve' && (
                <>
                  <div style={{ fontSize: 12.5, color: '#52525b', lineHeight: 1.6, marginTop: 9 }}>승인 후 설정된 정책에 따라 콘텐츠가 공개 가능 상태로 변경됩니다.</div>
                  <div style={{ marginTop: 14 }}>
                    <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>관리자 메모</div>
                    <textarea className={sh.formTextarea} value={modal.memo} onChange={(e) => setModal({ ...modal, memo: e.target.value })} placeholder="내부 기록용 메모입니다." />
                  </div>
                  <div className={sh.dialogActions}>
                    <button type="button" className={sh.ghostBtn} onClick={() => setModal(null)}>취소</button>
                    <button type="button" className={sh.solidBtn} onClick={() => doApprove(det, modal.memo)}>승인</button>
                  </div>
                </>
              )}

              {modal.kind === 'reject' && (
                <>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className={sh.formField}>
                      <span className={sh.formFieldLabel}>반려 사유 <span className={sh.required}>*</span></span>
                      <select className={sh.formSelect} value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })}>
                        <option value="">사유 선택</option>
                        {REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className={sh.formField}>
                      <span className={sh.formFieldLabel}>상세 사유 <span className={sh.required}>*</span></span>
                      <textarea className={sh.formTextarea} style={{ height: 70 }} value={modal.detail} onChange={(e) => setModal({ ...modal, detail: e.target.value })} placeholder="요청자에게 안내할 상세 사유를 입력하세요" />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#52525b', cursor: 'pointer' }}>
                      <input type="checkbox" checked={modal.show} onChange={() => setModal({ ...modal, show: !modal.show })} />요청자에게 사유 표시
                    </label>
                  </div>
                  <div className={sh.dialogActions}>
                    <button type="button" className={sh.ghostBtn} onClick={() => setModal(null)}>취소</button>
                    <button type="button" className={sh.dialogBtn} disabled={!modal.reason || !modal.detail.trim()} style={{ border: 0, background: modal.reason && modal.detail.trim() ? 'oklch(0.58 0.19 25)' : '#e4e4e7', color: modal.reason && modal.detail.trim() ? '#fff' : '#a1a1aa' }} onClick={() => doReject(det, modal.reason, modal.detail)}>반려</button>
                  </div>
                </>
              )}

              {modal.kind === 'hold' && (
                <>
                  <div style={{ marginTop: 14 }}>
                    <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>보류 사유 <span className={sh.required}>*</span></div>
                    <textarea className={sh.formTextarea} style={{ height: 70 }} value={modal.detail} onChange={(e) => setModal({ ...modal, detail: e.target.value })} placeholder="추가 확인이 필요한 사유를 입력하세요" />
                  </div>
                  <div className={sh.dialogActions}>
                    <button type="button" className={sh.ghostBtn} onClick={() => setModal(null)}>취소</button>
                    <button type="button" className={sh.dialogBtn} disabled={!modal.detail.trim()} style={{ border: 0, background: '#18181b', color: '#fff' }} onClick={() => doHold(det, modal.detail)}>보류</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className={styles.detailHeader}>
          <button type="button" className={styles.backBtn} onClick={() => setDetailId(null)}>← 목록으로</button>
          <div className={styles.detailTitle}>{`검수 상세 · ${det.ctid}`}</div>
          <span className={styles.statusPill} style={{ background: '#eef2ff', color: '#4338ca' }}>{det.businessType}</span>
          <div className={sh.headerSpacer} />
          <span className={styles.assigneeLabel}>{`담당자 ${det.assignee}`}</span>
          <span className={styles.statusPill} style={{ background: stp.bg, color: stp.fg }}>{det.status}</span>
        </div>

        <div className={styles.detailBody}>
          <div className={styles.mainPane}>
            <div className={styles.contentMeta}>{`${det.reqType} · ${det.cat}`}</div>
            <div className={styles.contentTitle}>{det.title}</div>
            <div className={styles.contentSub}>{`요청자 ${det.requester} (${det.reqUtype}) · ${det.reqAt}`}</div>

            {isModify ? (
              <>
                <div className={styles.diffBanner}>{`변경 항목 ${diffEntries.length}개`}</div>
                <div className={styles.diffList}>
                  {diffEntries.map(([label, d]) => (
                    <div key={label} className={styles.diffCard}>
                      <div className={styles.diffCardLabel}>{label}</div>
                      <div className={styles.diffBefore}>{d.before}</div>
                      <div className={styles.diffAfter}>{d.after}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.descBox}>{detCd ? detCd.desc : '콘텐츠 본문 정보를 찾을 수 없습니다.'}</div>
            )}
          </div>

          <div className={styles.sidePane}>
            <div className={styles.sideBody}>
              <div className={styles.sideTitle}>검수 처리</div>

              {det.assignee === '미지정' && <button type="button" className={styles.startBtn} onClick={() => startReview(det)}>검수 시작</button>}

              <div>
                <div className={sh.formFieldLabel} style={{ marginBottom: 8 }}>검수 항목</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {det.checklist.map((checked, i) => (
                    <label key={i} className={styles.checklistRow}>
                      <input type="checkbox" checked={checked} onChange={() => setItem(det.id, { checklist: det.checklist.map((c, ci) => (ci === i ? !c : c)) })} style={{ marginTop: 2 }} />
                      <span className={styles.checklistLabel}>{CHECK_LABELS_BY_BUSINESS[det.businessType][i]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>관리자 메모</div>
                <textarea className={sh.formTextarea} value={det.memo} onChange={(e) => setItem(det.id, { memo: e.target.value })} placeholder="내부 기록용 메모입니다." />
              </div>

              {det.rejectReason && <div className={styles.rejectNote}>{`반려 사유: ${det.rejectReason}`}</div>}

              {!decided ? (
                <div className={styles.decisionRow}>
                  <button type="button" className={styles.decisionBtn} style={{ border: '1px solid rgba(185,28,28,.2)', background: '#fef2f2', color: '#b91c1c' }} onClick={() => setModal({ kind: 'reject', id: det.id, memo: '', reason: '', detail: '', show: true })}>반려</button>
                  <button type="button" className={styles.decisionBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#3f3f46' }} onClick={() => setModal({ kind: 'hold', id: det.id, memo: '', reason: '', detail: '', show: true })}>보류</button>
                  <button type="button" className={styles.decisionBtn} style={{ border: 0, background: ACCENT, color: '#fff' }} onClick={() => setModal({ kind: 'approve', id: det.id, memo: det.memo, reason: '', detail: '', show: true })}>승인</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className={styles.doneNote}>검수가 완료되었습니다.</div>
                  <div className={styles.doneRow}>
                    <button type="button" className={styles.doneBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#3f3f46' }} onClick={() => setDetailId(null)}>목록으로</button>
                    {nextPending(det.id) && <button type="button" className={styles.doneBtn} style={{ border: 0, background: '#18181b', color: '#fff' }} onClick={() => { const n = nextPending(det.id); setDetailId(n ? n.id : null); }}>다음 검수 건</button>}
                  </div>
                </div>
              )}

              <div>
                <div className={sh.formFieldLabel} style={{ marginBottom: 8 }}>검수 이력</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {det.history.slice().reverse().map((h, i) => (
                    <div key={i} className={styles.historyCard}>
                      <div className={styles.historyTop}><span>{h.at}</span><span>{h.by}</span></div>
                      <div className={styles.historyAct}>{h.act}</div>
                      {h.note && <div className={styles.historyNote}>{h.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={sh.page}>
      {toast && <div className={sh.toast}>{toast}</div>}
      <header className={sh.header}>
        <div>
          <div className={sh.headerTitle}>검수 관리</div>
          <div className={sh.headerSub}>{CONTENT_BUSINESS_META[businessMode].reviewNote} 요청과 승인 상태를 관리합니다.</div>
        </div>
        <ContentBusinessSwitch
          value={businessMode}
          options={CONTENT_BUSINESS_MODES}
          onChange={switchBusiness}
          note={CONTENT_BUSINESS_META[businessMode].reviewNote}
        />
      </header>

      <div className={sh.body}>
        <div className={sh.topPad}>
          <div className={sh.quickFilters}>
            {TABS.map((k) => {
              const count = k === '전체' ? modeItems.length : modeItems.filter((it) => it.status === k).length;
              const on = tab === k;
              return (
                <CommonButton
                  key={k}
                  variant={on ? 'primary-light' : 'secondary'}
                  size="md"
                  className={`${sh.qfBtn} ${on ? sh.active : ''}`}
                  onClick={() => { setTab(k); setSel([]); }}
                >
                  <span className={sh.qfLabel}>{k}</span>
                  <span className={sh.qfCount}>{count.toLocaleString('ko-KR')}</span>
                </CommonButton>
              );
            })}
          </div>

          <div className={filterStyles.stepLabel}>
            <span className={filterStyles.stepNum}>1</span>
            <span className={filterStyles.stepTitle}>조건 설정</span>
            <span className={filterStyles.stepHint}>요청 유형과 담당자를 기준으로 검수 건을 찾아보세요.</span>
            {chips.length > 0 && <span className={filterStyles.appliedCount}>{chips.length}개 조건 적용</span>}
          </div>

          <div className={filterStyles.filterPanel}>
            <div className={filterStyles.searchLine}>
              <label className="globalFilterField"><span>검색 범위</span><select className={filterStyles.searchScope} aria-label="검색 범위" value={field} onChange={(e) => setField(e.target.value)}>
                {['전체', '콘텐츠 ID', '제목', '요청자'].map((f) => <option key={f} value={f}>{f}</option>)}
              </select></label>
              <SearchField
                ref={searchInputRef}
                className={filterStyles.searchField}
                value={q}
                onValueChange={(value) => { setQ(value); setSel([]); }}
                placeholder="콘텐츠 ID, 제목 또는 요청자를 검색하세요"
                shortcutHint="/"
                aria-label="검수 요청 검색"
              />
              <div className={filterStyles.searchActions}>
                <button type="button" className={`${filterStyles.detailButton} ${detailFilterCount > 0 ? filterStyles.hasFilter : ''}`} onClick={() => setAdv((value) => !value)} aria-expanded={adv}>
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  상세 필터
                  {detailFilterCount > 0 && <span className={filterStyles.detailCount}>{detailFilterCount}</span>}
                  {adv ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                </button>
                <button type="button" className={filterStyles.resetButton} onClick={resetAll} disabled={chips.length === 0}>
                  <RotateCcw size={13} aria-hidden="true" />
                  초기화
                </button>
              </div>
            </div>

            <div className={filterStyles.primaryFilters}>
              <label className={filterStyles.filterControl}>
                <span>요청 유형</span>
                <select value={reqTypeF} onChange={(e) => { setReqTypeF(e.target.value); setSel([]); }}>
                  {['전체', '신규 등록', '수정', '재검수'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className={filterStyles.filterControl}>
                <span>담당자</span>
                <select value={assigneeF} onChange={(e) => { setAssigneeF(e.target.value); setSel([]); }}>
                  {assignees.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            </div>

            {adv && (
              <div className={filterStyles.advancedPanel}>
                <div className={filterStyles.advancedHead}>
                  <strong>상세 조건</strong>
                  <span>카테고리 또는 요청 기간으로 범위를 좁힐 수 있습니다.</span>
                </div>
                <div className={filterStyles.advancedGrid}>
                  <label className={filterStyles.filterControl}>
                    <span>카테고리</span>
                    <select value={catF} onChange={(e) => { setCatF(e.target.value); setSel([]); }}>
                      {['전체', ...categories].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label className={`${filterStyles.filterControl} ${filterStyles.dateControl} ${filterStyles.wideDateControl}`}>
                    <span>요청일</span>
                    <div className={filterStyles.dateRange}>
                      <DatePicker controlSize="sm" value={from} onChange={(e) => {
                        const value = e.target.value;
                        setFrom(value);
                        if (value && to && value > to) setTo(value);
                        setSel([]);
                      }} />
                      <span>~</span>
                      <DatePicker controlSize="sm" value={to} onChange={(e) => {
                        const value = e.target.value;
                        setTo(value);
                        if (value && from && value < from) setFrom(value);
                        setSel([]);
                      }} />
                    </div>
                  </label>
                </div>
              </div>
            )}

            {chips.length > 0 && (
              <div className={filterStyles.appliedFilters}>
                <span className={filterStyles.appliedLabel}>적용된 조건</span>
                <div className={filterStyles.chipList}>
                  {chips.map((chip) => (
                    <button key={chip.key} type="button" className={filterStyles.filterChip} onClick={chip.clear} title={`${chip.label} 조건 해제`}>
                      {chip.label}<span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
                <button type="button" className={filterStyles.clearAllButton} onClick={resetAll}>전체 해제</button>
              </div>
            )}
          </div>

          <div className={`${filterStyles.stepLabel} ${filterStyles.resultStep}`}>
            <span className={filterStyles.stepNum}>2</span>
            <span className={filterStyles.stepTitle}>조회 결과</span>
            <span className={filterStyles.stepHint}>검수 버튼을 선택하면 요청 내용과 변경 사항을 확인할 수 있습니다.</span>
          </div>
        </div>

        <div className={`${sh.listArea} ${filterStyles.listArea}`}>
          <div className={sh.toolbarRow}>
            {sel_.length > 0 ? (
              <div className={sh.selBar}>
                <span className={sh.selCount}>✓ {sel_.length}건 선택됨</span>
                <button type="button" className={sh.selBtn} onClick={assignSelected}>담당자 지정</button>
                <button type="button" className={sh.selBtnGreen} onClick={approveSelected}>일괄 승인</button>
                <div className={sh.rowSpacer} />
                <button type="button" className={sh.clearSelBtn} onClick={() => setSel([])}>선택 해제</button>
              </div>
            ) : (
              <div className={sh.noSelBar}>
                <span className={sh.totalLabel}>{`총 ${list.length.toLocaleString('ko-KR')}건`}</span>
                <div className={sh.rowSpacer} />
                <select className={sh.pageSizeSelect} defaultValue="20개씩 보기">
                  <option>20개씩 보기</option>
                  <option>50개씩 보기</option>
                </select>
              </div>
            )}
          </div>

          <div className={sh.gridArea}>
            <DataGrid
              columns={columns}
              rows={rows}
              gridTemplate="minmax(220px,2fr) 67px 90px 100px 49px 56px 49px 76px"
              minWidth="850px"
              selectable
              allSelected={list.length > 0 && sel_.length === list.length}
              onToggleAll={() => setSel(sel_.length === list.length ? [] : list.map((it) => it.id))}
              empty={list.length === 0}
              emptyText={emptyAll ? '검수 요청이 없습니다.' : '검수 대기 중인 콘텐츠가 없습니다.'}
              emptySubtext={emptyAll ? undefined : '다른 검색어나 필터 조건을 사용해 주세요.'}
              emptyActionLabel={emptySearch ? '필터 초기화' : undefined}
              emptyActionClick={resetAll}
              fillHeight
              stickyHeader
            />
          </div>
        </div>
      </div>
    </div>
  );
}
