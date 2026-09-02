import { useMemo, useState } from 'react';
import styles from './ordersShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { OrderCompletedDetailDrawer } from './OrderCompletedDetailDrawer';
import {
  COMPLETED_ORDERS,
  FILTER_KEYS,
  fmt,
  isThisMonth,
  TYPE_META,
  type CompletedOrder,
  type FilterKey,
} from './orderCompletedData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '70px 1fr 1fr 88px 96px 52px 56px 46px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '주문번호' }, { label: '거래처' }, { label: '주문내용' }, { label: '최종금액', align: 'right' },
  { label: '완료유형' }, { label: '납품상태' }, { label: '수금상태' }, { label: '완료일' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

const KEY_MAP: Record<FilterKey, string> = {
  '전체 완료': '전체',
  '이번 달 완료': '이번달',
  '정상 완료': '정상완료',
  '부분 완료': '부분완료',
  '완료 후 이슈': '이슈',
};

export function OrderCompletedPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>(COMPLETED_ORDERS);
  const [filter, setFilter] = useState<FilterKey>('전체 완료');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showReopenPanel, setShowReopenPanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    return {
      '전체 완료': orders.length,
      '이번 달 완료': orders.filter(isThisMonth).length,
      '정상 완료': orders.filter((o) => o.type === '정상완료').length,
      '부분 완료': orders.filter((o) => o.type === '부분완료').length,
      '완료 후 이슈': orders.filter((o) => o.issue).length,
    } as Record<FilterKey, number>;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const f = KEY_MAP[filter] ?? filter;
      if (f === '이번달' && !isThisMonth(o)) return false;
      else if (f === '정상완료' && o.type !== '정상완료') return false;
      else if (f === '부분완료' && o.type !== '부분완료') return false;
      else if (f === '이슈' && !o.issue) return false;
      if (q && !(o.id.includes(q) || o.partner.includes(q))) return false;
      return true;
    });
  }, [orders, filter, q]);

  const selected = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowReopenPanel(false);
  }

  function reopen() {
    if (!selected) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selected.id
          ? { ...o, history: [...o.history, { when: '방금', action: '주문 재오픈', by: 'admin03', note: '수동 재오픈' }] }
          : o,
      ),
    );
    setShowReopenPanel(false);
  }

  const rows: GridRow[] = filtered.map((o) => {
    const tm = TYPE_META[o.type];
    const summary = o.items.length > 1 ? `${o.items[0].name} 외 ${o.items.length - 1}건` : o.items[0].name;
    const payFg = o.paymentStatus === '수금완료' ? '#059669' : o.paymentStatus === '미수금' ? '#dc2626' : '#d97706';
    return {
      id: o.id,
      onClick: () => openDetail(o.id),
      cells: [
        { kind: 'text', text: o.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
        { kind: 'text', text: o.partner, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: summary, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: fmt(o.finalAmount), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
        { kind: 'badge', text: tm.label, bg: tm.bg, fg: tm.fg },
        { kind: 'text', text: '완료', color: '#059669', size: '12px', weight: 500 },
        { kind: 'text', text: o.paymentStatus, color: payFg, size: '12px', weight: 500 },
        { kind: 'text', text: o.completedAt.slice(5), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
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
              <div className={styles.title}>주문 완료</div>
              <div className={styles.subtitle}>완료된 주문과 최종 처리 결과를 조회합니다.</div>
            </div>
          </div>

          <div className={styles.quickFilters}>
            {FILTER_KEYS.map((k) => {
              const active = filter === k;
              return (
                <CommonButton
                  key={k}
                  variant={active ? 'primary-light' : 'secondary'}
                  size="md"
                  className={`${styles.qfBtn} ${active ? styles.active : ''}`}
                  onClick={() => setFilter(k)}
                >
                  <span className={styles.qfLabel}>{k}</span>
                  <span className={styles.qfCount}>{counts[k] || 0}</span>
                </CommonButton>
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
              <label className="globalFilterField"><span>완료유형</span><select aria-label="완료유형" className={styles.selectXs} defaultValue="완료유형 전체">
                <option>완료유형 전체</option><option>정상 완료</option><option>부분 완료</option><option>취소 포함 완료</option>
              </select></label>
              <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectXs} defaultValue="거래처 전체">
                <option>거래처 전체</option><option>회사 01</option><option>회사 02</option>
              </select></label>
              <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={styles.selectXs} defaultValue="담당자 전체">
                <option>담당자 전체</option><option>admin01</option><option>admin02</option>
              </select></label>
              <label className="globalFilterField"><span>수금상태</span><select aria-label="수금상태" className={styles.selectXs} defaultValue="수금상태 전체">
                <option>수금상태 전체</option><option>수금완료</option><option>미수금</option><option>부분수금</option>
              </select></label>
              <div className={styles.rowSpacer} />
              <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체 완료'); setQ(''); }}>초기화</button>
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
            minWidth="1030px"
            showPagination
            pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
            empty={rows.length === 0}
            emptyText="완료된 주문이 없습니다"
            emptySubtext="주문 처리가 종료되면 이곳에서 완료 내역을 확인할 수 있습니다."
          />
        </div>

        {selected && (
          <OrderCompletedDetailDrawer
            order={selected}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => setSelectedId(null)}
            showReopenPanel={showReopenPanel}
            onToggleReopen={() => setShowReopenPanel((v) => !v)}
            onReopen={reopen}
          />
        )}
      </div>
    </div>
  );
}
