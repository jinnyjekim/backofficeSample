import { useMemo, useRef, useState } from 'react';
import styles from './ordersShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { PurchaseOrderDetailDrawer } from './PurchaseOrderDetailDrawer';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  fmt,
  issueOf,
  PURCHASE_ORDERS,
  shortDate,
  STATUS_META,
  STATUSES,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from './purchaseOrdersData';

const GRID_TEMPLATE = '96px 1fr 1fr 100px 84px 84px 90px 84px 78px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '발주번호' }, { label: '거래처' }, { label: '발주내용' }, { label: '발주금액', align: 'right' },
  { label: '요청납기' }, { label: '상태' }, { label: '이슈' }, { label: '담당자' }, { label: '발주일' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2', '3'];

export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(PURCHASE_ORDERS);
  const [filter, setFilter] = useState<'전체' | PurchaseOrderStatus>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showRegister, setShowRegister] = useState(false);
  const registerAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(registerAsideRef, () => setShowRegister(false), showRegister);
  const [showConfirmPanel, setShowConfirmPanel] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: orders.length };
    STATUSES.slice(1).forEach((st) => {
      c[st] = orders.filter((o) => o.status === st).length;
    });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== '전체' && o.status !== filter) return false;
      if (q && !(o.id.includes(q) || o.partner.includes(q))) return false;
      return true;
    });
  }, [orders, filter, q]);

  const selected = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('info');
    setShowRegister(false);
    setShowConfirmPanel(false);
    setShowRejectPanel(false);
  }

  function updateOrder(id: string, updater: (o: PurchaseOrder) => PurchaseOrder) {
    setOrders((prev) => prev.map((o) => (o.id === id ? updater(o) : o)));
  }

  function startReview() {
    if (!selected) return;
    updateOrder(selected.id, (o) => ({
      ...o,
      status: '검토중',
      owner: 'admin01',
      history: [...o.history, { when: '방금', action: '검토 시작', by: 'admin01' }],
    }));
  }

  function confirmOrder() {
    if (!selected) return;
    updateOrder(selected.id, (o) => ({
      ...o,
      status: '확정',
      history: [...o.history, { when: '방금', action: '발주 확정', by: 'admin01' }],
    }));
    setShowConfirmPanel(false);
  }

  function reject() {
    if (!selected) return;
    updateOrder(selected.id, (o) => ({
      ...o,
      status: '취소',
      history: [...o.history, { when: '방금', action: '발주 반려', by: 'admin01' }],
    }));
    setShowRejectPanel(false);
  }

  const rows: GridRow[] = filtered.map((o) => {
    const sm = STATUS_META[o.status];
    const iss = issueOf(o);
    const summary = o.items.length > 1 ? `${o.items[0].name} 외 ${o.items.length - 1}건` : o.items[0].name;
    return {
      id: o.id,
      onClick: () => openDetail(o.id),
      cells: [
        { kind: 'text', text: o.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
        { kind: 'text', text: o.partner, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: summary, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: fmt(o.amount), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: shortDate(o.dueDate), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'badge', text: o.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: iss.length ? `이슈 ${iss.length}건` : '-', color: '#d97706', size: '11.5px', weight: 500 },
        { kind: 'text', text: o.owner, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'text', text: shortDate(o.created), color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.scrollArea}>
        <div className={styles.headTop}>
          <div className={styles.headRow}>
            <div>
              <div className={styles.title}>발주 관리</div>
              <div className={styles.subtitle}>거래처의 발주 내역을 접수하고 주문 확정 상태를 관리합니다.</div>
            </div>
            <button type="button" className={styles.registerBtn} onClick={() => setShowRegister(true)}>＋ 발주 등록</button>
          </div>

          <div className={styles.quickFilters}>
            {STATUSES.map((st) => {
              const active = filter === st;
              return (
                <button
                  key={st}
                  type="button"
                  className={styles.qfBtn}
                  style={{ borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: active ? 'var(--accent)' : '#fff' }}
                  onClick={() => setFilter(st)}
                >
                  <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{st}</span>
                  <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[st] || 0}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.filterBox}>
            <div className={styles.filterRow1}>
              <select className={styles.selectSm} defaultValue="전체">
                <option>전체</option><option>발주번호</option><option>거래처명</option><option>상품명</option><option>견적번호</option><option>계약번호</option>
              </select>
              <input
                className={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="발주번호 또는 거래처명"
              />
              <button type="button" className={styles.searchBtn}>검색</button>
            </div>
            <div className={styles.filterRow2}>
              <select className={styles.selectXs} defaultValue="거래처 전체">
                <option>거래처 전체</option><option>회사 01</option><option>회사 02</option><option>㈜한빛물산</option>
              </select>
              <select className={styles.selectXs} defaultValue="담당자 전체">
                <option>담당자 전체</option><option>admin01</option><option>admin02</option><option>미배정</option>
              </select>
              <select className={styles.selectXs} defaultValue="발주 기준 전체">
                <option>발주 기준 전체</option><option>견적</option><option>계약</option><option>직접 발주</option>
              </select>
              <button type="button" className={styles.detailFilterBtn}>상세 필터 ＋</button>
              <div className={styles.rowSpacer} />
              <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
            </div>
          </div>

          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>총 {filtered.length}건</span>
            <div className={styles.resultActions}>
              <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
              <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
                <option>20개씩 보기</option><option>50개씩 보기</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.gridWrap}>
          <DataGrid
            columns={GRID_COLUMNS}
            rows={rows}
            gridTemplate={GRID_TEMPLATE}
            minWidth="1180px"
            showPagination
            pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
            empty={rows.length === 0}
            emptyText="등록된 발주가 없습니다"
            emptySubtext="거래처 발주가 접수되면 이곳에서 관리할 수 있습니다."
            emptyActionLabel="＋ 발주 등록"
            emptyActionClick={() => setShowRegister(true)}
          />
        </div>

        {selected && !showRegister && (
          <PurchaseOrderDetailDrawer
            order={selected}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => setSelectedId(null)}
            showConfirmPanel={showConfirmPanel}
            showRejectPanel={showRejectPanel}
            onToggleConfirm={() => { setShowConfirmPanel((v) => !v); setShowRejectPanel(false); }}
            onToggleReject={() => { setShowRejectPanel((v) => !v); setShowConfirmPanel(false); }}
            onStartReview={startReview}
            onConfirmOrder={confirmOrder}
            onReject={reject}
          />
        )}

        {showRegister && (
          <aside ref={registerAsideRef} className={styles.registerAside}>
            <div className={styles.registerHead}>
              <span className={styles.registerTitle}>발주 등록</span>
              <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
            </div>
            <div className={styles.registerBody}>
              <div className={styles.formSectionLabel}>발주 기준</div>
              <div className={styles.formRadioRow}>
                <label className={styles.formRadioLabel}><input type="radio" name="basis" />견적</label>
                <label className={styles.formRadioLabel}><input type="radio" name="basis" />계약</label>
                <label className={styles.formRadioLabel}><input type="radio" name="basis" defaultChecked />직접 발주</label>
              </div>

              <label className={styles.formLabel}>거래처 *
                <input className={styles.formInput} placeholder="거래처 검색" />
              </label>
              <label className={styles.formLabel}>거래처 담당자 *
                <select className={styles.formSelect} defaultValue="담당자 선택">
                  <option>담당자 선택</option><option>김OO · 구매팀</option>
                </select>
              </label>
              <div className={styles.formRow2}>
                <label className={styles.formLabel}>발주일 *
                  <input className={styles.formInput} placeholder="2026.08.14" />
                </label>
                <label className={styles.formLabel}>외부 발주번호
                  <input className={styles.formInput} />
                </label>
              </div>

              <div className={styles.formSectionLabel}>발주 항목</div>
              <div className={styles.itemTableBox}>
                <div className={styles.itemTableHead}>
                  <span>상품</span><span>수량</span><span>단위</span><span style={{ textAlign: 'right' }}>단가</span>
                </div>
                <div className={styles.itemTableRow}>
                  <input className={styles.itemTableInput} placeholder="상품 검색" />
                  <input className={styles.itemTableInput} placeholder="100" />
                  <select className={styles.itemTableInput}><option>EA</option><option>BOX</option></select>
                  <input className={styles.itemTableInputRight} placeholder="29,000" />
                </div>
              </div>
              <button type="button" className={styles.addItemBtn}>＋ 항목 추가</button>

              <div className={styles.formSectionLabel}>납품 조건</div>
              <div className={styles.formFieldGroup}>
                <label className={styles.formLabel} style={{ marginBottom: 0 }}>요청 납기 *
                  <input className={styles.formInput} placeholder="2026.08.30" />
                </label>
                <label className={styles.formLabel} style={{ marginBottom: 0 }}>납품 장소
                  <input className={styles.formInput} />
                </label>
                <label className={styles.formLabel} style={{ marginBottom: 0 }}>요청사항
                  <textarea className={styles.formTextarea} />
                </label>
              </div>

              <button type="button" className={styles.formOutlineBtn}>파일 추가</button>
            </div>
            <div className={styles.registerFooter}>
              <button type="button" className={styles.formOutlineBtn} onClick={() => setShowRegister(false)}>임시저장</button>
              <button type="button" className={styles.formPrimaryBtn} onClick={() => setShowRegister(false)}>발주 등록</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
