import { useMemo, useState } from 'react';
import styles from '../delivery/deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { showToast } from '../../components/common';
import { INITIAL_RETURNS, STAGE_META, type ReturnItem } from './returnsData';

const GRID_TEMPLATE = '140px 140px 90px 100px minmax(200px, 1fr) 120px 100px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '반품번호' },
  { label: '주문번호' },
  { label: '고객명' },
  { label: '회수택배사' },
  { label: '반품상품' },
  { label: '입고완료일시' },
  { label: '상태' },
];

export function ReturnCollectedPage() {
  const [items, setItems] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const collectedItems = useMemo(() => items.filter((it) => it.stage === '회수 완료'), [items]);

  const filtered = useMemo(() => {
    return collectedItems.filter((item) => {
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchKey;
    });
  }, [collectedItems, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handleStartInspection = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: '상품 확인',
              history: [
                ...item.history,
                { when: '08.27 15:58', title: '실물 상품 검수 배정 및 검수 개시', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '상품 검수 대기열로 배정되었습니다. (상품 확인 메뉴로 이동)', type: 'success' });
    setSelectedId(null);
  };

  const rows: GridRow[] = filtered.map((item) => {
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.orderId, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.member, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.carrier, color: '#71717a', size: '12px' },
        { kind: 'text', text: item.product, color: '#18181b', size: '12px' },
        { kind: 'text', text: item.collectedAt ?? '-', color: '#18181b', size: '11.5px', numeric: true },
        { kind: 'badge', text: '입고 완료', bg: '#ecfeff', fg: '#0e7490' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>회수 완료</div>
            <div className={styles.subtitle}>물류센터에 입고 완료된 반품 상품을 조회하고 실물 검수 대기열을 관리합니다.</div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField">
              <span>검색 범위</span>
              <select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
                <option>전체</option>
                <option>반품번호</option>
                <option>주문번호</option>
                <option>고객명</option>
                <option>상품명</option>
              </select>
            </label>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="반품번호 / 주문번호 / 고객명 / 상품명"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
            <div className={styles.rowSpacer} />
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => setKeyword('')}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건 입고 완료`}</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
          </div>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="920px"
          showPagination
          pages={[{ label: '1', active: true }]}
          empty={rows.length === 0}
          emptyText="입고 완료된 반품 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`입고 완료 상세 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님`}
          onClose={() => setSelectedId(null)}
          actions={
            <button
              type="button"
              className={drawer.primaryBtn}
              onClick={() => handleStartInspection(selected.id)}
            >
              상품 검수 시작
            </button>
          }
          stats={[
            { label: '입고 일시', value: selected.collectedAt ?? '-' },
            { label: '회수 택배사', value: selected.carrier },
            { label: '수량', value: `${selected.quantity}개` },
          ]}
          fields={[
            { label: '반품 사유', value: `${selected.reasonCategory} - ${selected.reasonDetail}` },
            { label: '회수 송장번호', value: selected.returnInvoiceNo },
            { label: '환불 예정 금액', value: `${selected.refundAmount.toLocaleString()}원` },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>입고 검수 대기 안내</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            물류센터 검수 담당자에게 상품이 전달되었습니다. 외관 손상 및 구성품 유무를 확인한 뒤 [상품 검수 시작]을 진행하세요.
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
