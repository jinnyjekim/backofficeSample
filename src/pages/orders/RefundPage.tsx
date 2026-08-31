import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import drawerShared from '../ops/opsDrawerShared.module.css';
import styles from './RefundPage.module.css';
import { RefundDrawer } from './RefundDrawer';
import {
  INITIAL_REFUNDS,
  OWNERS,
  QUICK_FILTERS,
  REJECT_REASONS,
  STATUS_META,
  canApprove,
  computeFinalAmount,
  fmtWon,
  itemsAmount,
  matchesQuickFilter,
  type AdjustmentType,
  type QuickFilter,
  type RefundRequest,
  type RefundStatus,
  type RefundType,
} from './refundData';

const TODAY = '2026-08-25';
const NOW = `${TODAY} 15:00`;

type Modal =
  | { kind: 'assign'; ids: string[] }
  | { kind: 'approve'; item: RefundRequest }
  | { kind: 'reject'; item: RefundRequest }
  | { kind: 'retry'; item: RefundRequest }
  | { kind: 'reconsider'; item: RefundRequest }
  | null;

function history(item: RefundRequest, action: string, by: string, before?: string, after?: string): RefundRequest {
  return { ...item, history: [...item.history, { id: `H-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: NOW, by, action, before, after }] };
}

export function RefundPage() {
  const [refunds, setRefunds] = useState(INITIAL_REFUNDS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [searchBy, setSearchBy] = useState<'전체' | '환불번호' | '주문번호' | '회원'>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<RefundType | ''>('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<Modal>(null);
  const [assignOwner, setAssignOwner] = useState('admin01');
  const [approveMemo, setApproveMemo] = useState('');
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectDetail, setRejectDetail] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reconsiderReason, setReconsiderReason] = useState('');
  const [toast, setToast] = useState('');

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const filtered = useMemo(
    () =>
      refunds.filter((r) => {
        if (!matchesQuickFilter(r, quickFilter)) return false;
        if (search) {
          const q = search.toLowerCase();
          const hit =
            (searchBy === '전체' && (r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q))) ||
            (searchBy === '환불번호' && r.id.toLowerCase().includes(q)) ||
            (searchBy === '주문번호' && r.orderId.toLowerCase().includes(q)) ||
            (searchBy === '회원' && r.customer.toLowerCase().includes(q));
          if (!hit) return false;
        }
        if (statusFilter && r.status !== statusFilter) return false;
        if (typeFilter && r.refundType !== typeFilter) return false;
        if (ownerFilter && r.owner !== ownerFilter) return false;
        return true;
      }),
    [refunds, quickFilter, search, searchBy, statusFilter, typeFilter, ownerFilter],
  );

  const reset = () => {
    setKeyword('');
    setSearch('');
    setSearchBy('전체');
    setStatusFilter('');
    setTypeFilter('');
    setOwnerFilter('');
  };

  const update = (id: string, updater: (r: RefundRequest) => RefundRequest) => {
    setRefunds((current) => current.map((r) => (r.id === id ? updater(r) : r)));
  };

  const drawerItem = drawerId ? refunds.find((r) => r.id === drawerId) ?? null : null;

  const openDetail = (id: string) => setDrawerId(id);

  const startReview = (id: string) => {
    update(id, (r) => {
      const owner = r.owner === '미배정' ? 'admin01' : r.owner;
      return history({ ...r, status: '검토중', owner }, '검토 시작', 'admin01');
    });
    toastBriefly('검토를 시작했습니다.');
  };

  const execute = (id: string) => {
    update(id, (r) => history({ ...r, status: '처리중', executedAt: NOW, pgTxId: `TX-R-${id.replace('REF-', '')}` }, 'PG 환불 요청', 'admin01'));
    toastBriefly('결제수단으로 환불 요청을 전송했습니다.');
  };

  const poll = (id: string) => {
    update(id, (r) => history({ ...r, status: '완료', completedAt: NOW, externalRefundNo: `R-${id.replace('REF-', '')}` }, '환불 완료', 'admin01'));
    toastBriefly('환불이 완료되었습니다.');
  };

  const addAdjustment = (id: string, type: AdjustmentType, amount: number, reason: string) => {
    update(id, (r) => history(
      { ...r, adjustments: [...r.adjustments, { id: `A-${Date.now()}`, type, amount, reason, by: 'admin01', at: NOW }] },
      '조정 항목 추가',
      'admin01',
      undefined,
      `${type} ${amount > 0 ? '+' : ''}${amount.toLocaleString('ko-KR')}원 (${reason})`,
    ));
  };

  const removeAdjustment = (id: string, adjId: string) => {
    update(id, (r) => history({ ...r, adjustments: r.adjustments.filter((a) => a.id !== adjId) }, '조정 항목 삭제', 'admin01'));
  };

  const addMemo = (id: string, text: string) => {
    update(id, (r) => ({ ...r, memos: [...r.memos, { id: `M-${Date.now()}`, at: NOW, by: 'admin01', text }] }));
  };

  const toggleSelect = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => setSelected((current) => (current.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id))));

  const runBulkAssign = () => {
    if (modal?.kind !== 'assign') return;
    setRefunds((current) => current.map((r) => (modal.ids.includes(r.id) ? history({ ...r, owner: assignOwner }, '담당자 지정', 'admin01', undefined, assignOwner) : r)));
    toastBriefly(`${modal.ids.length}건에 담당자를 지정했습니다.`);
    setModal(null);
    setSelected(new Set());
  };

  const runBulkReviewStart = () => {
    const targets = [...selected].filter((id) => refunds.find((r) => r.id === id)?.status === '요청');
    if (targets.length === 0) {
      toastBriefly('선택한 건 중 검토를 시작할 수 있는 요청 건이 없습니다.');
      return;
    }
    setRefunds((current) => current.map((r) => (targets.includes(r.id) ? history({ ...r, status: '검토중', owner: r.owner === '미배정' ? 'admin01' : r.owner }, '검토 시작 (일괄)', 'admin01') : r)));
    toastBriefly(`${targets.length}건의 검토를 시작했습니다.`);
    setSelected(new Set());
  };

  const runApprove = () => {
    if (modal?.kind !== 'approve') return;
    const id = modal.item.id;
    update(id, (r) => history({ ...r, status: '승인', approvedAt: NOW, approvedBy: 'admin01', approvalMemo: approveMemo.trim() || undefined }, '환불 승인', 'admin01'));
    toastBriefly('환불을 승인했습니다.');
    setModal(null);
    setApproveMemo('');
  };

  const runReject = () => {
    if (modal?.kind !== 'reject') return;
    const id = modal.item.id;
    update(id, (r) => history({ ...r, status: '반려', rejectReason, rejectDetail: rejectDetail.trim(), rejectedAt: NOW, rejectedBy: 'admin01', notifyCustomer }, '환불 반려', 'admin01', undefined, rejectReason));
    toastBriefly('환불을 반려했습니다.');
    setModal(null);
    setRejectDetail('');
    setNotifyCustomer(true);
  };

  const runRetry = () => {
    if (modal?.kind !== 'retry') return;
    const id = modal.item.id;
    update(id, (r) => history({ ...r, status: '처리중', executedAt: NOW, pgTxId: `TX-R-${id.replace('REF-', '')}-2` }, '환불 재시도 · PG 환불 재요청', 'admin01'));
    toastBriefly('환불을 재시도합니다.');
    setModal(null);
  };

  const runReconsider = () => {
    if (modal?.kind !== 'reconsider') return;
    const id = modal.item.id;
    update(id, (r) => history({ ...r, status: '검토중' }, '재검토 전환', 'admin01', undefined, reconsiderReason.trim() || undefined));
    toastBriefly('재검토 상태로 전환했습니다.');
    setModal(null);
    setReconsiderReason('');
  };

  const rows: GridRow[] = filtered.map((r) => {
    const sm = STATUS_META[r.status];
    const finalAmount = computeFinalAmount(r);
    return {
      id: r.id,
      onClick: () => openDetail(r.id),
      selected: selected.has(r.id),
      onToggleSelect: () => toggleSelect(r.id),
      cells: [
        { kind: 'text', text: r.id, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: r.orderId, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: r.customer, size: '12px', color: '#3f3f46' },
        { kind: 'badge', text: r.refundType === '전체 환불' ? '전체' : '부분', bg: r.refundType === '전체 환불' ? '#eef2ff' : '#f4f4f5', fg: r.refundType === '전체 환불' ? '#4338ca' : '#71717a' },
        { kind: 'text', text: fmtWon(itemsAmount(r.items)), size: '12px', align: 'right', numeric: true, color: '#3f3f46' },
        { kind: 'text', text: fmtWon(finalAmount), size: '12.5px', weight: 600, align: 'right', numeric: true, color: '#18181b' },
        { kind: 'statusDot', text: r.status, dot: sm.dot, fg: sm.fg },
        { kind: 'text', text: r.requestedAt.slice(5, 10).replace('-', '.'), size: '11.5px', color: '#71717a', numeric: true },
        { kind: 'text', text: r.owner, size: '12px', color: r.owner === '미배정' ? '#d97706' : '#3f3f46' },
        {
          kind: 'rowMenu',
          align: 'right',
          detailLabel: '상세',
          onDetail: () => openDetail(r.id),
          open: openMenu === r.id,
          onToggle: () => setOpenMenu(openMenu === r.id ? null : r.id),
          items: [
            { label: '상세 보기', click: () => openDetail(r.id) },
            ...(r.status === '요청' ? [{ label: '검토 시작', click: () => startReview(r.id) }, { label: '담당자 지정', click: () => setModal({ kind: 'assign', ids: [r.id] }) }] : []),
            ...(r.status === '검토중' ? [{ label: '승인', click: () => setModal({ kind: 'approve', item: r }) }, { label: '반려', fg: '#dc2626', click: () => setModal({ kind: 'reject', item: r }) }] : []),
            ...(r.status === '승인' ? [{ label: '환불 실행', click: () => execute(r.id) }] : []),
            ...(r.status === '처리중' ? [{ label: '상태 재조회', click: () => poll(r.id) }] : []),
            ...(r.status === '실패' ? [{ label: '상태 재조회', click: () => poll(r.id) }, { label: '재시도', click: () => setModal({ kind: 'retry', item: r }) }] : []),
            ...(r.status === '반려' ? [{ label: '재검토', click: () => setModal({ kind: 'reconsider', item: r }) }] : []),
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
            <h1 className={shared.title}>환불 관리</h1>
            <p className={shared.subtitle}>주문에서 발생한 환불 요청과 처리 상태를 관리합니다.</p>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`}
              onClick={() => setQuickFilter(filter)}
            >
              <span className={shared.qfLabel}>{filter}</span>
              <span className={shared.qfCount}>{refunds.filter((r) => matchesQuickFilter(r, filter)).length}</span>
            </button>
          ))}
        </div>

        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm} value={searchBy} onChange={(e) => setSearchBy(e.target.value as typeof searchBy)}>
              <option value="전체">전체</option>
              <option value="환불번호">환불번호</option>
              <option value="주문번호">주문번호</option>
              <option value="회원">회원</option>
            </select></label>
            <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="환불번호 / 주문번호 / 회원 검색" />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>상태</span><select aria-label="상태" className={shared.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RefundStatus | '')}>
              <option value="">전체 상태</option>
              <option>요청</option><option>검토중</option><option>승인</option><option>처리중</option><option>완료</option><option>반려</option><option>실패</option>
            </select></label>
            <label className="globalFilterField"><span>유형</span><select aria-label="유형" className={shared.selectSm} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as RefundType | '')}>
              <option value="">전체 유형</option>
              <option value="전체 환불">전체 환불</option>
              <option value="부분 환불">부분 환불</option>
            </select></label>
            <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={shared.selectSm} value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
              <option value="">전체 담당자</option>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select></label>
            <span className={shared.rowSpacer} />
            <button type="button" className={shared.resetBtn} onClick={reset}>초기화</button>
          </div>
        </div>
      </div>

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}건</span>
        </div>
      </div>

      {selected.size > 0 && (
        <div className={shared.bulkBar}>
          <span className={shared.bulkLabel}>{selected.size}건 선택됨</span>
          <button type="button" className={shared.bulkBtn} onClick={() => setModal({ kind: 'assign', ids: [...selected] })}>담당자 지정</button>
          <button type="button" className={shared.bulkBtn} onClick={runBulkReviewStart}>일괄 검토 시작</button>
          <button type="button" className={shared.bulkBtn} data-grid-download="selected" onClick={() => toastBriefly('다운로드를 준비했습니다.')}>다운로드</button>
        </div>
      )}

      <div className={shared.gridWrap} style={{ marginTop: 0 }}>
        <DataGrid
          columns={[
            { label: '환불번호' }, { label: '주문번호' }, { label: '고객' }, { label: '유형' },
            { label: '요청금액', align: 'right' as const }, { label: '환불금액', align: 'right' as const },
            { label: '상태' }, { label: '요청일' }, { label: '담당자' }, { label: '관리', align: 'right' as const },
          ]}
          rows={rows}
          gridTemplate="100px 90px 80px 60px 100px 100px 84px 66px 80px 70px"
          minWidth="1180px"
          selectable
          allSelected={filtered.length > 0 && selected.size === filtered.length}
          onToggleAll={toggleAll}
          empty={filtered.length === 0}
          emptyText={quickFilter === '처리 필요' ? '현재 처리해야 할 환불 요청이 없습니다.' : quickFilter === '실패' ? '현재 환불 실패 건이 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext="검색어나 필터 조건을 변경해 주세요."
          emptyActionLabel="필터 초기화"
          emptyActionClick={reset}
        />
      </div>

      {drawerItem && (
        <RefundDrawer
          key={drawerItem.id}
          refund={drawerItem}
          all={refunds}
          onClose={() => setDrawerId(null)}
          onAddAdjustment={(type, amount, reason) => addAdjustment(drawerItem.id, type, amount, reason)}
          onRemoveAdjustment={(adjId) => removeAdjustment(drawerItem.id, adjId)}
          onAddMemo={(text) => addMemo(drawerItem.id, text)}
          onStartReview={() => startReview(drawerItem.id)}
          onAssignClick={() => setModal({ kind: 'assign', ids: [drawerItem.id] })}
          onApproveClick={() => setModal({ kind: 'approve', item: drawerItem })}
          onRejectClick={() => setModal({ kind: 'reject', item: drawerItem })}
          onExecute={() => execute(drawerItem.id)}
          onPoll={() => poll(drawerItem.id)}
          onRetryClick={() => setModal({ kind: 'retry', item: drawerItem })}
          onReconsiderClick={() => setModal({ kind: 'reconsider', item: drawerItem })}
        />
      )}

      {modal?.kind === 'assign' && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>담당자 지정</h2>
            <p className={shared.dialogBody}>선택한 {modal.ids.length}건에 담당자를 지정합니다.</p>
            <label className={styles.formField}>
              <span>담당자 *</span>
              <select className={styles.assignSelect} value={assignOwner} onChange={(e) => setAssignOwner(e.target.value)}>
                {OWNERS.filter((o) => o !== '미배정').map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <div className={shared.dialogActions}>
              <button type="button" className={shared.dialogBtn} onClick={() => setModal(null)}>취소</button>
              <button type="button" className={shared.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={runBulkAssign}>지정</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'approve' && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>환불을 승인하시겠습니까?</h2>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}><span>환불번호</span><strong>{modal.item.id}</strong></div>
              <div className={shared.dialogSummaryRow}><span>환불유형</span><strong>{modal.item.refundType}</strong></div>
              <div className={shared.dialogSummaryRow}><span>최종 환불금액</span><strong>{fmtWon(computeFinalAmount(modal.item))}</strong></div>
              <div className={shared.dialogSummaryRow}><span>환불수단</span><strong>{modal.item.paymentMethod}</strong></div>
            </div>
            <p className={shared.dialogBody}>승인 후 '환불 실행'을 눌러야 실제 결제수단으로 환불 요청이 전송됩니다.</p>
            <label className={styles.formField}>
              <span>관리자 메모</span>
              <textarea rows={2} value={approveMemo} onChange={(e) => setApproveMemo(e.target.value)} placeholder="선택 입력" />
            </label>
            <div className={shared.dialogActions}>
              <button type="button" className={shared.dialogBtn} onClick={() => setModal(null)}>취소</button>
              <button type="button" className={shared.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} disabled={!canApprove(modal.item, refunds)} onClick={runApprove}>환불 승인</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'reject' && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>환불 반려</h2>
            <label className={styles.formField}>
              <span>사유 *</span>
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                {REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className={styles.formField}>
              <span>상세 사유</span>
              <textarea rows={2} value={rejectDetail} onChange={(e) => setRejectDetail(e.target.value)} placeholder="고객 안내에 사용될 상세 사유를 입력하세요" />
            </label>
            <label className={drawerShared.checkRow}>
              <input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)} /> 고객에게 서비스 알림 발송
            </label>
            <div className={shared.dialogActions}>
              <button type="button" className={shared.dialogBtn} onClick={() => setModal(null)}>취소</button>
              <button type="button" className={shared.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={runReject}>반려</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'retry' && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>환불을 다시 시도하시겠습니까?</h2>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}><span>기존 실패</span><strong>{modal.item.failCode}</strong></div>
              <div className={shared.dialogSummaryRow}><span>환불금액</span><strong>{fmtWon(computeFinalAmount(modal.item))}</strong></div>
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={shared.dialogBtn} onClick={() => setModal(null)}>취소</button>
              <button type="button" className={shared.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={runRetry}>환불 재시도</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'reconsider' && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>재검토로 전환하시겠습니까?</h2>
            <p className={shared.dialogBody}>반려된 환불 건을 다시 검토중 상태로 전환합니다. 변경 사유를 남겨주세요.</p>
            <label className={styles.formField}>
              <span>변경 사유</span>
              <textarea rows={2} value={reconsiderReason} onChange={(e) => setReconsiderReason(e.target.value)} placeholder="예: 고객이 반품 상품을 재접수함" />
            </label>
            <div className={shared.dialogActions}>
              <button type="button" className={shared.dialogBtn} onClick={() => setModal(null)}>취소</button>
              <button type="button" className={shared.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={runReconsider}>재검토</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
