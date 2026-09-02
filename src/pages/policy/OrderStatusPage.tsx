import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import styles from './OrderStatusPage.module.css';
import { OrderStatusDrawer } from './OrderStatusDrawer';
import { TransitionEditDialog } from './TransitionEditDialog';
import {
  BADGE_TONE_META,
  CHANGE_MODES,
  LIFECYCLE_STAGES,
  ORDER_STATUSES,
  QUICK_FILTERS,
  STATUS_MAP,
  TRANSITIONS,
  computeValidationWarnings,
  findTransition,
  incoming,
  matchesQuickFilter,
  newOrderStatus,
  outgoing,
  statusIssues,
  type ChangeMode,
  type LifecycleStage,
  type OrderStatusEntry,
  type QuickFilter,
  type ReasonRule,
} from './orderStatusData';

type View = 'list' | 'transitions' | 'preview';
type ConfirmState = { kind: 'deactivate'; item: OrderStatusEntry } | { kind: 'delete'; item: OrderStatusEntry } | null;

const COLUMNS = [
  { label: '순서' },
  { label: '상태명' },
  { label: '코드' },
  { label: '단계' },
  { label: '변경방식' },
  { label: '성격' },
  { label: '사용자 노출' },
  { label: '사용' },
  { label: '주문수', align: 'right' as const },
  { label: '관리', align: 'right' as const },
];

function natureLabel(s: OrderStatusEntry): { text: string; bg: string; fg: string } {
  if (s.isCancelled) return { text: '취소', bg: '#fef2f2', fg: '#dc2626' };
  if (s.isSuccess) return { text: '완료', bg: '#ecfdf5', fg: '#059669' };
  if (s.isTerminal) return { text: '종료', bg: '#f4f4f5', fg: '#52525b' };
  if (s.isException) return { text: '예외', bg: '#fffbeb', fg: '#b45309' };
  return { text: '진행', bg: '#eff6ff', fg: '#2563eb' };
}

