import { useMemo, useState } from 'react';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CouponDetailDrawer } from './CouponDetailDrawer';
import { CouponEditorDrawer, type CouponFormData } from './CouponEditorDrawer';
import {
  COUPONS,
  OWNERS,
  QUICK_FILTERS,
  STATUS_META,
  TODAY,
  cloneCoupon,
  computeIssues,
  computeStatus,
  discountSummary,
  issuePeriodSummary,
  matchesQuickFilter,
  newCoupon,
  targetSummary,
  validitySummary,
  type Coupon,
  type CouponApplyUnit,
  type IssueMethod,
  type QuickFilter,
} from './couponsData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '1.5fr 68px 130px 90px 110px 150px 100px 84px 56px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '쿠폰' },
  { label: '유형' },
  { label: '할인' },
  { label: '대상' },
  { label: '발급방식' },
  { label: '유효기간' },
  { label: '발급/사용', align: 'right' },
  { label: '상태' },
  { label: '관리', align: 'right' },
];

type ConfirmState =
  | { kind: 'stop'; item: Coupon }
  | { kind: 'delete'; item: Coupon }
  | { kind: 'toggleActive'; item: Coupon }
  | { kind: 'bulkDeactivate' }
  | { kind: 'bulkOwner' }
  | null;

function history(item: Coupon, action: string): Coupon {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin01', action }],
  };
}

