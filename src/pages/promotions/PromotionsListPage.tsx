import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { PromotionDetailDrawer } from './PromotionDetailDrawer';
import { PromotionEditorDrawer, type PromotionFormData } from './PromotionEditorDrawer';
import {
  OWNERS,
  PROMOTIONS,
  QUICK_FILTERS,
  STATUS_META,
  TODAY,
  clonePromotion,
  computeIssues,
  computeStatus,
  discountSummary,
  matchesQuickFilter,
  newPromotion,
  periodSummary,
  targetSummary,
  type ApplyUnit,
  type DiscountMethod,
  type Promotion,
  type QuickFilter,
  type TargetType,
} from './promotionsData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '1.5fr 44px 100px 64px 150px 40px 76px 58px 44px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '프로모션' },
  { label: '유형' },
  { label: '대상' },
  { label: '할인' },
  { label: '기간' },
  { label: '중복' },
  { label: '상태' },
  { label: '적용건수', align: 'right' },
  { label: '관리', align: 'right' },
];

type ConfirmState =
  | { kind: 'end'; item: Promotion }
  | { kind: 'delete'; item: Promotion }
  | { kind: 'toggleActive'; item: Promotion }
  | { kind: 'bulkDeactivate' }
  | { kind: 'bulkOwner' }
  | null;

function history(item: Promotion, action: string): Promotion {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin01', action }],
  };
}

