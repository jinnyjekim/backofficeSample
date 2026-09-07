import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { INVOICE_ITEMS, type InvoiceItem } from './deliveryExtraData';

const GRID_TEMPLATE = '120px 140px 90px 90px 140px 120px 90px 80px minmax(160px, 1fr) 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '송장발행번호' },
  { label: '주문번호' },
  { label: '수령인' },
  { label: '택배사' },
  { label: '운송장번호' },
  { label: '채번일시' },
  { label: '출력상태' },
  { label: '출력횟수' },
  { label: '상품정보' },
  { label: '관리' },
];

const PRINT_META: Record<string, { bg: string; fg: string }> = {
  출력완료: { bg: '#ecfdf5', fg: '#059669' },
  출력대기: { bg: '#fefce8', fg: '#a16207' },
  재발행: { bg: '#eff6ff', fg: '#1d4ed8' },
  오류: { bg: '#fef2f2', fg: '#dc2626' },
};

const QUICK_FILTERS = ['전체', '출력완료', '출력대기', '재발행'] as const;

export function DeliveryInvoicesPage() {
  const [items, setItems] = useState<InvoiceItem[]>(INVOICE_ITEMS);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [carrier, setCarrier] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick = filter === '전체' || item.printStatus === filter;
      const matchCarrier = !carrier || item.carrier === carrier;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.receiver} ${item.invoiceNo} ${item.productSummary}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchCarrier && matchKey;
    });
  }, [items, filter, carrier, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handleReprint = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              printStatus: '재발행',
              printCount: item.printCount + 1,
              history: [
                ...item.history,
                { when: '2026.08.27 15:40', title: '송장 라벨 재인쇄 실행', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '송장 라벨이 재출력되었습니다.', type: 'success' });
  };

  const rows: GridRow[] = filtered.map((item) => {
    const pm = PRINT_META[item.printStatus] ?? { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.orderId, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.receiver, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.carrier, color: '#71717a', size: '12px' },
        { kind: 'text', text: item.invoiceNo, color: '#1e40af', size: '12px', weight: 600, numeric: true },
        { kind: 'text', text: item.issuedAt, color: '#18181b', size: '11.5px', numeric: true },
        { kind: 'badge', text: item.printStatus, bg: pm.bg, fg: pm.fg },
        { kind: 'text', text: `${item.printCount}회`, align: 'right', weight: 600 },
        { kind: 'text', text: item.productSummary, color: '#3f3f46', size: '12px' },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>송장 관리</div>
            <div className={styles.subtitle}>택배사별 송장 채번 및 출력 상태를 모니터링하고 송장 재발행을 처리합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = items.filter((item) => k === '전체' || item.printStatus === k).length;
            return (
              <CommonButton
                key={k}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${active ? styles.active : ''}`}
                onClick={() => setFilter(k)}
              >
                <span className={styles.qfLabel}>{k}</span>
                <span className={styles.qfCount}>{count}</span>
              </CommonButton>
            );
          })}
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField">
              <span>검색 범위</span>
              <select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
                <option>전체</option>
                <option>송장발행번호</option>
                <option>주문번호</option>
                <option>운송장번호</option>
                <option>수령인</option>
              </select>
            </label>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="송장발행번호 / 주문번호 / 운송장번호 / 수령인 / 상품명"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField">
              <span>택배사</span>
              <select
                aria-label="택배사"
                className={styles.selectXs}
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              >
                <option value="">전체 택배사</option>
                <option>CJ대한통운</option>
                <option>한진택배</option>
                <option>롯데택배</option>
                <option>우체국택배</option>
              </select>
            </label>
            <label className={styles.dateFilterField}>
              <span>발행일</span>
              <div className={styles.dateRange}>
                <DatePicker defaultValue="2026-08-20" />
                <span className={styles.dateSeparator}>~</span>
                <DatePicker defaultValue="2026-08-27" />
              </div>
            </label>
            <div className={styles.rowSpacer} />
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setFilter('전체');
                setKeyword('');
                setCarrier('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건`}</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1160px"
          showPagination
          pages={[{ label: '1', active: true }]}
          empty={rows.length === 0}
          emptyText="조건에 해당하는 송장 내역이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`송장 상세 · ${selected.id}`}
          title={`${selected.carrier} (${selected.invoiceNo})`}
          status={selected.printStatus}
          statusMeta={PRINT_META[selected.printStatus] ?? { bg: '#f4f4f5', fg: '#52525b' }}
          subtitle={`${selected.orderId} · ${selected.receiver} 님`}
          onClose={() => setSelectedId(null)}
          actions={
            <button
              type="button"
              className={drawer.primaryBtn}
              onClick={() => handleReprint(selected.id)}
            >
              송장 라벨 재인쇄
            </button>
          }
          stats={[
            { label: '출력 횟수', value: `${selected.printCount}회` },
            { label: '배송 상태', value: selected.shipmentStatus },
            { label: '채번 일시', value: selected.issuedAt },
          ]}
          fields={[
            { label: '주문번호', value: selected.orderId },
            { label: '수령인', value: selected.receiver },
            { label: '상품 내역', value: selected.productSummary },
            { label: '택배사', value: selected.carrier },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>송장 출력 이력</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {selected.history.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                <strong style={{ minWidth: '140px' }}>{h.title}</strong>
                <span style={{ color: '#71717a' }}>{h.when}</span>
                {h.by && <span style={{ color: '#a1a1aa' }}>({h.by})</span>}
              </div>
            ))}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
