import { useMemo, useState } from 'react';
import styles from '../delivery/deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast, SplitPaneLayout } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { CANCEL_REASON_META, CANCEL_STAGE_META, INITIAL_CANCELS, type CancelItem } from './cancelData';

const GRID_TEMPLATE = '140px 140px 90px 90px 110px minmax(200px, 1fr) 90px 120px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '취소번호' },
  { label: '주문번호' },
  { label: '신청고객' },
  { label: '취소유형' },
  { label: '취소사유' },
  { label: '취소상품' },
  { label: '취소요청금액', align: 'right' },
  { label: '신청일시' },
  { label: '관리' },
];

const QUICK_FILTERS = ['전체', '단순 변심', '주문 정보 변경', '배송 지연', '중복 주문', '결제 수단 변경'] as const;

export function CancelRequestsPage() {
  const [items, setItems] = useState<CancelItem[]>(INITIAL_CANCELS);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [cancelType, setCancelType] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const requestItems = useMemo(() => items.filter((it) => it.stage === '취소 요청'), [items]);

  const filtered = useMemo(() => {
    return requestItems.filter((item) => {
      const matchQuick = filter === '전체' || item.reasonCategory === filter;
      const matchType = !cancelType || item.cancelType === cancelType;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.reasonDetail}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchType && matchKey;
    });
  }, [requestItems, filter, cancelType, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handleApprove = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: '취소 승인',
              approvedAt: '2026.08.27 16:10',
              assignee: 'admin01',
              history: [
                ...item.history,
                { when: '08.27 16:10', title: '취소 요청 승인 (환불 대기)', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '취소 요청이 승인되었습니다. (취소 승인 메뉴로 이동)', type: 'success' });
    setSelectedId(null);
  };

  const handleReject = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: '취소 반려',
              rejectedAt: '2026.08.27 16:10',
              rejectReason: '이미 출고 작업이 진행되어 취소가 불가합니다. 상품 수령 후 반품으로 신청해 주세요.',
              assignee: 'admin01',
              history: [
                ...item.history,
                { when: '08.27 16:10', title: '출고 진행으로 인한 취소 반려', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '취소 요청이 반려되었습니다. (취소 반려 메뉴로 이동)', type: 'info' });
    setSelectedId(null);
  };

  const rows: GridRow[] = filtered.map((item) => {
    const rm = CANCEL_REASON_META[item.reasonCategory] ?? { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.orderId, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.member, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'badge', text: item.cancelType, bg: item.cancelType === '부분 취소' ? '#eff6ff' : '#f4f4f5', fg: item.cancelType === '부분 취소' ? '#1d4ed8' : '#3f3f46' },
        { kind: 'badge', text: item.reasonCategory, bg: rm.bg, fg: rm.fg },
        { kind: 'text', text: item.product, color: '#18181b', size: '12px' },
        { kind: 'text', text: `${item.cancelAmount.toLocaleString()}원`, align: 'right', size: '12px', numeric: true, weight: 600, color: '#dc2626' },
        { kind: 'text', text: item.requestedAt, color: '#71717a', size: '11.5px', numeric: true },
        { kind: 'link', text: '심사', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>취소 요청</div>
            <div className={styles.subtitle}>고객이 결제 후 신청한 주문 취소 건을 검토하고 승인하거나 반려를 처리합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = requestItems.filter((item) => k === '전체' || item.reasonCategory === k).length;
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
                <option>취소번호</option>
                <option>주문번호</option>
                <option>신청고객</option>
                <option>상품명</option>
              </select>
            </label>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="취소번호 / 주문번호 / 고객명 / 상품명 / 취소사유"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField">
              <span>취소 유형</span>
              <select
                aria-label="취소 유형"
                className={styles.selectXs}
                value={cancelType}
                onChange={(e) => setCancelType(e.target.value)}
              >
                <option value="">전체 취소 유형</option>
                <option>전체 취소</option>
                <option>부분 취소</option>
              </select>
            </label>
            <label className={styles.dateFilterField}>
              <span>신청일</span>
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
                setCancelType('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건 심사 대기`}</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
          </div>
        </div>
      </header>

      <SplitPaneLayout
        list={
          <div className={styles.tableWrap}>
            <DataGrid
              columns={GRID_COLUMNS}
              rows={rows}
              gridTemplate={GRID_TEMPLATE}
              minWidth="1050px"
              showPagination
              pages={[{ label: '1', active: true }]}
              empty={rows.length === 0}
              emptyText="접수된 취소 요청 건이 없습니다."
            />
          </div>
        }
        detail={
          selected && (
        <DetailDrawer
          variant="panel"
          eyebrow={`취소 요청 심사 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={CANCEL_STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님 (${selected.phone})`}
          onClose={() => setSelectedId(null)}
          actions={
            <>
              <button
                type="button"
                className={drawer.primaryBtn}
                onClick={() => handleApprove(selected.id)}
              >
                취소 승인
              </button>
              <button
                type="button"
                className={drawer.dangerBtn}
                onClick={() => handleReject(selected.id)}
              >
                취소 반려
              </button>
            </>
          }
          stats={[
            { label: '취소 유형', value: selected.cancelType },
            { label: '취소 금액', value: `${selected.cancelAmount.toLocaleString()}원` },
            { label: '원 결제액', value: `${selected.totalOrderAmount.toLocaleString()}원` },
          ]}
          fields={[
            { label: '결제 수단', value: selected.paymentMethod },
            { label: '취소 사유', value: `${selected.reasonCategory} - ${selected.reasonDetail}` },
            { label: '신청 일시', value: selected.requestedAt },
            { label: '쿠폰 차감', value: selected.deductCoupon ? `${selected.deductCoupon.toLocaleString()}원 차감 환불` : '없음' },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>취소 신청 사유</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {selected.reasonDetail}
          </div>
        </DetailDrawer>
          )
        }
        emptyMessage={<>왼쪽 목록에서 건을 선택하면<br />취소 요청 심사 상세가 여기에 표시됩니다.</>}
      />
    </div>
  );
}
