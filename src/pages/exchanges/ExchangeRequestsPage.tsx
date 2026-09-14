import { PageSizeSelect } from '../../components/common';
import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonButton, showToast } from '../../components/common';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DatePicker } from '../../components/forms/DatePicker';
import styles from '../delivery/deliveryShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExchangeDetailDrawer } from './ExchangeDetailDrawer';
import {
  formatWon,
  INITIAL_EXCHANGES,
  matchesExchangeKeyword,
  type ExchangeItem,
} from './exchangeData';

const COLUMNS: GridColumn[] = [
  { label: '교환번호' },
  { label: '주문번호' },
  { label: '신청고객' },
  { label: '교환사유' },
  { label: '상품 / 옵션 변경' },
  { label: '교환금액', align: 'right' },
  { label: '재고 상태' },
  { label: '신청일시' },
];

export function ExchangeRequestsPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [reason, setReason] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const requests = useMemo(
    () => items.filter((item) => item.stage === '교환 요청'),
    [items]
  );

  const filtered = useMemo(
    () =>
      requests.filter(
        (item) =>
          (reason === '전체' || item.reason.includes(reason)) &&
          matchesExchangeKeyword(item, keyword)
      ),
    [keyword, reason, requests]
  );

  const selected = items.find((item) => item.id === selectedId) ?? null;

  // 승인 시: 바로 회수 단계(회수 중)로 인계
  const approveExchange = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '회수 중' as const,
              carrier: 'CJ대한통운',
              trackingNo: `C-260907-${Math.floor(1000 + Math.random() * 9000)}`,
              assignee: 'admin01',
              inspection: '회수 기사 방문 예정',
              updatedAt: '2026-09-07 11:30',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건을 교환 승인하여 [회수·검수] 단계로 인계했습니다. (CJ대한통운 수거 지시)`,
      type: 'success',
    });
    setSelectedId(null);
  };

  // 반려 시: 교환 이력(반려)으로 종결
  const rejectExchange = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '교환 반려' as const,
              assignee: 'admin01',
              rejectedAt: '2026-09-07 11:30',
              stockStatus: '교환 반려 종결',
              updatedAt: '2026-09-07 11:30',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건을 교환 반려 처리하여 [교환 이력]으로 이동했습니다.`,
      type: 'info',
    });
    setSelectedId(null);
  };

  // 보류 처리: 교환 보류 메뉴로 이동
  const holdExchange = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '교환 보류' as const,
              holdReason: '재고 부족',
              holdMemo: '요청 옵션 임시 품절로 인한 출고 보류 (공급처 입고 확인 중)',
              assignee: 'admin01',
              updatedAt: '2026-09-07 11:30',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건을 [교환 보류] 처리했습니다. (재고 부족)`,
      type: 'warning',
    });
    setSelectedId(null);
  };

  const rows: GridRow[] = filtered.map((item) => ({
    id: item.id,
    onClick: () => setSelectedId(item.id),
    cells: [
      { kind: 'text', text: item.id, weight: 600 },
      { kind: 'text', text: item.orderId },
      { kind: 'text', text: item.member, weight: 600 },
      { kind: 'text', text: item.reason },
      {
        kind: 'stack',
        title: item.product,
        subtitle: `${item.optionBefore} → ${item.optionAfter}`,
      },
      {
        kind: 'text',
        text: formatWon(item.amount),
        align: 'right',
        numeric: true,
        weight: 600,
      },
      {
        kind: 'badge',
        text: item.stockStatus,
        bg: item.stockStatus.includes('가능') ? '#ecfdf5' : '#fffbeb',
        fg: item.stockStatus.includes('가능') ? '#047857' : '#b45309',
      },
      { kind: 'text', text: item.requestedAt, numeric: true },
    ],
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>교환 요청</div>
            <div className={styles.subtitle}>
              고객이 신청한 신규 교환 건을 심사하여 승인(회수 지시), 반려 또는 보류 처리합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="교환번호 / 주문번호 / 고객명 / 상품명"
            />
            <button className={styles.searchBtn}>검색</button>
            <div className={styles.quickFilters}>
              {['전체', '사이즈', '색상', '불량'].map((value) => (
                <CommonButton
                  key={value}
                  variant={reason === value ? 'primary-light' : 'secondary'}
                  size="md"
                  className={`${styles.qfBtn} ${reason === value ? styles.active : ''}`}
                  onClick={() => setReason(value)}
                >
                  <span className={styles.qfLabel}>{value}</span>
                  <span className={styles.qfCount}>
                    {
                      requests.filter(
                        (item) => value === '전체' || item.reason.includes(value)
                      ).length
                    }
                  </span>
                </CommonButton>
              ))}
            </div>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>신청일</span>
              <span className={styles.dateRange}>
                <DatePicker defaultValue="2026-09-01" />
                <span className={styles.dateSeparator}>~</span>
                <DatePicker defaultValue="2026-09-07" />
              </span>
            </label>
            <span className={styles.rowSpacer} />
            <button type="button" className="detailFilterBtn">
              상세 필터
            </button>
            <button
              className={styles.resetBtn}
              onClick={() => {
                setReason('전체');
                setKeyword('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>신규 요청 {filtered.length}건 대기 중</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton data-grid-download />
            <PageSizeSelect className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </PageSizeSelect>
          </div>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="130px 140px 90px 120px minmax(200px,1fr) 100px 130px 130px"
          minWidth="1040px"
          empty={!rows.length}
          emptyText="접수된 교환 요청이 없습니다."
          showPagination
          pages={[{ label: '1', active: true }]}
        />
      </div>

      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="교환 요청 심사"
          onClose={() => setSelectedId(null)}
          actions={
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                className={drawer.primaryBtn}
                style={{ flex: 1 }}
                onClick={approveExchange}
              >
                교환 승인 (회수 지시)
              </button>
              <button
                className={drawer.secondaryBtn}
                style={{ flex: 0.8 }}
                onClick={holdExchange}
              >
                교환 보류
              </button>
              <button
                className={drawer.dangerBtn}
                style={{ flex: 0.8 }}
                onClick={rejectExchange}
              >
                교환 반려
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}
