import { useMemo, useState } from 'react';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { BrandDetailDrawer } from './BrandDetailDrawer';
import { BrandEditorDrawer, type BrandFormData } from './BrandEditorDrawer';
import { BrandExposureOrderDrawer } from './BrandExposureOrderDrawer';
import {
  BRANDS,
  OWNERS,
  QUICK_FILTERS,
  STATUS_META,
  TODAY,
  computeIssues,
  matchesQuickFilter,
  newBrand,
  type Brand,
  type BrandStatus,
  type QuickFilter,
} from './brandsData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '1.4fr 90px 90px 90px 90px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '브랜드' },
  { label: '연결 상품', align: 'right' },
  { label: '사용 상태' },
  { label: '노출 상태' },
  { label: '수정일' },
  { label: '관리' },
];

type ConfirmState = { kind: 'toggleStatus'; item: Brand } | { kind: 'delete'; item: Brand } | { kind: 'bulkExposure'; expose: boolean } | null;

function history(item: Brand, action: string, before?: string, after?: string): Brand {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin01', action, before, after }],
  };
}

export function BrandsListPage() {
  const [brands, setBrands] = useState<Brand[]>(BRANDS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BrandStatus | ''>('');
  const [ownerFilter, setOwnerFilter] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<'new' | Brand | null>(null);
  const [showOrder, setShowOrder] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState('');

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    brands.forEach((b) => { map[b.id] = computeIssues(b, brands); });
    return map;
  }, [brands]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = brands.filter((b) => matchesQuickFilter(b, f)).length; });
    return c;
  }, [brands]);

  const filtered = useMemo(
    () =>
      brands.filter((b) => {
        if (!matchesQuickFilter(b, quickFilter)) return false;
        if (search && !`${b.name} ${b.code}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter && b.status !== statusFilter) return false;
        if (ownerFilter && b.owner !== ownerFilter) return false;
        return true;
      }),
    [brands, quickFilter, search, statusFilter, ownerFilter],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setStatusFilter('');
    setOwnerFilter('');
  };

  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((b) => b.id)));
  }

  function openDetail(id: string) {
    setDrawerId(id);
    setEditTarget(null);
    setMenuId(null);
  }
  function openEditor(target: 'new' | Brand) {
    setEditTarget(target);
    setDrawerId(null);
    setMenuId(null);
  }
  function closePanels() {
    setDrawerId(null);
    setEditTarget(null);
  }

  const selected = drawerId ? brands.find((b) => b.id === drawerId) ?? null : null;

  function submitEditor(form: BrandFormData) {
    const existing = editTarget !== 'new' ? editTarget : null;
    if (existing) {
      setBrands((prev) => prev.map((b) => (b.id === existing.id ? history({ ...b, ...form }, '브랜드 정보 수정') : b)));
      toastBriefly('브랜드를 저장했습니다.');
      openDetail(existing.id);
    } else {
      const base = newBrand(brands);
      const created: Brand = history({ ...base, ...form }, '브랜드 등록');
      setBrands((prev) => [created, ...prev]);
      toastBriefly('브랜드를 등록했습니다.');
      openDetail(created.id);
    }
  }

  function toggleExposure(item: Brand) {
    const updated = history({ ...item, exposure: !item.exposure }, '노출 상태 변경', item.exposure ? '노출' : '비노출', item.exposure ? '비노출' : '노출');
    setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    toastBriefly(item.exposure ? '비노출로 전환했습니다.' : '노출로 전환했습니다.');
  }

  function saveExposureOrder(orderedIds: string[]) {
    setBrands((prev) => prev.map((b) => {
      const idx = orderedIds.indexOf(b.id);
      if (idx === -1) return b;
      return { ...b, exposureOrder: (idx + 1) * 10 };
    }));
    setShowOrder(false);
    toastBriefly('노출 순서를 저장했습니다.');
  }

  function confirmAction() {
    if (!confirm) return;
    if (confirm.kind === 'toggleStatus') {
      const updated = history({ ...confirm.item, status: confirm.item.status === '사용중' ? '미사용' : '사용중' }, confirm.item.status === '사용중' ? '미사용 처리' : '사용 재개');
      setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toastBriefly(confirm.item.status === '사용중' ? '브랜드를 미사용 처리했습니다.' : '브랜드를 사용 재개했습니다.');
    } else if (confirm.kind === 'delete') {
      setBrands((prev) => prev.filter((b) => b.id !== confirm.item.id));
      setDrawerId(null);
      toastBriefly('브랜드를 삭제했습니다.');
    } else if (confirm.kind === 'bulkExposure') {
      setBrands((prev) => prev.map((b) => (selectedIds.includes(b.id) ? history({ ...b, exposure: confirm.expose }, confirm.expose ? '노출 상태 변경 (일괄)' : '비노출 상태 변경 (일괄)') : b)));
      toastBriefly(`${selectedIds.length}건을 ${confirm.expose ? '노출' : '비노출'} 처리했습니다.`);
      setSelectedIds([]);
    }
    setConfirm(null);
  }

  function rowMenuItems(b: Brand, status: BrandStatus) {
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(b.id) },
      { label: '수정', click: () => openEditor(b) },
    ];
    items.push({ sep: true });
    items.push({ label: status === '사용중' ? '미사용 처리' : '사용 재개', click: () => setConfirm({ kind: 'toggleStatus', item: b }) });
    if (b.productCodes.length === 0) items.push({ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: b }) });
    return items;
  }

  const rows: GridRow[] = filtered.map((b) => {
    const sm = STATUS_META[b.status];
    const issueList = issuesMap[b.id] ?? [];
    const cells: Cell[] = [
      { kind: 'titleWarn', title: `${b.name} · ${b.code}`, hasIssue: issueList.length > 0, issueTitle: issueList.join(' · ') },
      { kind: 'text', text: b.productCodes.length > 0 ? `${b.productCodes.length}개` : '-', color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'badge', text: b.status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: b.exposure ? '노출' : '비노출', color: b.exposure ? '#4338ca' : '#a1a1aa', size: '11.5px', weight: 600 },
      { kind: 'text', text: b.updatedAt.slice(5).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      {
        kind: 'rowMenu',
        align: 'right',
        detailLabel: '상세',
        onDetail: () => openDetail(b.id),
        open: menuId === b.id,
        onToggle: () => setMenuId(menuId === b.id ? null : b.id),
        items: rowMenuItems(b, b.status),
      },
    ];
    return {
      id: b.id,
      cells,
      onClick: () => openDetail(b.id),
      selected: selectedIds.includes(b.id),
      onToggleSelect: () => toggleSel(b.id),
    };
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>브랜드 목록</div>
            <div className={styles.subtitle}>상품에 연결되는 브랜드 정보를 관리합니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.resetBtn} style={{ border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, color: '#3f3f46' }} onClick={() => setShowOrder(true)}>노출 순서 관리</button>
            <button type="button" className={styles.createBtn} onClick={() => openEditor('new')}>+ 브랜드 등록</button>
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
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="브랜드명 또는 브랜드 코드 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>사용 상태</span><select aria-label="사용 상태" className={styles.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BrandStatus | '')}>
              <option value="">사용 상태 전체</option>
              <option value="사용중">사용중</option>
              <option value="미사용">미사용</option>
            </select></label>
            <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={styles.selectSm} value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
              <option value="">담당자 전체</option>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select></label>
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download onClick={() => toastBriefly('데이터 다운로드를 준비했습니다.')} />
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{selectedIds.length}건 선택됨</span>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkExposure', expose: true })}>일괄 노출</button>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkExposure', expose: false })}>일괄 비노출</button>
          <button type="button" className={styles.bulkBtn} data-grid-download="selected" onClick={() => toastBriefly(`${selectedIds.length}건을 다운로드했습니다.`)}>다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="820px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          empty={rows.length === 0}
          emptyText={brands.length === 0 ? '등록된 브랜드가 없습니다.' : quickFilter === '상품 미연결' ? '현재 상품이 연결되지 않은 브랜드가 없습니다.' : '검색 조건에 해당하는 브랜드가 없습니다.'}
          emptySubtext={brands.length === 0 ? '상품에 사용할 브랜드를 등록해 주세요.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={brands.length === 0 ? '+ 브랜드 등록' : '필터 초기화'}
          emptyActionClick={brands.length === 0 ? () => openEditor('new') : resetFilters}
        />
      </div>

      {selected && (
        <BrandDetailDrawer
          key={selected.id}
          brand={selected}
          all={brands}
          onClose={() => setDrawerId(null)}
          onEdit={() => openEditor(selected)}
          onToggleStatus={() => setConfirm({ kind: 'toggleStatus', item: selected })}
          onToggleExposure={() => toggleExposure(selected)}
          onRequestDelete={() => setConfirm({ kind: 'delete', item: selected })}
          onAddMemo={(text) => setBrands((prev) => prev.map((b) => (b.id === selected.id ? { ...b, memos: [...b.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text }] } : b)))}
        />
      )}

      {editTarget && (
        <BrandEditorDrawer
          key={editTarget === 'new' ? 'new' : editTarget.id}
          brand={editTarget === 'new' ? null : editTarget}
          onCancel={closePanels}
          onSubmit={submitEditor}
        />
      )}

      {showOrder && (
        <BrandExposureOrderDrawer brands={brands} onCancel={() => setShowOrder(false)} onSave={saveExposureOrder} />
      )}

      {confirm?.kind === 'toggleStatus' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{confirm.item.status === '사용중' ? '브랜드를 미사용 처리하시겠습니까?' : '브랜드 사용을 재개하시겠습니까?'}</div>
            <div className={styles.dialogBody}>{confirm.item.name}</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmAction}>{confirm.item.status === '사용중' ? '미사용 처리' : '사용 재개'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>브랜드를 삭제하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirm.item.name}'이(가) 삭제됩니다. 연결된 상품이 없는 브랜드만 삭제할 수 있습니다.`}</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkExposure' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 {confirm.expose ? '노출' : '비노출'} 처리</div>
            <div className={styles.dialogBody}>선택한 브랜드를 모두 {confirm.expose ? '노출' : '비노출'} 상태로 변경합니다.</div>
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
