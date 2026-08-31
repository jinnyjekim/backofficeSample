import { DatePicker } from '../../components/forms/DatePicker';
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

const GRID_TEMPLATE = 'minmax(230px,2fr) 104px 96px 74px 62px 62px 74px 72px 34px';
const FIELD_OPTIONS = ['전체', '콘텐츠 ID', '제목', '작성자'];
const STATUS_OPTIONS: ContentStatus[] = ['공개', '비공개', '임시저장', '예약', '삭제'];
const SUMMARY_LABELS = ['전체', '공개', '비공개', '임시저장', '예약', '검수대기'] as const;

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
  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState('2026-08-13');
  const [sel, setSel] = useState<string[]>([]);
  const [allPages, setAllPages] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(initialPreviewId);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestText, setRequestText] = useState('운영 정책에 맞게 콘텐츠 내용을 수정한 후 다시 검수를 요청해 주세요.');
  const [toast, setToast] = useState('');

  const modeData = useMemo(() => data.filter((item) => item.businessType === businessMode), [businessMode, data]);
  const categories = useMemo(() => Array.from(new Set(modeData.map((r) => r.cat))), [modeData]);

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
      return true;
    });
    list = list.slice().sort((a, b) => (sortDesc ? (a.updated < b.updated ? 1 : -1) : a.updated > b.updated ? 1 : -1));
    return list;
  }, [modeData, q, field, status, catFilter, reviewFilter, exposeFilter, utypeFilter, recFilter, sortDesc]);

  const sel_ = sel.filter((id) => filtered.some((r) => r.id === id));

  const chips: Chip[] = [];
  if (q.trim()) chips.push({ key: 'q', label: `검색: ${field} “${q.trim()}”`, clear: () => setQ('') });
  if (status !== '전체') chips.push({ key: 'status', label: `상태: ${status}`, clear: () => setStatus('전체') });
  if (catFilter !== '전체') chips.push({ key: 'cat', label: `카테고리: ${catFilter}`, clear: () => setCatFilter('전체') });
  if (reviewFilter !== '전체') chips.push({ key: 'review', label: `검수: ${reviewFilter}`, clear: () => setReviewFilter('전체') });
  if (exposeFilter !== '전체') chips.push({ key: 'expose', label: `노출: ${exposeFilter}`, clear: () => setExposeFilter('전체') });
  if (utypeFilter !== '전체') chips.push({ key: 'utype', label: `등록자: ${utypeFilter}`, clear: () => setUtypeFilter('전체') });
  if (recFilter !== '전체') chips.push({ key: 'rec', label: `추천: ${recFilter}`, clear: () => setRecFilter('전체') });
  if (from !== '2026-07-01' || to !== '2026-08-13') {
    chips.push({ key: 'date', label: `등록일: ${from.replace(/-/g, '.')} ~ ${to.replace(/-/g, '.')}`, clear: () => { setFrom('2026-07-01'); setTo('2026-08-13'); } });
  }

  function resetAll() {
    setField('전체'); setQ(''); setStatus('전체'); setReviewFilter('전체'); setCatFilter('전체');
    setUtypeFilter('전체'); setExposeFilter('전체'); setRecFilter('전체'); setAdv(false);
    setFrom('2026-07-01'); setTo('2026-08-13'); setSel([]); setAllPages(false);
  }

  function switchBusiness(next: ContentBusinessType) {
    if (next === businessMode) return;
    setBusinessMode(next);
    resetAll();
    setPreviewId(null);
    setEditDraft(null);
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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openServicePreview(item: ContentItem) {
    const path = item.status === '공개' ? `/contents/${item.id}` : `/preview/contents/${item.id}`;
    const url = new URL(path, USER_SITE_URL);
    url.searchParams.set('source', 'backoffice');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  function startEdit(item: ContentItem) {
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

  const preview = previewId ? data.find((r) => r.id === previewId) ?? null : null;
  const previewAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(previewAsideRef, closeDetail, !!preview && !requestId && !confirmId);
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

  const isEmptySearch = filtered.length === 0 && (q.trim() !== '' || chips.length > 1);
  const isEmptyAll = filtered.length === 0 && q.trim() === '' && chips.length <= 1;

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
        <button type="button" className={sh.primaryBtn}>＋ 콘텐츠 등록</button>
      </header>

      <div className={sh.body}>
        <div className={sh.topPad}>
          <div className={sh.quickFilters}>
            {SUMMARY_LABELS.map((label) => {
              const on = label === '검수대기' ? reviewFilter === '대기' : label === '전체' ? status === '전체' && reviewFilter === '전체' : status === label;
              return (
                <button key={label} type="button" className={`${sh.qfBtn} ${on ? sh.active : ''}`} onClick={() => pickSummary(label)}>
                  <span className={sh.qfLabel}>{label}</span>
                  <span className={sh.qfCount}>{summaryCount(label)}</span>
                </button>
              );
            })}
          </div>

          <div className={sh.filterBox}>
            <div className={sh.searchRow}>
              <select className={sh.selectField} value={field} onChange={(e) => setField(e.target.value)}>
                {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <input className={sh.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색어를 입력하고 Enter" />
              <button type="button" className={sh.searchBtn}>검색</button>
            </div>

            <div className={sh.filterRow}>
              <div className={sh.filterField}>
                <span className={sh.filterFieldLabel}>상태</span>
                <select className={sh.smallSelect} value={status} onChange={(e) => { setStatus(e.target.value); setSel([]); }}>
                  {['전체', ...STATUS_OPTIONS].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className={sh.filterField}>
                <span className={sh.filterFieldLabel}>카테고리</span>
                <select className={sh.smallSelect} value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setSel([]); }}>
                  {['전체', ...categories].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className={sh.filterField}>
                <span className={sh.filterFieldLabel}>검수 상태</span>
                <select className={sh.smallSelect} value={reviewFilter} onChange={(e) => { setReviewFilter(e.target.value); setSel([]); }}>
                  {['전체', '승인', '대기', '반려'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className={sh.filterField}>
                <span className={sh.filterFieldLabel}>등록일</span>
                <DatePicker className={sh.dateInput} value={from} onChange={(e) => setFrom(e.target.value)} />
                <span className={sh.dateSep}>~</span>
                <DatePicker className={sh.dateInput} value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            {adv && (
              <div className={sh.filterRow} style={{ paddingTop: 10, borderTop: '1px dashed rgba(0,0,0,.1)' }}>
                <div className={sh.filterField}>
                  <span className={sh.filterFieldLabel}>등록자 유형</span>
                  <select className={sh.smallSelect} value={utypeFilter} onChange={(e) => { setUtypeFilter(e.target.value); setSel([]); }}>
                    {['전체', '회원', '관리자'].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={sh.filterField}>
                  <span className={sh.filterFieldLabel}>노출 상태</span>
                  <select className={sh.smallSelect} value={exposeFilter} onChange={(e) => { setExposeFilter(e.target.value); setSel([]); }}>
                    {['전체', '일반', '추천', '고정'].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={sh.filterField}>
                  <span className={sh.filterFieldLabel}>추천 여부</span>
                  <select className={sh.smallSelect} value={recFilter} onChange={(e) => { setRecFilter(e.target.value); setSel([]); }}>
                    {['전체', '추천만', '추천 제외'].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className={sh.dashedBtn} onClick={() => setAdv((v) => !v)}>{adv ? '상세 필터 −' : '상세 필터 +'}</button>
              <div className={sh.rowSpacer} />
              <button type="button" className={sh.resetBtn} onClick={resetAll}>초기화</button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className={sh.chipsRow}>
              <span className={sh.chipsLabel}>적용된 조건</span>
              {chips.map((c) => (
                <button key={c.key} type="button" className={sh.chip} onClick={c.clear}>
                  {c.label}<span className={sh.chipX}>×</span>
                </button>
              ))}
              <button type="button" className={sh.clearAllBtn} onClick={resetAll}>전체 초기화</button>
            </div>
          )}
        </div>

        <div className={sh.listArea}>
          <div className={sh.toolbarRow}>
            {sel_.length > 0 ? (
              <div className={sh.selBar}>
                <span className={sh.selCount}>✓ {sel_.length}개 선택됨</span>
                <button type="button" className={sh.selBtn}>공개 상태 변경 ▾</button>
                <button type="button" className={sh.selBtn}>카테고리 변경</button>
                <button type="button" className={sh.selBtn}>노출 설정 ▾</button>
                <button type="button" className={sh.selBtn} style={{ width: 30 }}>⋯</button>
                <div className={sh.rowSpacer} />
                <button type="button" className={sh.clearSelBtn} onClick={() => setSel([])}>선택 해제</button>
              </div>
            ) : (
              <div className={sh.noSelBar}>
                <span className={sh.totalLabel}>{`총 ${filtered.length.toLocaleString('ko-KR')}개`}</span>
                <div className={sh.rowSpacer} />
                <button type="button" className={sh.resetBtn}>Excel 다운로드</button>
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
              minWidth="1040px"
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