export function PromotionsListPage() {
  const [searchParams] = useSearchParams();
  const [promotions, setPromotions] = useState<Promotion[]>(PROMOTIONS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [applyUnitFilter, setApplyUnitFilter] = useState<ApplyUnit | ''>('');
  const [discountMethodFilter, setDiscountMethodFilter] = useState<DiscountMethod | ''>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<TargetType | ''>('');
  const [ownerFilter, setOwnerFilter] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<'new' | Promotion | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [bulkOwner, setBulkOwner] = useState(OWNERS[0]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;
    const match = promotions.find((p) => p.code === code);
    if (match) setDrawerId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    promotions.forEach((p) => { map[p.id] = computeIssues(p, promotions); });
    return map;
  }, [promotions]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = promotions.filter((p) => matchesQuickFilter(p, f, issuesMap)).length; });
    return c;
  }, [promotions, issuesMap]);

  const filtered = useMemo(
    () =>
      promotions.filter((p) => {
        if (!matchesQuickFilter(p, quickFilter, issuesMap)) return false;
        if (search && !`${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (applyUnitFilter && p.applyUnit !== applyUnitFilter) return false;
        if (discountMethodFilter && p.discountMethod !== discountMethodFilter) return false;
        if (targetTypeFilter && p.targetType !== targetTypeFilter) return false;
        if (ownerFilter && p.owner !== ownerFilter) return false;
        return true;
      }),
    [promotions, quickFilter, issuesMap, search, applyUnitFilter, discountMethodFilter, targetTypeFilter, ownerFilter],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setApplyUnitFilter('');
    setDiscountMethodFilter('');
    setTargetTypeFilter('');
    setOwnerFilter('');
  };

  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((p) => p.id)));
  }

  function openDetail(id: string) {
    setDrawerId(id);
    setEditTarget(null);
    setMenuId(null);
  }
  function openEditor(target: 'new' | Promotion) {
    setEditTarget(target);
    setDrawerId(null);
    setMenuId(null);
  }
  function closePanels() {
    setDrawerId(null);
    setEditTarget(null);
  }

  const selected = drawerId ? promotions.find((p) => p.id === drawerId) ?? null : null;

  function submitEditor(form: PromotionFormData) {
    const existing = editTarget !== 'new' ? editTarget : null;
    if (existing) {
      setPromotions((prev) => prev.map((p) => (p.id === existing.id ? history({ ...p, ...form }, '프로모션 정보 수정') : p)));
      toastBriefly('프로모션을 저장했습니다.');
      openDetail(existing.id);
    } else {
      const base = newPromotion(promotions);
      const created: Promotion = history({ ...base, ...form }, '프로모션 등록');
      setPromotions((prev) => [created, ...prev]);
      toastBriefly('프로모션을 등록했습니다.');
      openDetail(created.id);
    }
  }

  function duplicate(item: Promotion) {
    const copy = clonePromotion(item, promotions);
    setPromotions((prev) => [copy, ...prev]);
    toastBriefly(`'${item.name}'을(를) 복제했습니다.`);
    openDetail(copy.id);
  }

  function confirmAction() {
    if (!confirm) return;
    if (confirm.kind === 'end') {
      const updated = history({ ...confirm.item, endDate: TODAY }, '프로모션 종료');
      setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toastBriefly('프로모션을 종료했습니다.');
    } else if (confirm.kind === 'delete') {
      setPromotions((prev) => prev.filter((p) => p.id !== confirm.item.id));
      setDrawerId(null);
      toastBriefly('프로모션을 삭제했습니다.');
    } else if (confirm.kind === 'toggleActive') {
      const updated = history({ ...confirm.item, active: !confirm.item.active }, confirm.item.active ? '프로모션 비활성화' : '프로모션 활성화');
      setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toastBriefly(confirm.item.active ? '프로모션을 비활성화했습니다.' : '프로모션을 활성화했습니다.');
    } else if (confirm.kind === 'bulkDeactivate') {
      setPromotions((prev) => prev.map((p) => (selectedIds.includes(p.id) ? history({ ...p, active: false }, '프로모션 비활성화 (일괄)') : p)));
      toastBriefly(`${selectedIds.length}건을 비활성화했습니다.`);
      setSelectedIds([]);
    } else if (confirm.kind === 'bulkOwner') {
      setPromotions((prev) => prev.map((p) => (selectedIds.includes(p.id) ? history({ ...p, owner: bulkOwner }, `담당자 변경 (일괄) → ${bulkOwner}`) : p)));
      toastBriefly(`${selectedIds.length}건의 담당자를 변경했습니다.`);
      setSelectedIds([]);
    }
    setConfirm(null);
  }

  function rowMenuItems(p: Promotion, status: ReturnType<typeof computeStatus>) {
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(p.id) },
    ];
    if (status !== '종료') items.push({ label: '수정', click: () => openEditor(p) });
    items.push({ label: '복제', click: () => duplicate(p) });
    items.push({ sep: true });
    if (status === '진행중') items.push({ label: '종료', fg: '#dc2626', click: () => setConfirm({ kind: 'end', item: p }) });
    if (status === '진행 예정' || status === '비활성') items.push({ label: p.active ? '비활성화' : '활성화', click: () => setConfirm({ kind: 'toggleActive', item: p }) });
    if (p.appliedCount === 0) items.push({ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: p }) });
    return items;
  }

  const rows: GridRow[] = filtered.map((p) => {
    const status = computeStatus(p);
    const sm = STATUS_META[status];
    const issues = issuesMap[p.id] ?? [];
    const cells: Cell[] = [
      { kind: 'titleWarn', title: `${p.name} · ${p.code}`, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
      { kind: 'text', text: p.applyUnit, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: targetSummary(p), color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: discountSummary(p), color: '#18181b', size: '12.5px', weight: 700 },
      { kind: 'text', text: periodSummary(p), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: p.stackPromotion, color: p.stackPromotion === '가능' ? '#059669' : '#a1a1aa', size: '11.5px', weight: 600 },
      { kind: 'badge', text: status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: p.appliedCount > 0 ? p.appliedCount.toLocaleString('ko-KR') : '-', color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      {
        kind: 'rowMenu',
        align: 'right',
        detailLabel: '상세',
        onDetail: () => openDetail(p.id),
        open: menuId === p.id,
        onToggle: () => setMenuId(menuId === p.id ? null : p.id),
        items: rowMenuItems(p, status),
      },
    ];
    return {
      id: p.id,
      cells,
      onClick: () => openDetail(p.id),
      selected: selectedIds.includes(p.id),
      onToggleSelect: () => toggleSel(p.id),
    };
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>프로모션 목록</div>
            <div className={styles.subtitle}>상품, 주문 및 회원을 대상으로 적용되는 할인 프로모션을 관리합니다.</div>
          </div>
          <button type="button" className={styles.createBtn} onClick={() => openEditor('new')}>+ 프로모션 등록</button>
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
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="프로모션명 또는 코드 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>유형</span><select aria-label="유형" className={styles.selectSm} value={applyUnitFilter} onChange={(e) => setApplyUnitFilter(e.target.value as ApplyUnit | '')}>
              <option value="">유형 전체</option>
              <option value="상품">상품 할인</option>
              <option value="주문">주문 할인</option>
            </select></label>
            <label className="globalFilterField"><span>할인방식</span><select aria-label="할인방식" className={styles.selectSm} value={discountMethodFilter} onChange={(e) => setDiscountMethodFilter(e.target.value as DiscountMethod | '')}>
              <option value="">할인방식 전체</option>
              <option value="정률">정률</option>
              <option value="정액">정액</option>
            </select></label>
            <label className="globalFilterField"><span>적용대상</span><select aria-label="적용대상" className={styles.selectSm} value={targetTypeFilter} onChange={(e) => setTargetTypeFilter(e.target.value as TargetType | '')}>
              <option value="">적용대상 전체</option>
              <option value="전체">전체</option>
              <option value="특정 상품">특정 상품</option>
              <option value="특정 카테고리">특정 카테고리</option>
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
            <ExcelDownloadButton type="button" data-grid-download onClick={() => toastBriefly('다운로드를 준비했습니다.')} />
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
          minWidth="920px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          empty={rows.length === 0}
          emptyText={promotions.length === 0 ? '등록된 프로모션이 없습니다.' : quickFilter === '검토 필요' ? '현재 확인이 필요한 프로모션이 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext={promotions.length === 0 ? '할인 프로모션을 등록해 보세요.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={promotions.length === 0 ? '+ 프로모션 등록' : '필터 초기화'}
          emptyActionClick={promotions.length === 0 ? () => openEditor('new') : resetFilters}
        />
      </div>

      {selected && (
        <PromotionDetailDrawer
          key={selected.id}
          promotion={selected}
          issues={issuesMap[selected.id] ?? []}
          onClose={() => setDrawerId(null)}
          onEdit={() => openEditor(selected)}
          onDuplicate={() => duplicate(selected)}
          onToggleActive={() => setConfirm({ kind: 'toggleActive', item: selected })}
          onRequestEnd={() => setConfirm({ kind: 'end', item: selected })}
          onRequestDelete={() => setConfirm({ kind: 'delete', item: selected })}
        />
      )}

      {editTarget && (
        <PromotionEditorDrawer
          key={editTarget === 'new' ? 'new' : editTarget.id}
          promotion={editTarget === 'new' ? null : editTarget}
          onCancel={closePanels}
          onSubmit={submitEditor}
        />
      )}

      {confirm?.kind === 'end' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>프로모션을 종료하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirm.item.name}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>현재 적용</span><span>{confirm.item.appliedCount.toLocaleString('ko-KR')}건</span></div>
              <div className={styles.dialogSummaryRow}><span>총 할인</span><span>{confirm.item.appliedAmount.toLocaleString('ko-KR')}원</span></div>
            </div>
            <div className={styles.dialogBody} style={{ marginBottom: 0 }}>종료 후 신규 주문에는 적용되지 않습니다.</div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>종료</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>프로모션을 삭제하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirm.item.name}'이(가) 삭제됩니다. 적용 이력이 없는 프로모션만 삭제할 수 있습니다.`}</div>
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
            <div className={styles.dialogTitle}>{confirm.item.active ? '프로모션을 비활성화하시겠습니까?' : '프로모션을 활성화하시겠습니까?'}</div>
            <div className={styles.dialogBody}>
              {confirm.item.active ? '비활성화하면 적용기간과 관계없이 즉시 적용이 중단됩니다.' : '활성화하면 적용기간 조건에 따라 다시 적용될 수 있습니다.'}
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
            <div className={styles.dialogBody}>선택한 프로모션을 모두 비활성화합니다.</div>
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
