import { DatePicker } from '../../components/forms/DatePicker';
import { SearchField } from '../../components/SearchField';
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import sh from './contentShared.module.css';
import styles from './ContentListPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { CONTENT_ITEMS, STATUS_PILL, REVIEW_PILL, EXPOSE_PILL, type ContentItem, type ContentStatus } from '../../data/content';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { ContentBusinessSwitch } from './ContentBusinessSwitch';
import { CONTENT_BUSINESS_META, CONTENT_BUSINESS_MODES, type ContentBusinessType } from './contentBusiness';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = 'minmax(230px,2fr) 104px 100px 76px 67px 94px 52px 70px 40px';
const FIELD_OPTIONS = ['전체', '콘텐츠 ID', '제목', '작성자'];
const STATUS_OPTIONS: ContentStatus[] = ['공개', '비공개', '임시저장', '예약', '삭제'];
const SUMMARY_LABELS = ['공개', '비공개', '임시저장', '예약', '검수대기', '전체'] as const;

interface Chip {
  key: string;
  label: string;
  clear: () => void;
}

interface EditDraft {
  title: string;
  desc: string;
  cat: string;
  status: ContentStatus;
  review: ContentItem['review'];
  expose: ContentItem['expose'];
}

interface CreateDraft {
  contentKind: string;
  audience: string;
  title: string;
  desc: string;
  cat: string;
  expose: ContentItem['expose'];
}

const CREATE_OPTIONS: Record<ContentBusinessType, { kinds: string[]; audiences: string[]; categories: string[] }> = {
  B2C: {
    kinds: ['기획 콘텐츠', '이벤트 안내', '브랜드 콘텐츠', '상품 가이드'],
    audiences: ['전체 고객', '일반 회원', 'VIP 고객'],
    categories: ['기획전', '이벤트', '브랜드', '상품 가이드'],
  },
  C2C: {
    kinds: ['운영 공지', '커뮤니티 가이드', '안전 거래 안내'],
    audiences: ['전체 회원', '판매 회원', '구매 회원'],
    categories: ['공지', '이용 가이드', '안전 거래'],
  },
  B2B: {
    kinds: ['거래처 공지', '업무 가이드', '매뉴얼', '업무 자료'],
    audiences: ['전체 거래처', '거래처 관리자', '구매 담당자'],
    categories: ['거래처 공지', '업무 자료', '매뉴얼'],
  },
};

const USER_SITE_URL = ((import.meta.env.VITE_USER_SITE_URL as string | undefined) ?? 'https://service.example.com').replace(/\/$/, '');

