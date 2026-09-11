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
  EXCHANGE_STAGE_META,
  INITIAL_EXCHANGES,
  matchesExchangeKeyword,
  type ExchangeItem,
  type ExchangeStage,
} from './exchangeData';

type ReshipTab = 'ALL' | 'PREPARING' | 'SHIPPED';

const COLUMNS: GridColumn[] = [
  { label: '교환번호' },
  { label: '주문번호' },
  { label: '고객명' },
  { label: '교환 출고 상품 / 옵션' },
  { label: '상태' },
  { label: '재출고 택배사 / 송장' },
  { label: '재고 / 출고 상태' },
  { label: '처리일시' },
];

export function ExchangeReshipPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [activeTab, setActiveTab] = useState<ReshipTab>('ALL');
  const [keyword, setKeyword] = useState('');
  const [carrier, setCarrier] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reshipStages: ExchangeStage[] = ['교환 상품 준비', '출고 준비', '재출고'];

  const reshipItems = useMemo(
    () => items.filter((item) => reshipStages.includes(item.stage)),
    [items]
  );

  const counts = useMemo(
    () => ({
      ALL: reshipItems.length,
      PREPARING: reshipItems.filter(
        (i) => i.stage === '교환 상품 준비' || i.stage === '출고 준비'
      ).length,
      SHIPPED: reshipItems.filter((i) => i.stage === '재출고').length,
    }),
    [reshipItems]
  );

  const filtered = useMemo(() => {
    return reshipItems.filter((item) => {
      if (
        activeTab === 'PREPARING' &&
        item.stage !== '출고 준비' &&
        item.stage !== '교환 상품 준비'
      )
        return false;
      if (activeTab === 'SHIPPED' && item.stage !== '재출고') return false;
      if (carrier && (item.reshipCarrier || item.carrier) !== carrier) return false;
      return matchesExchangeKeyword(item, keyword);
    });
  }, [activeTab, carrier, keyword, reshipItems]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  // 1) 출고 처리 (출고 준비 -> 재출고 송장 발행)
  const dispatchReship = () => {
    if (!selected) return;
    const newTracking = `P-260907-${Math.floor(1000 + Math.random() * 9000)}`;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '재출고',
              reshipCarrier: '우체국택배',
              reshipTrackingNo: newTracking,
              stockStatus: '재출고 완료 (배송 중)',
              updatedAt: '2026-09-07 14:40',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건의 재출고 송장을 발급하고 출고 처리했습니다. (${newTracking})`,
      type: 'success',
    });
    setSelectedId(null);
  };

  // 2) 배송 완료 처리 (재출고 -> 교환 완료 종결)
  const completeExchange = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '교환 완료',
              completedAt: '2026-09-07 15:30',
              stockStatus: '고객 수령 완료',
              updatedAt: '2026-09-07 15:30',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건의 교환 배송이 완료되어 [교환 이력]으로 종결 저장되었습니다.`,
      type: 'success',
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
      {
        kind: 'stack',
        title: item.product,
        subtitle: `교환 발송 옵션: ${item.optionAfter}`,
      },
      {
        kind: 'badge',
        text: item.stage === '재출고' ? '출고 완료 (배송 중)' : '출고 준비',
        ...EXCHANGE_STAGE_META[item.stage],
      },
      {
        kind: 'stack',
        title: item.reshipCarrier || item.carrier || '-',
        subtitle: item.reshipTrackingNo || item.trackingNo || '미발행',
      },
      {
        kind: 'badge',
        text: item.stockStatus,
        bg: item.stage === '재출고' ? '#ecfeff' : '#f5f3ff',
        fg: item.stage === '재출고' ? '#0e7490' : '#6d28d9',
      },
      { kind: 'text', text: item.updatedAt, numeric: true },
    ],
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>재출고</div>
            <div className={styles.subtitle}>
              검수를 통과한 교환 상품의 피킹/포장(출고 준비)과 새 송장 발송(출고 완료) 업무를 통합 관리합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="교환번호 / 주문번호 / 고객명 / 재출고 송장"
            />
            <button className={styles.searchBtn}>검색</button>

            {/* 탭: 출고 준비 | 출고 완료 */}
            <div className={styles.quickFilters}>
              <CommonButton
                variant={activeTab === 'ALL' ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${activeTab === 'ALL' ? styles.active : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                <span className={styles.qfLabel}>전체</span>
                <span className={styles.qfCount}>{counts.ALL}</span>
              </CommonButton>
              <CommonButton
                variant={activeTab === 'PREPARING' ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${activeTab === 'PREPARING' ? styles.active : ''}`}
                onClick={() => setActiveTab('PREPARING')}
              >
                <span className={styles.qfLabel}>출고 준비</span>
                <span className={styles.qfCount}>{counts.PREPARING}</span>
              </CommonButton>
              <CommonButton
                variant={activeTab === 'SHIPPED' ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${activeTab === 'SHIPPED' ? styles.active : ''}`}
                onClick={() => setActiveTab('SHIPPED')}
              >
                <span className={styles.qfLabel}>출고 완료</span>
                <span className={styles.qfCount}>{counts.SHIPPED}</span>
              </CommonButton>
            </div>
          </div>

          <div className={styles.filterRow2}>
            <label className="globalFilterField">
              <span>택배사</span>
              <select
                className={styles.selectSm}
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
              >
                <option value="">전체 택배사</option>
                <option>CJ대한통운</option>
                <option>우체국택배</option>
                <option>한진택배</option>
              </select>
            </label>
            <label className={styles.dateFilterField}>
              <span>처리일</span>
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
                setActiveTab('ALL');
                setKeyword('');
                setCarrier('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 재출고 관리</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="130px 140px 90px minmax(210px,1fr) 130px 150px 140px 130px"
          minWidth="1080px"
          empty={!rows.length}
          emptyText="재출고 대상 교환 건이 없습니다."
          showPagination
          pages={[{ label: '1', active: true }]}
        />
      </div>

      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="재출고 배송 상세"
          onClose={() => setSelectedId(null)}
          actions={
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {(selected.stage === '교환 상품 준비' || selected.stage === '출고 준비') && (
                <button
                  className={drawer.primaryBtn}
                  style={{ flex: 1 }}
                  onClick={dispatchReship}
                >
                  송장 발급 및 재출고 발송 처리
                </button>
              )}
              {selected.stage === '재출고' && (
                <button
                  className={drawer.primaryBtn}
                  style={{ flex: 1 }}
                  onClick={completeExchange}
                >
                  고객 배송 완료 처리 (교환 종결)
                </button>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
