import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonButton } from '../../components/common';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DatePicker } from '../../components/forms/DatePicker';
import styles from '../delivery/deliveryShared.module.css';
import { ExchangeDetailDrawer } from './ExchangeDetailDrawer';
import {
  EXCHANGE_STAGE_META,
  INITIAL_EXCHANGES,
  matchesExchangeKeyword,
  type ExchangeItem,
  type ExchangeStage,
} from './exchangeData';

type HistoryFilter = '전체' | '교환 완료' | '교환 반려' | '교환 철회';

const COLUMNS: GridColumn[] = [
  { label: '교환번호 / 접수일' },
  { label: '주문번호' },
  { label: '고객명' },
  { label: '교환 상품 / 교환 사유' },
  { label: '최종 상태' },
  { label: '종결 처리일시' },
  { label: '담당자' },
  { label: '배송 / 반송 / 처리 정보' },
];

export function ExchangeHistoryPage() {
  const [filterType, setFilterType] = useState<HistoryFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 종료된 이력 건들 (완료, 반려, 철회)
  const historyStages: ExchangeStage[] = ['교환 완료', '교환 반려', '교환 철회'];

  const historyItems = useMemo(
    () => INITIAL_EXCHANGES.filter((item) => historyStages.includes(item.stage)),
    []
  );

  const counts = useMemo(
    () => ({
      전체: historyItems.length,
      '교환 완료': historyItems.filter((i) => i.stage === '교환 완료').length,
      '교환 반려': historyItems.filter((i) => i.stage === '교환 반려').length,
      '교환 철회': historyItems.filter((i) => i.stage === '교환 철회').length,
    }),
    [historyItems]
  );

  const filtered = useMemo(() => {
    return historyItems.filter((item) => {
      if (filterType !== '전체' && item.stage !== filterType) return false;
      return matchesExchangeKeyword(item, keyword);
    });
  }, [filterType, historyItems, keyword]);

  const selected = historyItems.find((item) => item.id === selectedId) ?? null;

  const rows: GridRow[] = filtered.map((item) => {
    const closedDate =
      item.completedAt || item.rejectedAt || item.withdrawnAt || item.updatedAt;

    let subInfo = item.trackingNo !== '-' ? `${item.carrier} (${item.trackingNo})` : '-';
    if (item.reshipTrackingNo) {
      subInfo = `재출고: ${item.reshipTrackingNo}`;
    } else if (item.stage === '교환 반려') {
      subInfo = '반송 처리';
    } else if (item.stage === '교환 철회') {
      subInfo = '고객 취소';
    }

    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'stack', title: item.id, subtitle: item.requestedAt },
        { kind: 'text', text: item.orderId },
        { kind: 'text', text: item.member, weight: 600 },
        {
          kind: 'stack',
          title: item.product,
          subtitle: `${item.reason} (${item.optionBefore} → ${item.optionAfter})`,
        },
        {
          kind: 'badge',
          text: item.stage,
          ...EXCHANGE_STAGE_META[item.stage],
        },
        { kind: 'text', text: closedDate, numeric: true },
        { kind: 'text', text: item.assignee },
        {
          kind: 'badge',
          text: subInfo,
          bg: '#f8fafc',
          fg: '#475569',
        },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>교환 이력</div>
            <div className={styles.subtitle}>
              종료된 모든 교환 건(완료, 반려, 철회)의 최종 처리 결과와 세부 타임라인을 조회합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="교환번호 / 주문번호 / 고객명 / 상품명 / 송장번호"
            />
            <button className={styles.searchBtn}>검색</button>

            {/* 필터: 전체 | 교환 완료 | 교환 반려 | 교환 철회 */}
            <div className={styles.quickFilters}>
              {(['전체', '교환 완료', '교환 반려', '교환 철회'] as const).map((stageKey) => (
                <CommonButton
                  key={stageKey}
                  variant={filterType === stageKey ? 'primary-light' : 'secondary'}
                  size="md"
                  className={`${styles.qfBtn} ${filterType === stageKey ? styles.active : ''}`}
                  onClick={() => setFilterType(stageKey)}
                >
                  <span className={styles.qfLabel}>{stageKey}</span>
                  <span className={styles.qfCount}>{counts[stageKey]}</span>
                </CommonButton>
              ))}
            </div>
          </div>

          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>종결 처리일</span>
              <span className={styles.dateRange}>
                <DatePicker defaultValue="2026-08-25" />
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
                setKeyword('');
                setFilterType('전체');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 교환 이력 아카이브</span>
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
          gridTemplate="150px 140px 90px minmax(210px,1.2fr) 95px 130px 85px 160px"
          minWidth="1060px"
          empty={!rows.length}
          emptyText="조건에 일치하는 교환 이력 건이 없습니다."
          showPagination
          pages={[{ label: '1', active: true }]}
        />
      </div>

      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="교환 처리 이력 상세"
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
