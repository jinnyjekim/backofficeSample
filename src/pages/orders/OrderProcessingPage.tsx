import { useMemo, useState } from 'react';
import styles from './ordersShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { OrderProcessingDetailDrawer } from './OrderProcessingDetailDrawer';
import {
  fmt,
  isDelayed,
  FILTER_KEYS,
  PROCESSING_ORDERS,
  STATUS_META,
  type FilterKey,
  type ProcessingOrder,
} from './orderProcessingData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '96px 1fr 1fr 100px 92px 140px 84px 84px 70px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '주문번호' }, { label: '거래처' }, { label: '주문내용' }, { label: '주문금액', align: 'right' },
  { label: '처리상태' }, { label: '진행률' }, { label: '예정일' }, { label: '담당자' }, { label: '이슈' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2', '3'];

export function OrderProcessingPage() {
  const [orders, setOrders] = useState<ProcessingOrder[]>(PROCESSING_ORDERS);
  const [filter, setFilter] = useState<FilterKey>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showHoldPanel, setShowHoldPanel] = useState(false);
  const [showCompletePanel, setShowCompletePanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    return {
      '처리 대기': orders.filter((o) => o.status === '처리 대기').length,
      처리중: orders.filter((o) => o.status === '처리중').length,
      보류: orders.filter((o) => o.status === '보류').length,
      지연: orders.filter(isDelayed).length,
      '처리 완료': orders.filter((o) => o.status === '처리 완료').length,
      전체: orders.length,
    } as Record<FilterKey, number>;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter === '지연') {
        if (!isDelayed(o)) return false;
      } else if (filter !== '전체' && o.status !== filter) {
        return false;
      }
      if (q && !(o.id.includes(q) || o.partner.includes(q))) return false;
      return true;
    });
  }, [orders, filter, q]);

  const selected = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowHoldPanel(false);
    setShowCompletePanel(false);
  }

  function updateOrder(id: string, updater: (o: ProcessingOrder) => ProcessingOrder) {
    setOrders((prev) => prev.map((o) => (o.id === id ? updater(o) : o)));
  }

  function startProcess() {
    if (!selected) return;
    const owner = selected.owner === '미배정' ? 'admin01' : selected.owner;
    updateOrder(selected.id, (o) => ({
      ...o,
      status: '처리중',
      owner,
      history: [...o.history, { when: '방금', action: '처리 시작', by: owner }],
    }));
  }

  function resume() {
    if (!selected) return;
    updateOrder(selected.id, (o) => ({
      ...o,
      status: '처리중',
      holdReason: null,
      history: [...o.history, { when: '방금', action: '처리 재개', by: o.owner }],
    }));
  }

  function confirmHold() {
    if (!selected) return;
    updateOrder(selected.id, (o) => ({
      ...o,
      status: '보류',
      holdReason: '재고/공급 부족',
      holdResume: '2026.08.18',
      history: [...o.history, { when: '방금', action: '처리 보류', by: o.owner }],
    }));
    setShowHoldPanel(false);
  }

  function confirmComplete() {
    if (!selected) return;
    const unfinished = selected.items.filter((it) => it.done < it.qty);
    updateOrder(selected.id, (o) => ({
      ...o,
      status: unfinished.length > 0 ? '처리중' : '처리 완료',
      history: [...o.history, { when: '방금', action: unfinished.length > 0 ? '부분 처리 완료 처리' : '처리 완료', by: o.owner }],
    }));
    setShowCompletePanel(false);
  }

  const rows: GridRow[] = filtered.map((o) => {
    const sm = STATUS_META[o.status];
    const totalQty = o.items.reduce((a, i) => a + i.qty, 0);
    const doneQty = o.items.reduce((a, i) => a + i.done, 0);
    const pct = totalQty ? Math.round((doneQty / totalQty) * 100) : 0;
    const doneItems = o.items.filter((i) => i.done >= i.qty).length;
    const summaryText = o.items.length > 1 ? `${o.items[0].name} 외 ${o.items.length - 1}건` : o.items[0].name;
    const issues: string[] = [];
    if (isDelayed(o)) issues.push('처리 지연');
    if (o.supply.some((sp) => !sp.ok)) issues.push('재고 부족');
    if (o.change) issues.push('주문 변경');
    if (o.owner === '미배정') issues.push('담당자 미배정');
    return {
      id: o.id,
      onClick: () => openDetail(o.id),
      cells: [
        { kind: 'text', text: o.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
        { kind: 'text', text: o.partner, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: summaryText, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: fmt(o.amount), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
        { kind: 'badge', text: o.status, bg: sm.bg, fg: sm.fg },
        { kind: 'progress', pct, label: `${doneItems}/${o.items.length}` },
        { kind: 'text', text: o.planned === '-' ? '-' : o.planned.slice(5).replace('-', '.'), color: isDelayed(o) ? '#dc2626' : '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: o.owner, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'text', text: issues.length ? `⚠ ${issues.length}건` : '-', color: '#d97706', size: '11.5px', weight: 500 },
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
              <div className={styles.title}>주문 처리</div>
              <div className={styles.subtitle}>확정된 주문의 작업 진행 상태와 이행 현황을 관리합니다.</div>
            </div>
          </div>

          <div className={styles.quickFilters}>
            {FILTER_KEYS.map((k) => {
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
              <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
                <option>전체</option><option>주문번호</option><option>발주번호</option><option>거래처명</option><option>상품명</option>
              </select></label>
              <input
                className={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="주문번호 또는 거래처명"
              />
              <button type="button" className={styles.searchBtn}>검색</button>
            </div>
            <div className={styles.filterRow2}>
              <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectXs} defaultValue="거래처 전체">
                <option>거래처 전체</option><option>회사 01</option><option>회사 02</option>
              </select></label>
              <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={styles.selectXs} defaultValue="담당자 전체">
                <option>담당자 전체</option><option>admin01</option><option>admin02</option><option>미배정</option>
              </select></label>
              <div className={styles.rowSpacer} />
              <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
            </div>
          </div>

          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>총 {filtered.length}건</span>
            <div className={styles.resultActions}>
              <ExcelDownloadButton type="button" data-grid-download />
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
            minWidth="1160px"
            showPagination
            pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
            empty={rows.length === 0}
            emptyText="현재 처리 대기 중인 주문이 없습니다"
          />
        </div>

        {selected && (
          <OrderProcessingDetailDrawer
            order={selected}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => setSelectedId(null)}
            showHoldPanel={showHoldPanel}
            showCompletePanel={showCompletePanel}
            onToggleHold={() => setShowHoldPanel((v) => !v)}
            onToggleComplete={() => setShowCompletePanel((v) => !v)}
            onStartProcess={startProcess}
            onResume={resume}
            onConfirmHold={confirmHold}
            onConfirmComplete={confirmComplete}
          />
        )}
      </div>
    </div>
  );
}
