import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { ReviewDetailDrawer } from './ReviewDetailDrawer';
import {
  DELETE_REASONS,
  EXPOSURE_META,
  HIDE_REASONS,
  QUICK_FILTERS,
  REVIEWS,
  TODAY,
  computeIssues,
  matchesQuickFilter,
  pendingReportCount,
  productName,
  type HideReason,
  type QuickFilter,
  type Review,
} from './reviewsData';

const GRID_TEMPLATE = '130px 90px 1.5fr 70px 90px 90px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '상품' },
  { label: '회원' },
  { label: '리뷰' },
  { label: '신고', align: 'right' },
  { label: '노출 상태' },
  { label: '작성일' },
  { label: '관리' },
];

type ConfirmState =
  | { kind: 'hide'; item: Review }
  | { kind: 'delete'; item: Review }
  | { kind: 'bulkExposure'; expose: boolean }
  | null;

function history(item: Review, action: string, detail?: string): Review {
  return {
    ...item,
    updatedAt: TODAY,
    history: [...item.history, { id: `H-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin01', action, detail }],
  };
}

export function ReviewsListPage() {
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>(REVIEWS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [hideReason, setHideReason] = useState<HideReason>('욕설 / 비방');
  const [hideDetail, setHideDetail] = useState('');
  const [deleteReason, setDeleteReason] = useState(DELETE_REASONS[0]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const view = searchParams.get('view');
    const filterByView: Record<string, QuickFilter> = {
      reported: '신고 리뷰',
      hidden: '비노출',
      replies: '답변 대기',
      moderation: '검토 필요',
      deleted: '삭제됨',
    };
    if (view && filterByView[view]) setQuickFilter(filterByView[view]);
  }, [searchParams]);

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    reviews.forEach((r) => { map[r.id] = computeIssues(r); });
    return map;
  }, [reviews]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = reviews.filter((r) => matchesQuickFilter(r, f)).length; });
    return c;
  }, [reviews]);

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        if (!matchesQuickFilter(r, quickFilter)) return false;
        if (search && !`${r.id} ${r.member} ${productName(r.productCode)} ${r.productCode}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (ratingFilter && String(r.rating) !== ratingFilter) return false;
        return true;
      }),
    [reviews, quickFilter, search, ratingFilter],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setRatingFilter('');
  };

  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((r) => r.id)));
  }

  function openDetail(id: string) {
    setDrawerId(id);
    setMenuId(null);
  }

  const selected = drawerId ? reviews.find((r) => r.id === drawerId) ?? null : null;

  function update(id: string, fn: (r: Review) => Review) {
    setReviews((prev) => prev.map((r) => (r.id === id ? fn(r) : r)));
  }

  function restore(item: Review) {
    update(item.id, (r) => history({ ...r, exposure: '노출', hideReason: null, hideDetail: null }, '노출 복원'));
    toastBriefly('리뷰를 노출로 복원했습니다.');
  }

  function saveReply(id: string, text: string) {
    update(id, (r) => history({ ...r, adminReply: { at: `${TODAY} 15:00`, by: 'admin01', text } }, r.adminReply ? '관리자 답변 수정' : '관리자 답변 등록'));
    toastBriefly('답변을 저장했습니다.');
  }
  function deleteReply(id: string) {
    update(id, (r) => history({ ...r, adminReply: null }, '관리자 답변 삭제'));
    toastBriefly('답변을 삭제했습니다.');
  }
  function addMemo(id: string, text: string) {
    update(id, (r) => ({ ...r, memos: [...r.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text }] }));
  }

  function confirmAction() {
    if (!confirm) return;
    if (confirm.kind === 'hide') {
      update(confirm.item.id, (r) => history({ ...r, exposure: '비노출', hideReason, hideDetail: hideDetail.trim() || null }, '비노출 처리', hideReason));
      toastBriefly('리뷰를 비노출 처리했습니다.');
      setHideDetail('');
    } else if (confirm.kind === 'delete') {
      update(confirm.item.id, (r) => history({ ...r, exposure: '삭제', deleteReason }, '삭제 처리', deleteReason));
      toastBriefly('리뷰를 삭제 처리했습니다.');
    } else if (confirm.kind === 'bulkExposure') {
      setReviews((prev) => prev.map((r) => (selectedIds.includes(r.id) ? history({ ...r, exposure: confirm.expose ? '노출' : '비노출' }, confirm.expose ? '노출 처리 (일괄)' : '비노출 처리 (일괄)') : r)));
      toastBriefly(`${selectedIds.length}건을 ${confirm.expose ? '노출' : '비노출'} 처리했습니다.`);
      setSelectedIds([]);
    }
    setConfirm(null);
  }

  function rowMenuItems(r: Review) {
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(r.id) },
    ];
    if (r.exposure === '노출') {
      items.push({ sep: true });
      items.push({ label: '비노출', click: () => setConfirm({ kind: 'hide', item: r }) });
      items.push({ label: '삭제 처리', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: r }) });
    } else if (r.exposure === '비노출') {
      items.push({ sep: true });
      items.push({ label: '노출 복원', click: () => restore(r) });
      items.push({ label: '삭제 처리', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: r }) });
    }
    return items;
  }

  const rows: GridRow[] = filtered.map((r) => {
    const sm = EXPOSURE_META[r.exposure];
    const issueList = issuesMap[r.id] ?? [];
    const pending = pendingReportCount(r);
    const cells: Cell[] = [
      { kind: 'text', text: productName(r.productCode), color: '#3f3f46', size: '12px', weight: 600 },
      { kind: 'text', text: r.member, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'titleWarn', title: `${'★'.repeat(r.rating)} ${r.content.length > 24 ? `${r.content.slice(0, 24)}…` : r.content}`, hasIssue: issueList.length > 0, issueTitle: issueList.join(' · ') },
      { kind: 'text', text: pending > 0 ? String(pending) : '-', color: pending > 0 ? '#dc2626' : '#a1a1aa', size: '12px', weight: 700, align: 'right', numeric: true },
      { kind: 'badge', text: r.exposure, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: r.createdAt.slice(5, 10).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      {
        kind: 'rowMenu',
        align: 'right',
        detailLabel: '상세',
        onDetail: () => openDetail(r.id),
        open: menuId === r.id,
        onToggle: () => setMenuId(menuId === r.id ? null : r.id),
        items: rowMenuItems(r),
      },
    ];
    return {
      id: r.id,
      cells,
      onClick: () => openDetail(r.id),
      selected: selectedIds.includes(r.id),
      onToggleSelect: () => toggleSel(r.id),
    };
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>리뷰 운영</div>
            <div className={styles.subtitle}>리뷰 조회, 신고 검토, 노출 조치와 관리자 답변을 한곳에서 관리합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((f) => (
            <button key={f} type="button" className={styles.qfBtn} style={{ borderColor: quickFilter === f ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: quickFilter === f ? 'var(--accent)' : '#fff' }} onClick={() => setQuickFilter(f)}>
              <span className={styles.qfLabel} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{f}</span>
              <span className={styles.qfCount} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.filterBox}>
          <form className={styles.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="리뷰ID, 회원, 상품명 또는 상품코드 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <select className={styles.selectSm} value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
              <option value="">평점 전체</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
            </select>
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} onClick={() => toastBriefly('데이터 다운로드를 준비했습니다.')}>↓ 데이터 다운로드</button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{selectedIds.length}건 선택됨</span>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkExposure', expose: true })}>선택 노출</button>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkExposure', expose: false })}>선택 비노출</button>
          <button type="button" className={styles.bulkBtn} onClick={() => toastBriefly(`${selectedIds.length}건을 다운로드했습니다.`)}>다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="920px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          empty={rows.length === 0}
          emptyText={reviews.length === 0 ? '등록된 리뷰가 없습니다.' : quickFilter === '검토 필요' ? '현재 검토가 필요한 리뷰가 없습니다.' : quickFilter === '신고 리뷰' ? '현재 처리 대기 중인 신고 리뷰가 없습니다.' : '검색 조건에 해당하는 리뷰가 없습니다.'}
          emptySubtext={reviews.length === 0 ? '회원이 상품 리뷰를 작성하면 이곳에서 확인할 수 있습니다.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={reviews.length > 0 ? '필터 초기화' : undefined}
          emptyActionClick={reviews.length > 0 ? resetFilters : undefined}
        />
      </div>

      {selected && (
        <ReviewDetailDrawer
          key={selected.id}
          review={selected}
          onClose={() => setDrawerId(null)}
          onHide={() => setConfirm({ kind: 'hide', item: selected })}
          onRestore={() => restore(selected)}
          onDelete={() => setConfirm({ kind: 'delete', item: selected })}
          onSaveReply={(text) => saveReply(selected.id, text)}
          onDeleteReply={() => deleteReply(selected.id)}
          onAddMemo={(text) => addMemo(selected.id, text)}
        />
      )}

      {confirm?.kind === 'hide' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>리뷰를 비노출 처리하시겠습니까?</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>작성자</span><span>{confirm.item.member}</span></div>
              <div className={styles.dialogSummaryRow}><span>상품</span><span>{productName(confirm.item.productCode)}</span></div>
            </div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 10 }} value={hideReason} onChange={(e) => setHideReason(e.target.value as HideReason)}>
              {HIDE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <input className={styles.searchInput} style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }} placeholder="상세 사유 (선택)" value={hideDetail} onChange={(e) => setHideDetail(e.target.value)} />
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>비노출</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>리뷰를 삭제 처리하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirm.item.member}'님의 리뷰가 삭제 처리됩니다. 사용자 화면에서는 삭제된 리뷰로 표시되며, 데이터는 감사 목적으로 보존됩니다.`}</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 16 }} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}>
              {DELETE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>삭제 처리</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkExposure' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 {confirm.expose ? '노출' : '비노출'} 처리</div>
            <div className={styles.dialogBody}>선택한 리뷰를 모두 {confirm.expose ? '노출' : '비노출'} 상태로 변경합니다.</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmAction}>{confirm.expose ? '노출' : '비노출'} 처리</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
