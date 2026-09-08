import { useMemo, useState } from 'react';
import styles from '../delivery/deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast } from '../../components/common';
import { INITIAL_RETURNS, type ReturnItem } from './returnsData';

const GRID_TEMPLATE = '140px 140px 90px minmax(200px, 1fr) 110px 110px 120px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '반품번호' },
  { label: '주문번호' },
  { label: '고객명' },
  { label: '반품상품' },
  { label: '검수결과' },
  { label: '검수담당' },
  { label: '검수일시' },
];

const INSPECTION_META: Record<string, { bg: string; fg: string }> = {
  '정상 양품': { bg: '#ecfdf5', fg: '#059669' },
  '재포장 필요': { bg: '#fffbeb', fg: '#b45309' },
  '상품 훼손': { bg: '#fef2f2', fg: '#dc2626' },
  '부속품 누락': { bg: '#fef2f2', fg: '#b91c1c' },
};

const QUICK_FILTERS = ['전체', '정상 양품', '재포장 필요', '상품 훼손', '부속품 누락'] as const;

export function ReturnInspectionPage() {
  const [items, setItems] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const inspectionItems = useMemo(() => items.filter((it) => it.stage === '상품 확인'), [items]);

  const filtered = useMemo(() => {
    return inspectionItems.filter((item) => {
      const matchQuick = filter === '전체' || item.inspectionResult === filter;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchKey;
    });
  }, [inspectionItems, filter, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handlePass = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: '반품 완료',
              completedAt: '2026.08.27 16:00',
              history: [
                ...item.history,
                { when: '08.27 16:00', title: '검수 합격 및 최종 환불 완료 처리', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '검수 합격 처리되어 반품 및 환불이 완료되었습니다. (반품 완료 메뉴로 이동)', type: 'success' });
    setSelectedId(null);
  };

  const handleFail = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: '반품 반려',
              rejectedAt: '2026.08.27 16:00',
              rejectReason: '실물 상품 검수 불합격(훼손/누락)으로 반품 반려. 고객 착불 재반송.',
              history: [
                ...item.history,
                { when: '08.27 16:00', title: '검수 불합격에 따른 반품 반려 처리', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '검수 불합격으로 반품 반려 처리되었습니다. (반품 반려 메뉴로 이동)', type: 'info' });
    setSelectedId(null);
  };

  const rows: GridRow[] = filtered.map((item) => {
    const im = item.inspectionResult ? INSPECTION_META[item.inspectionResult] : { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.orderId, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.member, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.product, color: '#18181b', size: '12px' },
        { kind: 'badge', text: item.inspectionResult ?? '검수중', bg: im.bg, fg: im.fg },
        { kind: 'text', text: item.assignee, color: '#52525b', size: '12px' },
        { kind: 'text', text: item.inspectedAt ?? '-', color: '#71717a', size: '11.5px', numeric: true },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>상품 확인 (검수)</div>
            <div className={styles.subtitle}>입고된 반품 상품의 외관 손상, 포장 상태 및 구성품 유무를 판정하고 환불을 승인합니다.</div>
          </div>
        </div>

        

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            
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
              onClick={() => {
                setFilter('전체');
                setKeyword('');
              }}
            >
              초기화
            </button>
          <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = inspectionItems.filter((item) => k === '전체' || item.inspectionResult === k).length;
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
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건 검수 진행중`}</span>
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
          minWidth="960px"
          showPagination
          pages={[{ label: '1', active: true }]}
          empty={rows.length === 0}
          emptyText="검수 진행 중인 반품 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`상품 실물 검수 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.inspectionResult ?? '검수중'}
          statusMeta={selected.inspectionResult ? INSPECTION_META[selected.inspectionResult] : { bg: '#f4f4f5', fg: '#52525b' }}
          subtitle={`${selected.orderId} · ${selected.member} 님`}
          onClose={() => setSelectedId(null)}
          actions={
            <>
              <button
                type="button"
                className={drawer.primaryBtn}
                onClick={() => handlePass(selected.id)}
              >
                검수 합격 (환불 승인)
              </button>
              <button
                type="button"
                className={drawer.dangerBtn}
                onClick={() => handleFail(selected.id)}
              >
                검수 불합격 (반려)
              </button>
            </>
          }
          stats={[
            { label: '검수 결과', value: selected.inspectionResult ?? '판정 대기' },
            { label: '검수 일시', value: selected.inspectedAt ?? '-' },
            { label: '환불 예정액', value: `${selected.refundAmount.toLocaleString()}원` },
          ]}
          fields={[
            { label: '고객 반품 사유', value: `${selected.reasonCategory} - ${selected.reasonDetail}` },
            { label: '회수 송장번호', value: selected.returnInvoiceNo },
            { label: '검수 담당자', value: selected.assignee },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>검수 판정 가이드</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            양품 또는 재포장 가능 상품인 경우 [검수 합격]을 선택하여 PG 환불 및 재고 환입을 실행합니다. 사용 흔적이나 구성품 누락으로 판매 불가능한 경우 [검수 불합격]을 선택하여 고객 착불 반송 처리합니다.
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