function history(item: OrderStatusEntry, action: string, before?: string, after?: string): OrderStatusEntry {
  return {
    ...item,
    updatedAt: '2026-08-24',
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}`, at: '2026-08-24 14:00', by: 'admin01', action, before, after }],
  };
}

export function OrderStatusPage() {
  const [statuses, setStatuses] = useState(ORDER_STATUSES);
  const [transitions, setTransitions] = useState(TRANSITIONS);
  const [view, setView] = useState<View>('list');

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LifecycleStage | ''>('');
  const [modeFilter, setModeFilter] = useState<ChangeMode | ''>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerItem, setDrawerItem] = useState<OrderStatusEntry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [transitionEdit, setTransitionEdit] = useState<{ from: string; to: string } | null>(null);

  const warnings = useMemo(() => computeValidationWarnings(statuses, transitions), [statuses, transitions]);
  const statusName = (id: string) => STATUS_MAP[id]?.name ?? id;

  const sorted = useMemo(() => [...statuses].sort((a, b) => a.order - b.order), [statuses]);
  const filtered = useMemo(
    () =>
      sorted.filter((s) => {
        if (!matchesQuickFilter(s, quickFilter, warnings)) return false;
        if (search && !`${s.name} ${s.code}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (stageFilter && s.stage !== stageFilter) return false;
        if (modeFilter && s.changeMode !== modeFilter) return false;
        return true;
      }),
    [sorted, quickFilter, search, stageFilter, modeFilter, warnings],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const reset = () => {
    setKeyword('');
    setSearch('');
    setStageFilter('');
    setModeFilter('');
    setSelected([]);
  };
  const openCreate = () => {
    setDrawerItem(newOrderStatus());
    setIsNew(true);
  };
  const openDetail = (item: OrderStatusEntry) => {
    setDrawerItem(item);
    setIsNew(false);
  };

  const save = (item: OrderStatusEntry) => {
    if (isNew) {
      const saved = history({ ...item, order: statuses.length + 1, history: [] }, '상태 생성');
      setStatuses((current) => [...current, saved]);
      setDrawerItem(null);
      setIsNew(false);
      toastBriefly('주문 상태를 등록했습니다.');
    } else {
      const previous = statuses.find((s) => s.id === item.id);
      const saved = previous && previous.name !== item.name ? history(item, '상태명 변경', previous.name, item.name) : history(item, '설정 수정');
      setStatuses((current) => current.map((s) => (s.id === item.id ? saved : s)));
      setDrawerItem(saved);
      toastBriefly('설정을 저장했습니다.');
    }
  };

  const deactivate = (item: OrderStatusEntry) => {
    if (item.orderCount > 0) return toastBriefly(`현재 ${item.orderCount.toLocaleString()}건의 주문이 이 상태입니다. 처리 방안을 확인한 후 비활성화해 주세요.`);
    setConfirm({ kind: 'deactivate', item });
  };

  const confirmAction = () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      setStatuses((current) => current.filter((s) => s.id !== confirm.item.id));
      setTransitions((current) => current.filter((t) => t.from !== confirm.item.id && t.to !== confirm.item.id));
      setDrawerItem(null);
      toastBriefly('사용 이력이 없는 상태를 삭제했습니다.');
    } else {
      const updated = history({ ...confirm.item, active: false }, '상태 비활성화');
      setStatuses((current) => current.map((s) => (s.id === updated.id ? updated : s)));
      setDrawerItem(null);
      toastBriefly('상태를 비활성화했습니다. 신규 주문은 이 상태로 진입할 수 없습니다.');
    }
    setConfirm(null);
  };

  const activate = (item: OrderStatusEntry) => {
    const updated = history({ ...item, active: true }, '상태 활성화');
    setStatuses((current) => current.map((s) => (s.id === item.id ? updated : s)));
  };

  const move = (item: OrderStatusEntry, direction: -1 | 1) => {
    const ordered = [...statuses].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((s) => s.id === item.id);
    const swap = ordered[index + direction];
    if (!swap) return;
    setStatuses((current) => current.map((s) => (s.id === item.id ? { ...s, order: swap.order } : s.id === swap.id ? { ...s, order: item.order } : s)));
  };

  const saveTransition = (from: string, to: string, fields: { mode: ChangeMode; condition: string; reasonRule: ReasonRule; allowedRoles: string[] }) => {
    const existing = findTransition(from, to, transitions);
    if (existing) {
      setTransitions((current) => current.map((t) => (t.id === existing.id ? { ...t, ...fields } : t)));
    } else {
      setTransitions((current) => [...current, { id: `T-${Date.now()}`, from, to, ...fields }]);
    }
    setTransitionEdit(null);
    toastBriefly(`${statusName(from)} → ${statusName(to)} 전환을 저장했습니다.`);
  };

  const deleteTransition = (from: string, to: string) => {
    setTransitions((current) => current.filter((t) => !(t.from === from && t.to === to)));
    setTransitionEdit(null);
    toastBriefly('전환 설정을 삭제했습니다.');
  };

  const rows: GridRow[] = filtered.map((s) => {
    const issues = statusIssues(s, warnings);
    const nature = natureLabel(s);
    return {
      id: s.id,
      selected: selected.includes(s.id),
      onToggleSelect: () => setSelected((current) => (current.includes(s.id) ? current.filter((id) => id !== s.id) : [...current, s.id])),
      onClick: () => openDetail(s),
      bg: issues.length ? '#fffdf8' : undefined,
      cells: [
        { kind: 'text', text: String(s.order), size: '12px', color: '#a1a1aa', numeric: true },
        { kind: 'titleWarn', title: s.name, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'text', text: s.code, size: '11px', color: '#52525b', weight: 600 },
        { kind: 'badge', text: s.stage, bg: '#f4f4f5', fg: '#52525b' },
        { kind: 'text', text: s.changeMode, size: '12px', color: '#3f3f46' },
        { kind: 'badge', text: nature.text, bg: nature.bg, fg: nature.fg },
        { kind: 'badge', text: s.userVisible ? '노출' : '비노출', bg: s.userVisible ? '#eff6ff' : '#f4f4f5', fg: s.userVisible ? '#2563eb' : '#71717a' },
        { kind: 'statusDot', text: s.active ? '사용' : '비활성', dot: s.active ? '#10b981' : '#a1a1aa', fg: s.active ? '#047857' : '#71717a' },
        { kind: 'text', text: `${s.orderCount.toLocaleString()}건`, size: '12px', align: 'right', numeric: true },
        {
          kind: 'rowMenu',
          align: 'right',
          detailLabel: '상세',
          onDetail: () => openDetail(s),
          open: openMenu === s.id,
          onToggle: () => setOpenMenu(openMenu === s.id ? null : s.id),
          items: [
            { label: '수정', click: () => openDetail(s) },
            { label: '전환 설정 바로가기', click: () => setView('transitions') },
            { sep: true },
            s.active ? { label: '비활성화', fg: '#dc2626', click: () => deactivate(s) } : { label: '활성화', click: () => activate(s) },
            ...(s.orderCount === 0 ? [{ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: s }) }] : []),
          ],
        },
      ],
    };
  });

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>주문 상태 설정</h1>
            <p className={shared.subtitle}>주문의 처리 상태와 상태 전환 정책을 관리합니다.</p>
          </div>
          {view === 'list' && <button type="button" className={shared.createBtn} onClick={openCreate}>+ 상태 추가</button>}
        </div>

        <div className={styles.viewTabs}>
          <button type="button" className={`${styles.viewTabBtn} ${view === 'list' ? styles.viewTabActive : ''}`} onClick={() => setView('list')}>상태 목록</button>
          <button type="button" className={`${styles.viewTabBtn} ${view === 'transitions' ? styles.viewTabActive : ''}`} onClick={() => setView('transitions')}>상태 전환 설정</button>
          <button type="button" className={`${styles.viewTabBtn} ${view === 'preview' ? styles.viewTabActive : ''}`} onClick={() => setView('preview')}>
            Workflow 미리보기{warnings.length > 0 ? ` (${warnings.length})` : ''}
          </button>
        </div>

        {view === 'list' && (
          <>
            <div className={shared.quickFilters}>
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`}
                  onClick={() => { setQuickFilter(filter); setSelected([]); }}
                >
                  <span className={shared.qfLabel}>{filter}</span>
                  <span className={shared.qfCount}>{statuses.filter((s) => matchesQuickFilter(s, filter, warnings)).length}</span>
                </button>
              ))}
            </div>
            <div className={shared.filterBox}>
              <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
                <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="상태명 또는 상태 코드 검색" />
                <button type="submit" className={shared.searchBtn}>검색</button>
              </form>
              <div className={shared.filterRow2}>
                <label className="globalFilterField"><span>단계</span><select aria-label="단계" className={shared.selectSm} value={stageFilter} onChange={(e) => setStageFilter(e.target.value as LifecycleStage | '')}>
                  <option value="">전체 단계</option>
                  {LIFECYCLE_STAGES.map((stage) => <option key={stage}>{stage}</option>)}
                </select></label>
                <label className="globalFilterField"><span>변경방식</span><select aria-label="변경방식" className={shared.selectSm} value={modeFilter} onChange={(e) => setModeFilter(e.target.value as ChangeMode | '')}>
                  <option value="">전체 변경방식</option>
                  {CHANGE_MODES.map((mode) => <option key={mode}>{mode}</option>)}
                </select></label>
                <span className={shared.rowSpacer} />
                <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
              </div>
            </div>
          </>
        )}
      </div>

      {view === 'list' && (
        <>
          <div className={shared.gridWrap}>
            <div className={shared.resultRow}>
              <span className={shared.resultLabel}>총 {filtered.length}개 상태</span>
              <div className={shared.resultActions}>
                <button type="button" className={shared.downloadBtn} onClick={() => setOrderOpen(true)}>☰ 순서 관리</button>
              </div>
            </div>
            <DataGrid
              columns={COLUMNS}
              rows={rows}
              gridTemplate="40px 84px 126px 56px 68px 56px 66px 50px 62px 46px"
              minWidth="780px"
              selectable
              allSelected={filtered.length > 0 && filtered.every((s) => selected.includes(s.id))}
              onToggleAll={() => setSelected(filtered.every((s) => selected.includes(s.id)) ? [] : filtered.map((s) => s.id))}
              empty={filtered.length === 0}
              emptyText={quickFilter === '설정 오류' ? '현재 확인이 필요한 상태 설정이 없습니다.' : '검색 결과가 없습니다.'}
              emptySubtext="검색어나 필터 조건을 변경해 주세요."
              emptyActionLabel="필터 초기화"
              emptyActionClick={reset}
            />
          </div>
        </>
      )}

      {view === 'transitions' && (
        <div className={styles.matrixSection}>
          <div className={styles.matrixHead}>
            <h2>전환 매트릭스</h2>
            <p>행(From)에서 열(To)로의 전환 가능 여부입니다. 셀을 클릭해 전환 조건을 설정하세요.</p>
          </div>
          <div className={styles.matrixWrap}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th className={styles.matrixCornerCell} />
                  {sorted.map((to) => <th key={to.id} className={styles.matrixColHead}>{to.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {sorted.map((from) => (
                  <tr key={from.id}>
                    <th className={styles.matrixRowLabel}>{from.name}</th>
                    {sorted.map((to) => {
                      if (from.id === to.id) return <td key={to.id} className={styles.matrixCell}><div className={styles.matrixCellDiag} /></td>;
                      const t = findTransition(from.id, to.id, transitions);
                      const cellClass = !t ? styles.matrixCellBtn : t.mode === '수동' ? `${styles.matrixCellBtn} ${styles.matrixCellManual}` : t.mode === '자동' ? `${styles.matrixCellBtn} ${styles.matrixCellAuto}` : `${styles.matrixCellBtn} ${styles.matrixCellBoth}`;
                      return (
                        <td key={to.id} className={styles.matrixCell}>
                          <button type="button" className={cellClass} onClick={() => setTransitionEdit({ from: from.id, to: to.id })} title={t ? `${from.name} → ${to.name} · ${t.mode}` : `${from.name} → ${to.name} 전환 설정`}>
                            {t ? '✓' : ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.matrixLegend}>
              <span><i className={styles.matrixLegendDot} style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }} />수동</span>
              <span><i className={styles.matrixLegendDot} style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }} />자동</span>
              <span><i className={styles.matrixLegendDot} style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }} />수동+자동</span>
              <span><i className={styles.matrixLegendDot} style={{ background: '#fafafa', border: '1px solid rgba(0,0,0,.08)' }} />설정 없음</span>
            </div>
          </div>
        </div>
      )}

      {view === 'preview' && (
        <div className={styles.previewSection}>
          <div className={styles.previewHead}>
            <h2>주문 Workflow</h2>
            <p>취소·예외 상태를 제외한 정상 처리 흐름입니다. 상태를 클릭하면 상세로 이동합니다.</p>
          </div>
          <div className={styles.flowWrap}>
            <div className={styles.flowRow}>
              {sorted.filter((s) => !s.isCancelled && !s.isException).map((s, index, arr) => (
                <FlowNodeWithArrow key={s.id} status={s} isLast={index === arr.length - 1} onClick={() => openDetail(s)} />
              ))}
            </div>
          </div>

          <div className={styles.branchWrap}>
            <h3>예외 · 취소 흐름</h3>
            {sorted.filter((s) => s.isCancelled || s.isException).map((s) => {
              const inn = incoming(s.id, transitions);
              const out = outgoing(s.id, transitions);
              return (
                <div key={s.id} className={styles.branchRow}>
                  <span>{inn.map((t) => statusName(t.from)).join(', ') || '진입 경로 없음'}</span>
                  <span className={styles.branchArrow}>→</span>
                  <strong>{s.name}</strong>
                  {out.length === 0 && !s.isTerminal && <span className={`${styles.branchTag} ${styles.branchTagWarn}`}>다음 상태 없음</span>}
                  {s.isTerminal && <span className={styles.branchTag} style={{ background: '#f4f4f5', color: '#52525b' }}>종료</span>}
                </div>
              );
            })}
          </div>

          <div className={styles.warningPanel}>
            <h3>설정 검증</h3>
            {warnings.length === 0 && <div className={styles.warningOk}>✓ 발견된 설정 문제가 없습니다.</div>}
            {warnings.map((w) => (
              <div key={w.id} className={styles.warningItem}>
                <span>⚠ {w.message}</span>
                <button type="button" className={styles.warningLink} onClick={() => openDetail(STATUS_MAP[w.statusId])}>상태 보기</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {drawerItem && (
        <OrderStatusDrawer
          key={`${drawerItem.id}-${isNew}`}
          initial={drawerItem}
          isNew={isNew}
          startEditing={isNew}
          transitions={transitions}
          statusName={statusName}
          issues={statusIssues(drawerItem, warnings)}
          onClose={() => { setDrawerItem(null); setIsNew(false); }}
          onSave={save}
          onDeactivate={deactivate}
          onOpenTransitions={() => { setDrawerItem(null); setView('transitions'); }}
        />
      )}

      {transitionEdit && (
        <TransitionEditDialog
          fromLabel={statusName(transitionEdit.from)}
          toLabel={statusName(transitionEdit.to)}
          initial={findTransition(transitionEdit.from, transitionEdit.to, transitions)}
          onClose={() => setTransitionEdit(null)}
          onSave={(fields) => saveTransition(transitionEdit.from, transitionEdit.to, fields)}
          onDelete={findTransition(transitionEdit.from, transitionEdit.to, transitions) ? () => deleteTransition(transitionEdit.from, transitionEdit.to) : undefined}
        />
      )}

      {orderOpen && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setOrderOpen(false); }}>
          <div className={`${shared.dialogBox} ${styles.orderDialog}`}>
            <h2 className={shared.dialogTitle}>주문 상태 노출 순서</h2>
            <p className={shared.dialogBody}>목록에 표시되는 순서를 조정합니다. Workflow 전환 순서와는 별개입니다.</p>
            <div className={styles.orderList}>
              {sorted.map((s) => (
                <div key={s.id} className={styles.orderRow}>
                  <span className={styles.dragHandle}>☰</span>
                  <strong>{s.name}</strong>
                  <span>{s.stage}</span>
                  <button type="button" onClick={() => move(s, -1)}>↑</button>
                  <button type="button" onClick={() => move(s, 1)}>↓</button>
                </div>
              ))}
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setOrderOpen(false)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={() => { setOrderOpen(false); toastBriefly('노출 순서를 저장했습니다.'); }}>순서 저장</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>{confirm.kind === 'delete' ? '주문 상태 삭제' : '주문 상태 비활성화'}</h2>
            <p className={shared.dialogBody}>
              {confirm.kind === 'delete'
                ? '사용 이력이 없는 상태입니다. 삭제하면 복구할 수 없으며 관련 전환 설정도 함께 삭제됩니다.'
                : '신규 주문은 이 상태로 진입할 수 없습니다. 기존 주문의 상태 이력은 그대로 유지됩니다.'}
            </p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}><span>상태</span><strong>{confirm.item.name}</strong></div>
              <div className={shared.dialogSummaryRow}><span>현재 주문수</span><strong>{confirm.item.orderCount.toLocaleString()}건</strong></div>
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dangerButton} onClick={confirmAction}>{confirm.kind === 'delete' ? '삭제' : '비활성화'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}

function FlowNodeWithArrow({ status, isLast, onClick }: { status: OrderStatusEntry; isLast: boolean; onClick: () => void }) {
  const tone = BADGE_TONE_META[status.badgeTone];
  return (
    <>
      <button type="button" className={`${styles.flowNode} ${status.isSuccess ? styles.flowNodeTerminalSuccess : ''}`} onClick={onClick}>
        <span className={styles.flowNodeStage}>{status.stage}</span>
        <span className={styles.flowNodeName} style={{ color: tone.fg }}>{status.name}</span>
        <span className={styles.flowNodeCount}>{status.orderCount.toLocaleString()}건</span>
      </button>
      {!isLast && <span className={styles.flowArrow}>→</span>}
    </>
  );
}