export function CouponsListPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [applyUnitFilter, setApplyUnitFilter] = useState<CouponApplyUnit | ''>('');
  const [issueMethodFilter, setIssueMethodFilter] = useState<IssueMethod | ''>('');
  const [ownerFilter, setOwnerFilter] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<'new' | Coupon | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [bulkOwner, setBulkOwner] = useState(OWNERS[0]);
  const [toast, setToast] = useState('');

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    coupons.forEach((c) => { map[c.id] = computeIssues(c); });
    return map;
  }, [coupons]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = coupons.filter((cp) => matchesQuickFilter(cp, f)).length; });
    return c;
  }, [coupons]);

  const filtered = useMemo(
    () =>
      coupons.filter((c) => {
        if (!matchesQuickFilter(c, quickFilter)) return false;
        if (search && !`${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (applyUnitFilter && c.applyUnit !== applyUnitFilter) return false;
        if (issueMethodFilter && c.issueMethod !== issueMethodFilter) return false;
        if (ownerFilter && c.owner !== ownerFilter) return false;
        return true;
      }),
    [coupons, quickFilter, search, applyUnitFilter, issueMethodFilter, ownerFilter],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setApplyUnitFilter('');
    setIssueMethodFilter('');
    setOwnerFilter('');
  };

  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((c) => c.id)));
  }

  function openDetail(id: string) {
    setDrawerId(id);
    setEditTarget(null);
    setMenuId(null);
  }
  function openEditor(target: 'new' | Coupon) {
    setEditTarget(target);
    setDrawerId(null);
    setMenuId(null);
  }
  function closePanels() {
    setDrawerId(null);
    setEditTarget(null);
  }

  const selected = drawerId ? coupons.find((c) => c.id === drawerId) ?? null : null;

  function submitEditor(form: CouponFormData) {
    const existing = editTarget !== 'new' ? editTarget : null;
    if (existing) {
      setCoupons((prev) => prev.map((c) => (c.id === existing.id ? history({ ...c, ...form }, '쿠폰 정보 수정') : c)));
      toastBriefly('쿠폰을 저장했습니다.');
      openDetail(existing.id);
    } else {
      const base = newCoupon(coupons);
      const created: Coupon = history({ ...base, ...form }, '쿠폰 등록');
      setCoupons((prev) => [created, ...prev]);
      toastBriefly('쿠폰을 등록했습니다.');
      openDetail(created.id);
    }
  }

  function duplicate(item: Coupon) {
    const copy = cloneCoupon(item, coupons);
    setCoupons((prev) => [copy, ...prev]);
    toastBriefly(`'${item.name}'을(를) 복제했습니다.`);
    openDetail(copy.id);
  }

  function confirmAction() {
    if (!confirm) return;
    if (confirm.kind === 'stop') {
      const updated = history({ ...confirm.item, issueEnd: TODAY }, '쿠폰 발급 중지');
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toastBriefly('쿠폰 발급을 중지했습니다.');
    } else if (confirm.kind === 'delete') {
      setCoupons((prev) => prev.filter((c) => c.id !== confirm.item.id));
      setDrawerId(null);
      toastBriefly('쿠폰을 삭제했습니다.');
    } else if (confirm.kind === 'toggleActive') {
      const updated = history({ ...confirm.item, active: !confirm.item.active }, confirm.item.active ? '쿠폰 비활성화' : '쿠폰 활성화');
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toastBriefly(confirm.item.active ? '쿠폰을 비활성화했습니다.' : '쿠폰을 활성화했습니다.');
    } else if (confirm.kind === 'bulkDeactivate') {
      setCoupons((prev) => prev.map((c) => (selectedIds.includes(c.id) ? history({ ...c, active: false }, '쿠폰 비활성화 (일괄)') : c)));
      toastBriefly(`${selectedIds.length}건을 비활성화했습니다.`);
      setSelectedIds([]);
    } else if (confirm.kind === 'bulkOwner') {
      setCoupons((prev) => prev.map((c) => (selectedIds.includes(c.id) ? history({ ...c, owner: bulkOwner }, `담당자 변경 (일괄) → ${bulkOwner}`) : c)));
      toastBriefly(`${selectedIds.length}건의 담당자를 변경했습니다.`);
      setSelectedIds([]);
    }
    setConfirm(null);
  }

  function rowMenuItems(c: Coupon, status: ReturnType<typeof computeStatus>) {
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(c.id) },
    ];
    if (status !== '발급 종료') items.push({ label: '수정', click: () => openEditor(c) });
    items.push({ label: '복제', click: () => duplicate(c) });
    items.push({ sep: true });
    if (status === '발급중') items.push({ label: '발급 중지', fg: '#dc2626', click: () => setConfirm({ kind: 'stop', item: c }) });
    if (status === '발급 예정' || status === '비활성') items.push({ label: c.active ? '비활성화' : '활성화', click: () => setConfirm({ kind: 'toggleActive', item: c }) });
    if (c.issuedCount === 0) items.push({ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: c }) });
    return items;
  }

  const rows: GridRow[] = filtered.map((c) => {
    const status = computeStatus(c);
    const sm = STATUS_META[status];
    const issues = issuesMap[c.id] ?? [];
    const cells: Cell[] = [
      { kind: 'titleWarn', title: `${c.name} · ${c.code}`, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
      { kind: 'text', text: c.applyUnit, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: discountSummary(c), color: '#18181b', size: '12.5px', weight: 700 },
      { kind: 'text', text: targetSummary(c), color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: c.issueMethod, color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'text', text: `발급 ${issuePeriodSummary(c)} · ${validitySummary(c)}`, color: '#71717a', size: '11px', weight: 500 },
      { kind: 'text', text: `${c.issuedCount.toLocaleString('ko-KR')} / ${c.usedCount.toLocaleString('ko-KR')}`, color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'badge', text: status, bg: sm.bg, fg: sm.fg },
      {
        kind: 'rowMenu',
        align: 'right',
        detailLabel: '상세',
        onDetail: () => openDetail(c.id),
        open: menuId === c.id,
        onToggle: () => setMenuId(menuId === c.id ? null : c.id),
        items: rowMenuItems(c, status),
      },
    ];
    return {
      id: c.id,
      cells,
      onClick: () => openDetail(c.id),
      selected: selectedIds.includes(c.id),
      onToggleSelect: () => toggleSel(c.id),
    };
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>쿠폰 목록</div>
            <div className={styles.subtitle}>쿠폰의 할인 조건, 발급 및 사용 가능 상태를 관리합니다.</div>
          </div>
          <button type="button" className={styles.createBtn} onClick={() => openEditor('new')}>+ 쿠폰 등록</button>
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
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="쿠폰명 또는 쿠폰 코드 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>유형</span><select aria-label="유형" className={styles.selectSm} value={applyUnitFilter} onChange={(e) => setApplyUnitFilter(e.target.value as CouponApplyUnit | '')}>
              <option value="">유형 전체</option>
              <option value="상품">상품 쿠폰</option>
              <option value="주문">주문 쿠폰</option>
            </select></label>
            <label className="globalFilterField"><span>발급방식</span><select aria-label="발급방식" className={styles.selectSm} value={issueMethodFilter} onChange={(e) => setIssueMethodFilter(e.target.value as IssueMethod | '')}>
              <option value="">발급방식 전체</option>
              <option value="관리자 발급">관리자 발급</option>
              <option value="자동 발급">자동 발급</option>
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
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkOwner' })}>담당자 변경</button>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkDeactivate' })}>비활성화</button>
          <button type="button" className={styles.bulkBtn} data-grid-download="selected" onClick={() => toastBriefly(`${selectedIds.length}건을 다운로드했습니다.`)}>다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1120px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          empty={rows.length === 0}
          emptyText={coupons.length === 0 ? '등록된 쿠폰이 없습니다.' : quickFilter === '검토 필요' ? '현재 확인이 필요한 쿠폰 설정이 없습니다.' : '검색 조건에 해당하는 쿠폰이 없습니다.'}
          emptySubtext={coupons.length === 0 ? '할인 쿠폰을 등록해 보세요.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={coupons.length === 0 ? '+ 쿠폰 등록' : '필터 초기화'}
          emptyActionClick={coupons.length === 0 ? () => openEditor('new') : resetFilters}
        />
      </div>

      {selected && (
        <CouponDetailDrawer
          key={selected.id}
          coupon={selected}
          issues={issuesMap[selected.id] ?? []}
          onClose={() => setDrawerId(null)}
          onEdit={() => openEditor(selected)}
          onDuplicate={() => duplicate(selected)}
          onToggleActive={() => setConfirm({ kind: 'toggleActive', item: selected })}
          onRequestStop={() => setConfirm({ kind: 'stop', item: selected })}
          onRequestDelete={() => setConfirm({ kind: 'delete', item: selected })}
        />
      )}

      {editTarget && (
        <CouponEditorDrawer
          key={editTarget === 'new' ? 'new' : editTarget.id}
          coupon={editTarget === 'new' ? null : editTarget}
          onCancel={closePanels}
          onSubmit={submitEditor}
        />
      )}

      {confirm?.kind === 'stop' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>쿠폰 발급을 중지하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirm.item.name}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>현재 발급</span><span>{confirm.item.issuedCount.toLocaleString('ko-KR')}장</span></div>
              <div className={styles.dialogSummaryRow}><span>사용</span><span>{confirm.item.usedCount.toLocaleString('ko-KR')}장</span></div>
            </div>
            <div className={styles.dialogBody} style={{ marginBottom: 0 }}>신규 발급은 중단되며, 이미 발급된 쿠폰의 사용 가능 여부는 기존 유효기간 정책을 따릅니다.</div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>발급 중지</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>쿠폰을 삭제하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirm.item.name}'이(가) 삭제됩니다. 발급 이력이 없는 쿠폰만 삭제할 수 있습니다.`}</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'toggleActive' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{confirm.item.active ? '쿠폰을 비활성화하시겠습니까?' : '쿠폰을 활성화하시겠습니까?'}</div>
            <div className={styles.dialogBody}>
              {confirm.item.active ? '비활성화하면 발급 기간과 관계없이 신규 발급이 즉시 중단됩니다.' : '활성화하면 발급 기간 조건에 따라 다시 발급될 수 있습니다.'}
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmAction}>{confirm.item.active ? '비활성화' : '활성화'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkDeactivate' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 비활성화</div>
            <div className={styles.dialogBody}>선택한 쿠폰을 모두 비활성화합니다.</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>비활성화</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkOwner' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 담당자 변경</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 16 }} value={bulkOwner} onChange={(e) => setBulkOwner(e.target.value)}>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmAction}>변경</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