export function ContentListPage() {
  const [searchParams] = useSearchParams();
  const initialPreviewId = searchParams.get('id');
  const requestedBusiness = searchParams.get('business');
  const [businessMode, setBusinessMode] = useState<ContentBusinessType>(() => {
    const previewBusiness = CONTENT_ITEMS.find((item) => item.id === initialPreviewId)?.businessType;
    if (previewBusiness) return previewBusiness;
    return CONTENT_BUSINESS_MODES.includes(requestedBusiness as ContentBusinessType) ? requestedBusiness as ContentBusinessType : 'B2C';
  });
  const [data, setData] = useState<ContentItem[]>(CONTENT_ITEMS);
  const [field, setField] = useState('전체');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [status, setStatus] = useState('전체');
  const [reviewFilter, setReviewFilter] = useState('전체');
  const [catFilter, setCatFilter] = useState(searchParams.get('cat') ?? '전체');
  const [utypeFilter, setUtypeFilter] = useState('전체');
  const [exposeFilter, setExposeFilter] = useState('전체');
  const [recFilter, setRecFilter] = useState('전체');
  const [adv, setAdv] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [allPages, setAllPages] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(initialPreviewId);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [createDraft, setCreateDraft] = useState<CreateDraft | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestText, setRequestText] = useState('운영 정책에 맞게 콘텐츠 내용을 수정한 후 다시 검수를 요청해 주세요.');
  const [toast, setToast] = useState('');

  const modeData = useMemo(() => data.filter((item) => item.businessType === businessMode), [businessMode, data]);
  const categories = useMemo(() => Array.from(new Set(modeData.map((r) => r.cat))), [modeData]);
  const createCategories = useMemo(
    () => Array.from(new Set([...CREATE_OPTIONS[businessMode].categories, ...categories])),
    [businessMode, categories],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = modeData.filter((r) => {
      if (query) {
        const hay = field === '콘텐츠 ID' ? r.id : field === '제목' ? r.title : field === '작성자' ? r.author : r.id + r.title + r.author;
        if (!hay.toLowerCase().includes(query)) return false;
      }
      if (status !== '전체' && r.status !== status) return false;
      if (catFilter !== '전체' && r.cat !== catFilter) return false;
      if (reviewFilter !== '전체' && r.review !== reviewFilter) return false;
      if (exposeFilter !== '전체' && r.expose !== exposeFilter) return false;
      if (utypeFilter !== '전체' && r.utype !== utypeFilter) return false;
      if (recFilter !== '전체') {
        if (recFilter === '추천만' && r.expose !== '추천') return false;
        if (recFilter === '추천 제외' && r.expose === '추천') return false;
      }
      const created = r.created.replace(/\./g, '-');
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
    list = list.slice().sort((a, b) => (sortDesc ? (a.updated < b.updated ? 1 : -1) : a.updated > b.updated ? 1 : -1));
    return list;
  }, [modeData, q, field, status, catFilter, reviewFilter, exposeFilter, utypeFilter, recFilter, from, to, sortDesc]);

  const sel_ = sel.filter((id) => filtered.some((r) => r.id === id));

  const chips: Chip[] = [];
  if (q.trim()) chips.push({ key: 'q', label: `검색: ${field} “${q.trim()}”`, clear: () => setQ('') });
  if (status !== '전체') chips.push({ key: 'status', label: `상태: ${status}`, clear: () => setStatus('전체') });
  if (catFilter !== '전체') chips.push({ key: 'cat', label: `카테고리: ${catFilter}`, clear: () => setCatFilter('전체') });
  if (reviewFilter !== '전체') chips.push({ key: 'review', label: `검수: ${reviewFilter}`, clear: () => setReviewFilter('전체') });
  if (exposeFilter !== '전체') chips.push({ key: 'expose', label: `노출: ${exposeFilter}`, clear: () => setExposeFilter('전체') });
  if (utypeFilter !== '전체') chips.push({ key: 'utype', label: `등록자: ${utypeFilter}`, clear: () => setUtypeFilter('전체') });
  if (recFilter !== '전체') chips.push({ key: 'rec', label: `추천: ${recFilter}`, clear: () => setRecFilter('전체') });
  if (from || to) {
    chips.push({
      key: 'date',
      label: `등록일: ${from ? from.replace(/-/g, '.') : '시작일'} ~ ${to ? to.replace(/-/g, '.') : '종료일'}`,
      clear: () => { setFrom(''); setTo(''); },
    });
  }

  const detailFilterCount = [utypeFilter !== '전체', exposeFilter !== '전체', recFilter !== '전체', Boolean(from || to)].filter(Boolean).length;

  function resetAll() {
    setField('전체'); setQ(''); setStatus('전체'); setReviewFilter('전체'); setCatFilter('전체');
    setUtypeFilter('전체'); setExposeFilter('전체'); setRecFilter('전체'); setAdv(false);
    setFrom(''); setTo(''); setSel([]); setAllPages(false);
  }

  function switchBusiness(next: ContentBusinessType) {
    if (next === businessMode) return;
    setBusinessMode(next);
    resetAll();
    setPreviewId(null);
    setEditDraft(null);
    setCreateDraft(null);
    setRequestId(null);
    setConfirmId(null);
    setMenuId(null);
    setPage(1);
  }

  function summaryCount(label: (typeof SUMMARY_LABELS)[number]) {
    if (label === '전체') return modeData.length;
    if (label === '검수대기') return modeData.filter((r) => r.review === '대기').length;
    return modeData.filter((r) => r.status === label).length;
  }

  function pickSummary(label: (typeof SUMMARY_LABELS)[number]) {
    setSel([]); setAllPages(false);
    if (label === '검수대기') { setReviewFilter('대기'); setStatus('전체'); return; }
    if (label === '전체') { setStatus('전체'); setReviewFilter('전체'); return; }
    setStatus(label); setReviewFilter('전체');
  }

  function toggleSel(id: string) {
    setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat([id])));
    setAllPages(false);
  }
  function toggleAll() {
    setSel((prev) => (prev.length === filtered.length ? [] : filtered.map((r) => r.id)));
    setAllPages(false);
  }

  function toggleVisibility(id: string) {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === '공개' ? '비공개' : '공개' } : r)));
  }

  function flash(message: string) {
    setToast(message);
  }

  function bulkChangeStatus(nextStatus: ContentStatus) {
    const targets = new Set(sel_);
    setData((prev) => prev.map((item) => targets.has(item.id) ? { ...item, status: nextStatus } : item));
    flash(`${targets.size}개 콘텐츠의 공개 상태를 '${nextStatus}'(으)로 변경했습니다.`);
  }

  function bulkChangeCategory(nextCategory: string) {
    const targets = new Set(sel_);
    setData((prev) => prev.map((item) => targets.has(item.id) ? {
      ...item,
      cat: nextCategory,
      cats: [nextCategory, ...item.cats.filter((category) => category !== nextCategory && category !== item.cat)],
    } : item));
    flash(`${targets.size}개 콘텐츠의 카테고리를 '${nextCategory}'(으)로 변경했습니다.`);
  }

  function bulkChangeExposure(nextExposure: ContentItem['expose']) {
    const targets = new Set(sel_);
    setData((prev) => prev.map((item) => targets.has(item.id) ? { ...item, expose: nextExposure } : item));
    flash(`${targets.size}개 콘텐츠의 노출 방식을 '${nextExposure}'(으)로 변경했습니다.`);
  }

  function downloadExcel() {
    const targets = sel_.length > 0 ? filtered.filter((item) => sel_.includes(item.id)) : filtered;
    const columns = ['콘텐츠 ID', '비즈니스 타입', '제목', '콘텐츠 유형', '카테고리', '작성자', '등록자 유형', '공개 상태', '검수 상태', '노출 방식', '공개 대상', '등록일', '수정일', '조회수', '본문 요약'];
    const values = targets.map((item) => [
      item.id, item.businessType, item.title, item.contentKind, item.cat, item.author, item.utype,
      item.status, item.review, item.expose, item.audience, item.created, item.updated, item.views, item.desc,
    ]);
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [columns, ...values].map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `content-list-${businessMode}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    flash(`${targets.length}개 콘텐츠를 Excel용 CSV로 다운로드했습니다.`);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  function openServicePreview(item: ContentItem) {
    const path = item.status === '공개' ? `/contents/${item.id}` : `/preview/contents/${item.id}`;
    const url = new URL(path, USER_SITE_URL);
    url.searchParams.set('source', 'backoffice');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  function startEdit(item: ContentItem) {
    setCreateDraft(null);
    setPreviewId(item.id);
    setEditDraft({ title: item.title, desc: item.desc, cat: item.cat, status: item.status, review: item.review, expose: item.expose });
    setMenuId(null);
  }

  function saveEdit() {
    if (!preview || !editDraft) return;
    const fullEdit = preview.utype === '관리자';
    setData((prev) => prev.map((item) => item.id === preview.id ? {
      ...item,
      title: fullEdit ? editDraft.title.trim() : item.title,
      desc: fullEdit ? editDraft.desc.trim() : item.desc,
      cat: editDraft.cat,
      cats: [editDraft.cat, ...item.cats.filter((cat) => cat !== editDraft.cat && cat !== item.cat)],
      status: editDraft.status,
      review: editDraft.review,
      expose: editDraft.expose,
      updated: '2026.08.28',
    } : item));
    setEditDraft(null);
    flash(fullEdit ? '콘텐츠 수정 내용을 저장했습니다.' : '운영 정보를 저장했습니다.');
  }

  function startEditRequest(item: ContentItem) {
    setRequestId(item.id);
    setRequestText('운영 정책에 맞게 콘텐츠 내용을 수정한 후 다시 검수를 요청해 주세요.');
  }

  function sendEditRequest() {
    if (!requestText.trim()) return;
    setRequestId(null);
    flash('작성자에게 수정 요청을 발송했습니다.');
  }

  function openDetail(id: string) {
    setEditDraft(null);
    setPreviewId(id);
  }

  function closeDetail() {
    setEditDraft(null);
    setPreviewId(null);
  }

  function startCreate() {
    const options = CREATE_OPTIONS[businessMode];
    setPreviewId(null);
    setEditDraft(null);
    setRequestId(null);
    setConfirmId(null);
    setMenuId(null);
    setCreateDraft({
      contentKind: options.kinds[0],
      audience: options.audiences[0],
      title: '',
      desc: '',
      cat: options.categories[0],
      expose: '일반',
    });
  }

  function saveCreate(asDraft: boolean) {
    if (!createDraft?.title.trim() || !createDraft.desc.trim()) return;
    const nextNumber = Math.max(10284, ...data.map((item) => Number(item.id.replace(/\D/g, '')) || 0)) + 1;
    const id = `C${nextNumber}`;
    const today = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date()).replace(/\. /g, '.').replace(/\.$/, '');
    const next: ContentItem = {
      id,
      businessType: businessMode,
      contentKind: createDraft.contentKind,
      audience: createDraft.audience,
      title: createDraft.title.trim(),
      cat: createDraft.cat,
      cats: [createDraft.cat],
      author: 'admin01',
      uid: 'A0001',
      ujoin: '2023.11.10',
      utype: '관리자',
      status: asDraft ? '임시저장' : '비공개',
      review: asDraft ? '—' : '대기',
      expose: createDraft.expose,
      updated: today,
      created: today,
      views: '—',
      desc: createDraft.desc.trim(),
      tint: businessMode === 'B2C' ? '#fde8ef' : businessMode === 'C2C' ? '#eeeaf7' : '#e6ecfb',
    };
    setData((prev) => [next, ...prev]);
    setCreateDraft(null);
    resetAll();
    setPage(1);
    setPreviewId(id);
    flash(asDraft ? '콘텐츠를 임시저장했습니다.' : '콘텐츠를 등록하고 검수를 요청했습니다.');
  }

  const preview = previewId ? data.find((r) => r.id === previewId) ?? null : null;
  const previewAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(previewAsideRef, closeDetail, !!preview && !requestId && !confirmId);
  const createAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(createAsideRef, () => setCreateDraft(null), !!createDraft);
  const confirmTarget = confirmId ? data.find((r) => r.id === confirmId) ?? null : null;
  const requestTarget = requestId ? data.find((r) => r.id === requestId) ?? null : null;

  const columnLabels = {
    B2C: ['쇼핑 콘텐츠', '유형 / 카테고리', '등록자', '공개', '게시 검수', '쇼핑 노출'],
    C2C: ['회원 콘텐츠', '유형 / 카테고리', '작성 회원', '게시', '정책 검수', '탐색 노출'],
    B2B: ['자료 / 공지', '자료 구분', '등록 관리자', '게시', '문서 승인', '공개 범위'],
  }[businessMode];

  const columns: GridColumn[] = [
    { label: columnLabels[0] },
    { label: columnLabels[1] },
    { label: columnLabels[2] },
    { label: columnLabels[3] },
    { label: columnLabels[4] },
    { label: columnLabels[5] },
    { label: '등록일' },
    { label: `수정일 ${sortDesc ? '↓' : '↑'}`, onClick: () => setSortDesc((v) => !v) },
    { label: '관리', align: 'right' },
  ];

  const rows: GridRow[] = filtered.map((r) => {
    const st = STATUS_PILL[r.status];
    const rv = REVIEW_PILL[r.review];
    const ex = EXPOSE_PILL[r.expose];
    const isSel = sel_.includes(r.id);
    const moreItems: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => { openDetail(r.id); setMenuId(null); } },
      { label: r.utype === '관리자' ? '수정' : '운영 정보 수정', click: () => startEdit(r) },
      { label: '서비스 미리보기 ↗', click: () => { openServicePreview(r); setMenuId(null); } },
      ...(r.utype === '회원' ? [{ label: '작성자 수정 요청', click: () => { startEditRequest(r); setMenuId(null); } }] : []),
      { sep: true },
    ];
    if (r.status !== '삭제') {
      moreItems.push(
        r.status === '공개'
          ? { label: '비공개로 변경', click: () => { toggleVisibility(r.id); setMenuId(null); } }
          : { label: '공개하기', click: () => { toggleVisibility(r.id); setMenuId(null); } },
      );
    }
    moreItems.push({ label: '복제', click: () => setMenuId(null) });
    if (r.status !== '삭제') {
      moreItems.push({ label: '삭제', fg: '#b91c1c', click: () => { setConfirmId(r.id); setMenuId(null); } });
    }

    const cells: Cell[] = [
      { kind: 'thumbTitle', thumb: r.tint, title: r.title, id: r.id, titleFg: r.status === '삭제' ? '#a1a1aa' : '#18181b', onClick: () => openDetail(r.id) },
      { kind: 'stack', title: r.contentKind, subtitle: r.cat + (r.cats.length > 1 ? ` +${r.cats.length - 1}` : '') },
      { kind: 'text', text: r.author, tip: `${r.author}\n회원번호: ${r.uid}\n가입일: ${r.ujoin}`, color: r.utype === '관리자' ? '#4338ca' : '#3f3f46', size: '12.5px', weight: 500 },
      { kind: 'badge', text: r.status, bg: st.bg, fg: st.fg },
      { kind: 'badge', text: r.review, bg: rv.bg, fg: rv.fg },
      businessMode === 'B2B'
        ? { kind: 'pillText', text: r.audience, bg: '#eef2ff', fg: '#4338ca', size: '11px', weight: 600 }
        : { kind: 'badge', text: r.expose, bg: ex.bg, fg: ex.fg },
      { kind: 'text', text: r.created.slice(5), color: '#8b8b93', size: '12px', weight: 500, numeric: true },
      { kind: 'text', text: r.updated.slice(5), color: '#52525b', size: '12.5px', weight: 500, numeric: true },
      { kind: 'rowMenu', open: menuId === r.id, onToggle: () => setMenuId(menuId === r.id ? null : r.id), items: moreItems },
    ];

    return {
      id: r.id,
      cells,
      selected: isSel,
      onToggleSelect: () => toggleSel(r.id),
      onClick: () => {
        setMenuId(null);
        openDetail(r.id);
      },
      bg: previewId === r.id ? '#f8fafc' : isSel ? '#f7f8ff' : 'transparent',
    };
  });

  const pages: PageBtn[] = ['1', '2', '3', '4', '5'].map((label) => ({ label, active: String(page) === label, onClick: () => setPage(parseInt(label, 10)) }));

  const isEmptySearch = filtered.length === 0 && chips.length > 0;
  const isEmptyAll = filtered.length === 0 && chips.length === 0;

  const showBanner = sel_.length === filtered.length && filtered.length > 0 && !allPages;

  return (
    <div className={sh.page} onClick={() => menuId && setMenuId(null)}>
      {confirmTarget && (
        <div className={sh.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmId(null); }}>
          <div className={sh.dialogBox}>
            <div className={sh.dialogTitle}>콘텐츠를 삭제하시겠습니까?</div>
            <div className={sh.dialogBody}>{`'${confirmTarget.title}'이(가) 서비스에서 삭제됩니다. 즉시 완전 삭제되지 않고 삭제 상태로 전환되며, 30일간 복구할 수 있습니다.`}</div>
            <div className={sh.dialogActions}>
              <button type="button" className={sh.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirmId(null)}>취소</button>
              <button
                type="button"
                className={sh.dialogBtn}
                style={{ border: 0, background: 'oklch(0.58 0.19 25)', color: '#fff' }}
                onClick={() => {
                  setData((prev) => prev.map((r) => (r.id === confirmTarget.id ? { ...r, status: '삭제', expose: '일반' } : r)));
                  setConfirmId(null);
                  setPreviewId(null);
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {requestTarget && (
        <div className={sh.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setRequestId(null); }}>
          <div className={sh.dialogBox}>
            <div className={sh.dialogTitle}>작성자 수정 요청</div>
            <div className={sh.dialogBody}>회원 작성 콘텐츠의 본문은 운영자가 직접 변경하지 않습니다. 요청 내용은 작성자에게 발송되고 운영 이력에 기록됩니다.</div>
            <div className={styles.requestSummary}>
              <span>{requestTarget.id}</span>
              <strong>{requestTarget.title}</strong>
              <small>{requestTarget.author} · {requestTarget.uid}</small>
            </div>
            <label className={styles.requestField}>
              <span>수정 요청 내용 *</span>
              <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} placeholder="수정이 필요한 항목과 사유를 입력하세요." />
            </label>
            <div className={sh.dialogActions}>
              <button type="button" className={sh.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setRequestId(null)}>취소</button>
              <button type="button" className={sh.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} disabled={!requestText.trim()} onClick={sendEditRequest}>수정 요청 발송</button>
            </div>
          </div>
        </div>
      )}

      {createDraft && (
        <aside ref={createAsideRef} className={styles.previewAside} aria-label="콘텐츠 등록">
          <div className={styles.previewHead}>
            <span className={styles.previewHeadTitle}>콘텐츠 등록</span>
            <button type="button" className={styles.previewClose} onClick={() => setCreateDraft(null)} aria-label="닫기">×</button>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.editForm}>
              <div className={styles.editContext}>
                <span>{businessMode} 관리자 콘텐츠</span>
                <strong>신규 등록</strong>
                <small>등록한 콘텐츠는 비공개 상태로 저장되고 검수 대기 목록에 추가됩니다.</small>
              </div>
              <div className={styles.editGrid}>
                <label className={styles.editField}>
                  <span>콘텐츠 유형 *</span>
                  <select value={createDraft.contentKind} onChange={(e) => setCreateDraft({ ...createDraft, contentKind: e.target.value })}>
                    {CREATE_OPTIONS[businessMode].kinds.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className={styles.editField}>
                  <span>대상 / 공개 범위 *</span>
                  <select value={createDraft.audience} onChange={(e) => setCreateDraft({ ...createDraft, audience: e.target.value })}>
                    {CREATE_OPTIONS[businessMode].audiences.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <label className={styles.editField}>
                <span>제목 *</span>
                <input value={createDraft.title} onChange={(e) => setCreateDraft({ ...createDraft, title: e.target.value })} placeholder="콘텐츠 제목을 입력하세요." autoFocus />
              </label>
              <label className={styles.editField}>
                <span>본문 요약 *</span>
                <textarea value={createDraft.desc} onChange={(e) => setCreateDraft({ ...createDraft, desc: e.target.value })} placeholder="목록과 상세 화면에 표시할 콘텐츠 내용을 입력하세요." />
              </label>
              <div className={styles.editGrid}>
                <label className={styles.editField}>
                  <span>대표 카테고리 *</span>
                  <select value={createDraft.cat} onChange={(e) => setCreateDraft({ ...createDraft, cat: e.target.value })}>
                    {createCategories.map((cat) => <option key={cat}>{cat}</option>)}
                  </select>
                </label>
                <label className={styles.editField}>
                  <span>노출 방식</span>
                  <select value={createDraft.expose} onChange={(e) => setCreateDraft({ ...createDraft, expose: e.target.value as ContentItem['expose'] })}>
                    {(['일반', '추천', '고정'] as ContentItem['expose'][]).map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>
          <div className={styles.previewFooter}>
            <button type="button" className={styles.previewFooterBtn} disabled={!createDraft.title.trim() || !createDraft.desc.trim()} onClick={() => saveCreate(true)}>임시저장</button>
            <button type="button" className={styles.previewFooterBtnSolid} disabled={!createDraft.title.trim() || !createDraft.desc.trim()} onClick={() => saveCreate(false)}>등록 및 검수 요청</button>
          </div>
        </aside>
      )}

      {preview && (
          <aside ref={previewAsideRef} className={styles.previewAside} aria-label="콘텐츠 상세">
            <div className={styles.previewHead}>
              <span className={styles.previewHeadTitle}>{editDraft ? (preview.utype === '관리자' ? '콘텐츠 수정' : '운영 정보 수정') : '콘텐츠 상세'}</span>
              <button type="button" className={styles.previewClose} onClick={closeDetail} aria-label="닫기">×</button>
            </div>
            <div className={styles.previewBody}>
              {editDraft ? (
                <div className={styles.editForm}>
                  <div className={styles.editContext}>
                    <span>{preview.utype === '관리자' ? '관리자 작성 콘텐츠' : '회원 작성 콘텐츠'}</span>
                    <strong>{preview.id}</strong>
                    <small>{preview.utype === '관리자' ? '본문과 운영 정보를 수정할 수 있습니다.' : '본문은 작성자 소유이므로 운영 정보만 수정할 수 있습니다.'}</small>
                  </div>
                  {preview.utype === '관리자' && (
                    <>
                      <label className={styles.editField}>
                        <span>제목 *</span>
                        <input value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                      </label>
                      <label className={styles.editField}>
                        <span>본문 요약 *</span>
                        <textarea value={editDraft.desc} onChange={(e) => setEditDraft({ ...editDraft, desc: e.target.value })} />
                      </label>
                    </>
                  )}
                  <label className={styles.editField}>
                    <span>대표 카테고리</span>
                    <select value={editDraft.cat} onChange={(e) => setEditDraft({ ...editDraft, cat: e.target.value })}>
                      {categories.map((cat) => <option key={cat}>{cat}</option>)}
                    </select>
                  </label>
                  <div className={styles.editGrid}>
                    <label className={styles.editField}>
                      <span>공개 상태</span>
                      <select value={editDraft.status} onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value as ContentStatus })}>
                        {STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <label className={styles.editField}>
                      <span>검수 상태</span>
                      <select value={editDraft.review} onChange={(e) => setEditDraft({ ...editDraft, review: e.target.value as ContentItem['review'] })}>
                        {(['승인', '대기', '반려', '—'] as ContentItem['review'][]).map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <label className={styles.editField}>
                      <span>노출 상태</span>
                      <select value={editDraft.expose} onChange={(e) => setEditDraft({ ...editDraft, expose: e.target.value as ContentItem['expose'] })}>
                        {(['일반', '추천', '고정'] as ContentItem['expose'][]).map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                  </div>
                  {preview.utype === '회원' && (
                    <button type="button" className={styles.requestInlineBtn} onClick={() => startEditRequest(preview)}>본문 변경이 필요하면 작성자에게 수정 요청</button>
                  )}
                </div>
              ) : (
                <>
                  <div className={styles.previewThumb} style={{ background: `repeating-linear-gradient(135deg, ${preview.tint} 0 10px, #fff 10px 20px)` }}>
                    <span className={styles.previewThumbLabel}>대표 이미지</span>
                  </div>
                  <div className={styles.previewTitle}>{preview.title}</div>
                  <div className={styles.previewId}>#{preview.id}</div>
                  <div className={styles.previewFields}>
                    {[
                      { label: '상태', value: preview.status, ...STATUS_PILL[preview.status], pad: '2px 9px' },
                      { label: '검수', value: preview.review, ...REVIEW_PILL[preview.review], pad: '2px 9px' },
                      { label: '노출', value: preview.expose, ...EXPOSE_PILL[preview.expose], pad: '2px 9px' },
                      { label: '비즈니스 타입', value: preview.businessType, bg: '#eef2ff', fg: '#4338ca', pad: '2px 9px' },
                      { label: '콘텐츠 유형', value: preview.contentKind, bg: 'transparent', fg: '#18181b', pad: '0' },
                      { label: '대상 / 공개 범위', value: preview.audience, bg: 'transparent', fg: '#18181b', pad: '0' },
                      { label: '작성자', value: `${preview.author} · ${preview.uid}`, bg: 'transparent', fg: '#18181b', pad: '0' },
                      { label: '등록자 유형', value: preview.utype, bg: 'transparent', fg: '#18181b', pad: '0' },
                      { label: '카테고리', value: preview.cats.join(' / '), bg: 'transparent', fg: '#18181b', pad: '0' },
                      { label: '등록일', value: preview.created, bg: 'transparent', fg: '#18181b', pad: '0' },
                      { label: '최근 수정', value: preview.updated, bg: 'transparent', fg: '#18181b', pad: '0' },
                      { label: '조회수', value: preview.views, bg: 'transparent', fg: '#18181b', pad: '0' },
                    ].map((f) => (
                      <div key={f.label} className={styles.previewFieldRow}>
                        <span className={styles.previewFieldLabel}>{f.label}</span>
                        <span className={styles.previewFieldValue} style={{ background: f.bg, color: f.fg, padding: f.pad }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.previewDesc}>{preview.desc}</div>
                </>
              )}
            </div>
            <div className={styles.previewFooter}>
              {editDraft ? (
                <>
                  <button type="button" className={styles.previewFooterBtn} onClick={() => setEditDraft(null)}>취소</button>
                  <button type="button" className={styles.previewFooterBtnSolid} disabled={preview.utype === '관리자' && (!editDraft.title.trim() || !editDraft.desc.trim())} onClick={saveEdit}>저장</button>
                </>
              ) : (
                <>
                  <button type="button" className={styles.previewFooterBtn} onClick={() => openServicePreview(preview)}>서비스 미리보기 ↗</button>
                  {preview.utype === '회원' && <button type="button" className={styles.previewFooterBtn} onClick={() => startEditRequest(preview)}>수정 요청</button>}
                  <button type="button" className={styles.previewFooterBtnSolid} onClick={() => startEdit(preview)}>{preview.utype === '관리자' ? '수정' : '운영 정보 수정'}</button>
                </>
              )}
            </div>
          </aside>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}

      <header className={sh.header}>
        <div>
          <div className={sh.headerTitle}>콘텐츠 목록</div>
          <div className={sh.headerSub}>등록된 콘텐츠를 조회하고 노출 및 상태를 관리합니다.</div>
        </div>
        <ContentBusinessSwitch
          value={businessMode}
          options={CONTENT_BUSINESS_MODES}
          onChange={switchBusiness}
          note={CONTENT_BUSINESS_META[businessMode].listNote}
        />
        <div className={sh.headerSpacer} />
        <button type="button" className={sh.primaryBtn} onClick={startCreate}>＋ 콘텐츠 등록</button>
      </header>

      <div className={sh.body}>
        <div className={sh.topPad}>
          <nav className={sh.quickFilters} aria-label="콘텐츠 상태 보기">
            {SUMMARY_LABELS.map((label) => {
              const on = label === '검수대기' ? reviewFilter === '대기' : label === '전체' ? status === '전체' && reviewFilter === '전체' : status === label;
              return (
                <CommonButton
                  key={label}
                  variant={on ? 'primary-light' : 'secondary'}
                  size="md"
                  className={`${sh.qfBtn} ${on ? sh.active : ''}`}
                  onClick={() => pickSummary(label)}
                >
                  <span className={sh.qfLabel}>{label}</span>
                  <span className={sh.qfCount}>{summaryCount(label)}</span>
                </CommonButton>
              );
            })}
          </nav>

          <div className={styles.stepLabel}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepTitle}>조건 설정</span>
            <span className={styles.stepHint}>검색어와 자주 쓰는 조건을 먼저 선택하세요.</span>
            {chips.length > 0 && <span className={styles.appliedCount}>{chips.length}개 조건 적용</span>}
          </div>

          <div className={styles.filterPanel}>
            <div className={styles.searchLine}>
              <label className="globalFilterField"><span>검색 범위</span><select className={styles.searchScope} aria-label="검색 범위" value={field} onChange={(e) => setField(e.target.value)}>
                {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select></label>
              <SearchField
                ref={searchInputRef}
                className={styles.searchField}
                value={q}
                onValueChange={(value) => { setQ(value); setSel([]); }}
                placeholder="콘텐츠 ID, 제목 또는 작성자를 검색하세요"
                shortcutHint="/"
                aria-label="콘텐츠 검색"
              />
              <div className={styles.searchActions}>
                <button type="button" className={`${styles.detailButton} ${detailFilterCount > 0 ? styles.hasFilter : ''}`} onClick={() => setAdv((v) => !v)} aria-expanded={adv}>
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  상세 필터
                  {detailFilterCount > 0 && <span className={styles.detailCount}>{detailFilterCount}</span>}
                  {adv ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                </button>
                <button type="button" className={styles.resetButton} onClick={resetAll} disabled={chips.length === 0}>
                  <RotateCcw size={13} aria-hidden="true" />
                  초기화
                </button>
              </div>
            </div>

            <div className={styles.primaryFilters}>
              <label className={styles.filterControl}>
                <span>카테고리</span>
                <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setSel([]); }}>
                  {['전체', ...categories].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className={styles.filterControl}>
                <span>검수 상태</span>
                <select value={reviewFilter} onChange={(e) => { setReviewFilter(e.target.value); setSel([]); }}>
                  {['전체', '승인', '대기', '반려'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            </div>

            {adv && (
              <div className={styles.advancedPanel}>
                <div className={styles.advancedHead}>
                  <strong>상세 조건</strong>
                  <span>필요한 경우에만 추가 조건을 설정하세요.</span>
                </div>
                <div className={styles.advancedGrid}>
                  <label className={`${styles.filterControl} ${styles.dateControl}`}>
                    <span>등록일</span>
                    <div className={styles.dateRange}>
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
                  <label className={styles.filterControl}>
                    <span>등록자 유형</span>
                    <select value={utypeFilter} onChange={(e) => { setUtypeFilter(e.target.value); setSel([]); }}>
                      {['전체', '회원', '관리자'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label className={styles.filterControl}>
                    <span>노출 상태</span>
                    <select value={exposeFilter} onChange={(e) => { setExposeFilter(e.target.value); setSel([]); }}>
                      {['전체', '일반', '추천', '고정'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label className={styles.filterControl}>
                    <span>추천 여부</span>
                    <select value={recFilter} onChange={(e) => { setRecFilter(e.target.value); setSel([]); }}>
                      {['전체', '추천만', '추천 제외'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {chips.length > 0 && (
              <div className={styles.appliedFilters}>
                <span className={styles.appliedLabel}>적용된 조건</span>
                <div className={styles.chipList}>
                  {chips.map((c) => (
                    <button key={c.key} type="button" className={styles.filterChip} onClick={c.clear} title={`${c.label} 조건 해제`}>
                      {c.label}<span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
                <button type="button" className={styles.clearAllButton} onClick={resetAll}>전체 해제</button>
              </div>
            )}
          </div>

          <div className={`${styles.stepLabel} ${styles.resultStep}`}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepTitle}>조회 결과</span>
            <span className={styles.stepHint}>행을 클릭하면 상세 내용을 확인할 수 있습니다.</span>
          </div>
        </div>

        <div className={`${sh.listArea} ${styles.listArea}`}>
          <div className={sh.toolbarRow}>
            {sel_.length > 0 ? (
              <div className={sh.selBar}>
                <span className={sh.selCount}>✓ {sel_.length}개 선택됨</span>
                <select className={sh.selSelect} value="" aria-label="선택 콘텐츠 공개 상태 변경" onChange={(e) => bulkChangeStatus(e.target.value as ContentStatus)}>
                  <option value="" disabled>공개 상태 변경</option>
                  <option value="공개">공개</option>
                  <option value="비공개">비공개</option>
                  <option value="임시저장">임시저장</option>
                </select>
                <select className={sh.selSelect} value="" aria-label="선택 콘텐츠 카테고리 변경" onChange={(e) => bulkChangeCategory(e.target.value)}>
                  <option value="" disabled>카테고리 변경</option>
                  {createCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <select className={sh.selSelect} value="" aria-label="선택 콘텐츠 노출 방식 변경" onChange={(e) => bulkChangeExposure(e.target.value as ContentItem['expose'])}>
                  <option value="" disabled>노출 설정</option>
                  <option value="일반">일반</option>
                  <option value="추천">추천</option>
                  <option value="고정">고정</option>
                </select>
                <button type="button" className={sh.selBtn} style={{ width: 30 }}>⋯</button>
                <div className={sh.rowSpacer} />
                <button type="button" className={sh.resetBtn} onClick={downloadExcel}>Excel 다운로드</button>
                <button type="button" className={sh.clearSelBtn} onClick={() => setSel([])}>선택 해제</button>
              </div>
            ) : (
              <div className={sh.noSelBar}>
                <span className={sh.totalLabel}>{`총 ${filtered.length.toLocaleString('ko-KR')}개`}</span>
                <div className={sh.rowSpacer} />
                <button type="button" className={sh.resetBtn} onClick={downloadExcel}>Excel 다운로드</button>
                <select className={sh.pageSizeSelect} defaultValue="20개씩 보기">
                  <option>20개씩 보기</option>
                  <option>50개씩 보기</option>
                  <option>100개씩 보기</option>
                </select>
              </div>
            )}
          </div>

          {showBanner && (
            <div className={sh.banner}>
              <span>{`현재 페이지의 콘텐츠 ${filtered.length}개가 선택되었습니다.`}</span>
              <button type="button" className={sh.bannerAction} onClick={() => setAllPages(true)}>{`검색 결과 ${filtered.length}개 전체 선택`}</button>
            </div>
          )}

          <div className={sh.gridArea}>
            <DataGrid
              columns={columns}
              rows={rows}
              gridTemplate={GRID_TEMPLATE}
              minWidth="1070px"
              selectable
              allSelected={filtered.length > 0 && sel_.length === filtered.length}
              onToggleAll={toggleAll}
              showPagination
              pages={pages}
              empty={filtered.length === 0}
              emptyText={isEmptySearch ? '검색 결과가 없습니다.' : isEmptyAll ? '등록된 콘텐츠가 없습니다.' : undefined}
              emptySubtext={isEmptySearch ? '검색어나 필터 조건을 변경해 주세요.' : undefined}
              emptyActionLabel={isEmptySearch ? '필터 초기화' : undefined}
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
