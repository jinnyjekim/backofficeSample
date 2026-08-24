import { useMemo, useState } from 'react';
import styles from './opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { fmtNow, todayIso } from './noticesData';
import { FaqDetailDrawer } from './FaqDetailDrawer';
import { FaqEditorDrawer, type FaqFormData } from './FaqEditorDrawer';
import {
  DEFAULT_FAQ_CATEGORIES,
  FAQS,
  FAQ_STATUS_META,
  QUICK_FILTER_LABELS,
  computeStatus,
  matchesQuickFilter,
  needsReview,
  type Faq,
  type FaqCategory,
  type FaqQuickFilter,
} from './faqData';

const GRID_TEMPLATE = '52px 100px 1.8fr 68px 84px 100px 76px 88px 84px 56px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '순서', align: 'right' },
  { label: '카테고리' },
  { label: '질문' },
  { label: '중요' },
  { label: '상태' },
  { label: '노출대상' },
  { label: '조회수', align: 'right' },
  { label: '수정일' },
  { label: '수정자' },
  { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

type ConfirmState =
  | { kind: 'delete'; id: string }
  | { kind: 'repost'; id: string }
  | { kind: 'bulkCategory' }
  | { kind: 'bulkStatus' }
  | { kind: 'bulkImportant' }
  | { kind: 'categoryManage' }
  | { kind: 'orderManage' }
  | null;

function nextId(list: Faq[]): string {
  const max = list.reduce((m, f) => {
    const n = parseInt(f.id.replace('FAQ-', ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `FAQ-${String(max + 1).padStart(3, '0')}`;
}

export function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>(FAQS);
  const [categories, setCategories] = useState<FaqCategory[]>(DEFAULT_FAQ_CATEGORIES);
  const [filter, setFilter] = useState<FaqQuickFilter>('전체');
  const [categoryFilter, setCategoryFilter] = useState<'전체' | FaqCategory>('전체');
  const [importantFilter, setImportantFilter] = useState<'전체' | '중요만'>('전체');
  const [q, setQ] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<'new' | Faq | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [bulkCategory, setBulkCategory] = useState<FaqCategory>(categories[0]);
  const [bulkStatus, setBulkStatus] = useState<'공개' | '비공개'>('공개');
  const [bulkImportant, setBulkImportant] = useState<'지정' | '해제'>('지정');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [orderCategory, setOrderCategory] = useState<FaqCategory>(categories[0]);
  const [orderDraft, setOrderDraft] = useState<string[]>([]);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTER_LABELS.forEach((k) => { c[k] = faqs.filter((f) => matchesQuickFilter(f, k)).length; });
    return c;
  }, [faqs]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    categories.forEach((cat) => { c[cat] = faqs.filter((f) => f.category === cat).length; });
    return c;
  }, [faqs, categories]);

  const filtered = useMemo(
    () =>
      faqs
        .filter((f) => {
          if (!matchesQuickFilter(f, filter)) return false;
          if (categoryFilter !== '전체' && f.category !== categoryFilter) return false;
          if (importantFilter === '중요만' && !f.important) return false;
          if (q && !(f.question.includes(q) || f.answer.includes(q) || f.id.includes(q) || f.keywords.some((k) => k.includes(q)))) return false;
          return true;
        })
        .sort((a, b) => (a.category === b.category ? a.order - b.order : a.category.localeCompare(b.category))),
    [faqs, filter, categoryFilter, importantFilter, q],
  );

  const selected = openId ? faqs.find((f) => f.id === openId) ?? null : null;

  function updateFaq(id: string, updater: (f: Faq) => Faq) {
    setFaqs((prev) => prev.map((f) => (f.id === id ? updater(f) : f)));
  }

  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((f) => f.id)));
  }

  function openDetail(id: string) {
    setOpenId(id);
    setEditorTarget(null);
    setMenuId(null);
  }
  function openEditor(target: 'new' | Faq) {
    setEditorTarget(target);
    setOpenId(null);
    setMenuId(null);
  }
  function closePanels() {
    setOpenId(null);
    setEditorTarget(null);
  }

  function publishNow(id: string) {
    updateFaq(id, (f) => ({
      ...f,
      manualHidden: false,
      startAt: f.startAt ?? fmtNow(),
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...f.history, { when: '방금', title: '공개 전환', by: '관리자' }],
    }));
  }
  function cancelSchedule(id: string) {
    updateFaq(id, (f) => ({
      ...f,
      manualHidden: true,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...f.history, { when: '방금', title: '예약 취소', detail: '비공개로 전환', by: '관리자' }],
    }));
  }
  function hideNow(id: string) {
    updateFaq(id, (f) => ({
      ...f,
      manualHidden: true,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...f.history, { when: '방금', title: '비공개 전환', by: '관리자' }],
    }));
  }

  function duplicate(id: string) {
    const src = faqs.find((f) => f.id === id);
    if (!src) return;
    const id2 = nextId(faqs);
    const copy: Faq = {
      ...src,
      id: id2,
      question: `[복사본] ${src.question}`,
      startAt: null,
      endAt: null,
      manualHidden: false,
      views: 0,
      helpful: 0,
      unhelpful: 0,
      createdAt: '방금',
      updatedAt: '방금',
      updatedBy: '관리자',
      history: [{ when: '방금', title: 'FAQ 복제', detail: `원본 ${src.id}`, by: '관리자' }],
      memos: [],
    };
    setFaqs((prev) => [copy, ...prev]);
    openDetail(id2);
  }

  function addMemo(id: string, text: string) {
    updateFaq(id, (f) => ({ ...f, memos: [...f.memos, { when: '방금', by: '관리자', text }] }));
  }

  function confirmRepost(id: string) {
    updateFaq(id, (f) => ({
      ...f,
      startAt: fmtNow(),
      endAt: null,
      manualHidden: false,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...f.history, { when: '방금', title: '재게시', by: '관리자' }],
    }));
    setConfirm(null);
  }

  function confirmDelete(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    if (openId === id) setOpenId(null);
    setConfirm(null);
  }

  function confirmBulkCategory() {
    selectedIds.forEach((id) => updateFaq(id, (f) => ({ ...f, category: bulkCategory })));
    setSelectedIds([]);
    setConfirm(null);
  }
  function confirmBulkStatus() {
    selectedIds.forEach((id) =>
      updateFaq(id, (f) =>
        bulkStatus === '공개'
          ? { ...f, manualHidden: false, startAt: f.startAt ?? fmtNow() }
          : { ...f, manualHidden: true },
      ),
    );
    setSelectedIds([]);
    setConfirm(null);
  }
  function confirmBulkImportant() {
    selectedIds.forEach((id) => updateFaq(id, (f) => ({ ...f, important: bulkImportant === '지정' })));
    setSelectedIds([]);
    setConfirm(null);
  }

  function addCategory() {
    const v = newCategoryInput.trim();
    if (!v || categories.includes(v)) return;
    setCategories((prev) => [...prev, v]);
    setNewCategoryInput('');
  }
  function removeCategory(cat: FaqCategory) {
    if ((categoryCounts[cat] ?? 0) > 0) return;
    setCategories((prev) => prev.filter((c) => c !== cat));
  }

  function openOrderManage() {
    const cat = orderCategory || categories[0];
    setOrderCategory(cat);
    setOrderDraft(faqs.filter((f) => f.category === cat).sort((a, b) => a.order - b.order).map((f) => f.id));
    setConfirm({ kind: 'orderManage' });
  }
  function changeOrderCategory(cat: FaqCategory) {
    setOrderCategory(cat);
    setOrderDraft(faqs.filter((f) => f.category === cat).sort((a, b) => a.order - b.order).map((f) => f.id));
  }
  function moveOrder(idx: number, dir: -1 | 1) {
    setOrderDraft((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function saveOrder() {
    orderDraft.forEach((id, i) => updateFaq(id, (f) => ({ ...f, order: i + 1 })));
    setConfirm(null);
  }

  function submitEditor(form: FaqFormData) {
    const existing = editorTarget !== 'new' ? editorTarget : null;
    let startAt: string | null;
    let manualHidden = false;
    if (form.publishMode === '즉시') {
      startAt = fmtNow();
    } else if (form.publishMode === '예약') {
      startAt = `${form.startDate} ${form.startTime}`;
    } else {
      manualHidden = true;
      startAt = existing?.startAt ?? null;
    }
    const endAt = form.endMode === '없음' ? null : `${form.endDate} ${form.endTime}`;

    if (existing) {
      updateFaq(existing.id, (f) => ({
        ...f,
        category: form.category,
        question: form.question,
        answer: form.answer,
        keywords: form.keywords,
        important: form.important,
        order: form.order,
        target: form.target,
        startAt,
        endAt,
        manualHidden,
        relatedFaqIds: form.relatedFaqIds,
        relatedLinks: form.relatedLinks,
        updatedBy: '관리자',
        updatedAt: '방금',
        history: [...f.history, { when: '방금', title: 'FAQ 수정', by: '관리자' }],
        memos: form.memo ? [...f.memos, { when: '방금', by: '관리자', text: form.memo }] : f.memos,
      }));
      openDetail(existing.id);
    } else {
      const id = nextId(faqs);
      const created: Faq = {
        id,
        category: form.category,
        question: form.question,
        answer: form.answer,
        keywords: form.keywords,
        important: form.important,
        order: form.order,
        target: form.target,
        startAt,
        endAt,
        manualHidden,
        relatedFaqIds: form.relatedFaqIds,
        relatedLinks: form.relatedLinks,
        views: 0,
        helpful: 0,
        unhelpful: 0,
        author: '관리자',
        updatedBy: '관리자',
        createdAt: '방금',
        updatedAt: '방금',
        history: [{ when: '방금', title: 'FAQ 등록', by: '관리자' }],
        memos: form.memo ? [{ when: '방금', by: '관리자', text: form.memo }] : [],
      };
      setFaqs((prev) => [created, ...prev]);
      openDetail(id);
    }
  }

  function rowMenuItems(f: Faq, status: ReturnType<typeof computeStatus>) {
    const canDelete = status === '비공개' && !f.startAt && f.views === 0;
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(f.id) },
    ];
    if (status !== '게시종료') items.push({ label: '수정', click: () => openEditor(f) });
    items.push({ sep: true });
    if (status === '비공개') items.push({ label: '공개', click: () => publishNow(f.id) });
    if (status === '공개예정') items.push({ label: '예약 취소', click: () => cancelSchedule(f.id) });
    if (status === '공개중') items.push({ label: '비공개', click: () => hideNow(f.id) });
    if (status === '게시종료') items.push({ label: '재게시', click: () => setConfirm({ kind: 'repost', id: f.id }) });
    items.push({ label: '복제', click: () => duplicate(f.id) });
    if (canDelete) items.push({ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', id: f.id }) });
    return items.map((it) => (it.click ? { ...it, click: () => { it.click!(); setMenuId(null); } } : it));
  }

  const rows: GridRow[] = filtered.map((f) => {
    const status = computeStatus(f);
    const sm = FAQ_STATUS_META[status];
    const review = needsReview(f);
    const cells: Cell[] = [
      { kind: 'text', text: String(f.order), color: '#71717a', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: f.category, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'noWarn', no: `${f.important ? '⭐ ' : ''}${f.question}`, hasIssue: review.flag, issueTitle: review.reasons.join(' · ') },
      { kind: 'text', text: f.important ? '중요' : '-', color: f.important ? '#dc2626' : '#a1a1aa', size: '11.5px', weight: 600 },
      { kind: 'badge', text: status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: f.target === '전체 사용자' ? '전체' : '특정그룹', color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'text', text: f.views.toLocaleString('ko-KR'), color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: f.updatedAt, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: f.updatedBy, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'rowMenu', detailLabel: '상세', onDetail: () => openDetail(f.id), open: menuId === f.id, onToggle: () => setMenuId(menuId === f.id ? null : f.id), items: rowMenuItems(f, status) },
    ];
    return {
      id: f.id,
      cells,
      onClick: () => openDetail(f.id),
      selected: selectedIds.includes(f.id),
      onToggleSelect: () => toggleSel(f.id),
    };
  });

  const confirmFaq = confirm && 'id' in confirm ? faqs.find((f) => f.id === confirm.id) ?? null : null;

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>FAQ</div>
            <div className={styles.subtitle}>사용자가 자주 묻는 질문과 답변을 카테고리·검색 키워드·노출 순서로 관리합니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'categoryManage' })}>카테고리 관리</button>
            <button type="button" className={styles.bulkBtn} onClick={openOrderManage}>순서 관리</button>
            <button type="button" className={styles.createBtn} onClick={() => openEditor('new')}>＋ FAQ 등록</button>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTER_LABELS.map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                className={styles.qfBtn}
                style={{ borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: active ? 'var(--accent)' : '#fff' }}
                onClick={() => setFilter(k)}
              >
                <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{k}</span>
                <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[k] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <select className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>질문</option>
              <option>답변</option>
              <option>검색 키워드</option>
            </select>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="질문, 답변 또는 키워드" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <select className={styles.selectXs} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="전체">카테고리 전체</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className={styles.selectXs} value={importantFilter} onChange={(e) => setImportantFilter(e.target.value as '전체' | '중요만')}>
              <option value="전체">중요 FAQ 전체</option>
              <option value="중요만">중요 FAQ만</option>
            </select>
            <button type="button" className={styles.detailFilterBtn}>상세 필터 ＋</button>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setCategoryFilter('전체'); setImportantFilter('전체'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{selectedIds.length}건 선택됨</span>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkCategory' })}>카테고리 변경</button>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkStatus' })}>공개 설정</button>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkImportant' })}>중요 FAQ 설정</button>
          <button type="button" className={styles.bulkBtn}>다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1180px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="등록된 FAQ가 없습니다."
        />
      </div>

      {selected && (
        <FaqDetailDrawer
          faq={selected}
          allFaqs={faqs}
          onClose={() => setOpenId(null)}
          onEdit={() => openEditor(selected)}
          onPublishNow={() => publishNow(selected.id)}
          onCancelSchedule={() => cancelSchedule(selected.id)}
          onHideNow={() => hideNow(selected.id)}
          onRequestRepost={() => setConfirm({ kind: 'repost', id: selected.id })}
          onDuplicate={() => duplicate(selected.id)}
          onRequestDelete={() => setConfirm({ kind: 'delete', id: selected.id })}
          onAddMemo={(text) => addMemo(selected.id, text)}
        />
      )}

      {editorTarget && (
        <FaqEditorDrawer
          faq={editorTarget === 'new' ? null : editorTarget}
          allFaqs={faqs}
          categories={categories}
          todayIso={todayIso()}
          onCancel={closePanels}
          onSubmit={submitEditor}
        />
      )}

      {confirm?.kind === 'repost' && confirmFaq && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>다시 게시하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirmFaq.question}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>새 공개 시작</span><span>즉시</span></div>
              <div className={styles.dialogSummaryRow}><span>새 공개 종료</span><span>종료일 없음</span></div>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={() => confirmRepost(confirmFaq.id)}>재게시</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && confirmFaq && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>FAQ를 삭제하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirmFaq.question}'이(가) 삭제됩니다. 공개 이력이 없는 FAQ만 삭제할 수 있습니다.`}</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => confirmDelete(confirmFaq.id)}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkCategory' && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 카테고리 변경</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 16 }} value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmBulkCategory}>변경</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkStatus' && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 공개 설정</div>
            <div className={styles.dialogBody} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><input type="radio" checked={bulkStatus === '공개'} onChange={() => setBulkStatus('공개')} />공개</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><input type="radio" checked={bulkStatus === '비공개'} onChange={() => setBulkStatus('비공개')} />비공개</label>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmBulkStatus}>적용</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkImportant' && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 중요 FAQ 설정</div>
            <div className={styles.dialogBody} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><input type="radio" checked={bulkImportant === '지정'} onChange={() => setBulkImportant('지정')} />중요로 지정</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><input type="radio" checked={bulkImportant === '해제'} onChange={() => setBulkImportant('해제')} />중요 해제</label>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmBulkImportant}>적용</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'categoryManage' && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>카테고리 관리</div>
            <div className={styles.dialogSummary}>
              {categories.map((c) => (
                <div className={styles.dialogSummaryRow} key={c}>
                  <span>{c}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {categoryCounts[c] ?? 0}건
                    <button
                      type="button"
                      className={styles.attachRemove}
                      style={{ opacity: (categoryCounts[c] ?? 0) > 0 ? 0.3 : 1, cursor: (categoryCounts[c] ?? 0) > 0 ? 'default' : 'pointer' }}
                      title={(categoryCounts[c] ?? 0) > 0 ? '연결된 FAQ가 있어 삭제할 수 없습니다' : '삭제'}
                      onClick={() => removeCategory(c)}
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.attachAddRow}>
              <input className={styles.searchInput} style={{ flex: 1, maxWidth: 'none' }} value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} placeholder="새 카테고리명" />
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#18181b', color: '#fff' }} onClick={addCategory}>+ 추가</button>
            </div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={() => setConfirm(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'orderManage' && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>FAQ 노출 순서</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 12 }} value={orderCategory} onChange={(e) => changeOrderCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className={styles.dialogSummary}>
              {orderDraft.length === 0 && <div className={styles.emptyInline}>이 카테고리에 등록된 FAQ가 없습니다</div>}
              {orderDraft.map((id, i) => {
                const f = faqs.find((x) => x.id === id);
                if (!f) return null;
                return (
                  <div className={styles.dialogSummaryRow} key={id}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{i + 1}. {f.question}</span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className={styles.attachRemove} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }} onClick={() => moveOrder(i, -1)}>↑</button>
                      <button type="button" className={styles.attachRemove} disabled={i === orderDraft.length - 1} style={{ opacity: i === orderDraft.length - 1 ? 0.3 : 1 }} onClick={() => moveOrder(i, 1)}>↓</button>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={saveOrder}>순서 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
