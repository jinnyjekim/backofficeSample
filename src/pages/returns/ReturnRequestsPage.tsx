import { useMemo, useState } from 'react';
import styles from '../delivery/deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { INITIAL_RETURNS, REASON_META, STAGE_META, type ReturnItem } from './returnsData';

const GRID_TEMPLATE = '140px 140px 90px 110px minmax(200px, 1fr) 90px 90px 120px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '반품번호' },
  { label: '주문번호' },
  { label: '신청고객' },
  { label: '반품사유' },
  { label: '상품정보' },
  { label: '결제금액', align: 'right' },
  { label: '환불예정', align: 'right' },
  { label: '신청일시' },
];

const QUICK_FILTERS = ['전체', '단순 변심', '상품 불량', '오배송', '파손/오염', '사이즈/색상 불일치'] as const;

export function ReturnRequestsPage() {
  const [items, setItems] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // '반품 요청' 단계만 기본 필터링
  const requestItems = useMemo(() => items.filter((it) => it.stage === '반품 요청'), [items]);

  const filtered = useMemo(() => {
    return requestItems.filter((item) => {
      const matchQuick = filter === '전체' || item.reasonCategory === filter;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.reasonDetail}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchKey;
    });
  }, [requestItems, filter, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handleApprove = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: '반품 승인',
              approvedAt: '2026.08.27 15:50',
              assignee: 'admin01',
              history: [
                ...item.history,
                { when: '08.27 15:50', title: '관리자 반품 승인 완료 (회수 대기)', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '반품 요청이 승인되었습니다. (반품 승인 메뉴로 이동)', type: 'success' });
    setSelectedId(null);
  };

  const handleReject = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: '반품 반려',
              rejectedAt: '2026.08.27 15:50',
              assignee: 'admin01',
              rejectReason: '고객 반품 요청 사유 불충족 또는 반품 가능 기간(7일) 초과로 반려.',
              history: [
                ...item.history,
                { when: '08.27 15:50', title: '반품 요청 반려 처리', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '반품 요청이 반려 처리되었습니다.', type: 'info' });
    setSelectedId(null);
  };

  const rows: GridRow[] = filtered.map((item) => {
    const rm = REASON_META[item.reasonCategory] ?? { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.orderId, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.member, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'badge', text: item.reasonCategory, bg: rm.bg, fg: rm.fg },
        { kind: 'text', text: item.product, color: '#18181b', size: '12px' },
        { kind: 'text', text: `${item.amount.toLocaleString()}원`, align: 'right', size: '12px', numeric: true },
        { kind: 'text', text: `${item.refundAmount.toLocaleString()}원`, align: 'right', size: '12px', numeric: true, weight: 600, color: '#059669' },
        { kind: 'text', text: item.requestedAt, color: '#71717a', size: '11.5px', numeric: true },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>반품 요청</div>
            <div className={styles.subtitle}>고객이 신청한 신규 반품 건을 조회하고 접수 심사(승인/반려)를 진행합니다.</div>
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
                <option>반품번호</option>
                <option>주문번호</option>
                <option>신청고객</option>
                <option>상품명</option>
              </select>
            </label>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="반품번호 / 주문번호 / 고객명 / 상품명 / 상세사유"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
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

      <div className={styles.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="990px"
          showPagination
          pages={[{ label: '1', active: true }]}
          empty={rows.length === 0}
          emptyText="접수된 반품 요청 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`반품 요청 심사 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님 (${selected.phone})`}
          onClose={() => setSelectedId(null)}
          actions={
            <>
              <button
                type="button"
                className={drawer.primaryBtn}
                onClick={() => handleApprove(selected.id)}
              >
                반품 승인
              </button>
              <button
                type="button"
                className={drawer.dangerBtn}
                onClick={() => handleReject(selected.id)}
              >
                반품 반려
              </button>
            </>
          }
          stats={[
            { label: '반품 사유', value: selected.reasonCategory },
            { label: '결제 금액', value: `${selected.amount.toLocaleString()}원` },
            { label: '환불 예정', value: `${selected.refundAmount.toLocaleString()}원` },
          ]}
          fields={[
            { label: '수량', value: `${selected.quantity}개` },
            { label: '반품 배송비 차감', value: selected.deductFee > 0 ? `${selected.deductFee.toLocaleString()}원 (고객 부담)` : '무료 (판매자 부담)' },
            { label: '회수지 주소', value: selected.pickupAddress },
            { label: '신청 일시', value: selected.requestedAt },
            { label: '상세 사유', value: selected.reasonDetail },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>반품 신청 사유 내용</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {selected.reasonDetail}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
