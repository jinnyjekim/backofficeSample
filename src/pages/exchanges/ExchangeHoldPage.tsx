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
  INITIAL_EXCHANGES,
  matchesExchangeKeyword,
  type ExchangeItem,
  type HoldReason,
} from './exchangeData';

const HOLD_REASONS: Array<'전체' | HoldReason> = [
  '전체',
  '재고 부족',
  '고객 연락 두절',
  '배송비 미입금',
  '기타',
];

const COLUMNS: GridColumn[] = [
  { label: '교환번호' },
  { label: '주문번호' },
  { label: '고객명 / 연락처' },
  { label: '교환 상품 / 희망 옵션' },
  { label: '보류 사유' },
  { label: '보류 상세 및 메모' },
  { label: '담당자' },
  { label: '보류 일시' },
];

export function ExchangeHoldPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [selectedReason, setSelectedReason] = useState<'전체' | HoldReason>('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const holdItems = useMemo(
    () => items.filter((item) => item.stage === '교환 보류'),
    [items]
  );

  const filtered = useMemo(() => {
    return holdItems.filter((item) => {
      if (selectedReason !== '전체' && item.holdReason !== selectedReason) return false;
      return matchesExchangeKeyword(item, keyword);
    });
  }, [holdItems, keyword, selectedReason]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  // 1) 보류 해제 -> 재출고(출고 준비) 단계로 재진입
  const releaseHold = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '출고 준비',
              stockStatus: '보류 해제 (출고 준비 중)',
              holdMemo: `[보류 해제 완료] ${item.holdMemo || ''}`,
              updatedAt: '2026-09-07 16:00',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건의 보류가 해제되어 [재출고 - 출고 준비] 단계로 복귀했습니다.`,
      type: 'success',
    });
    setSelectedId(null);
  };

  // 2) 교환 반려 (원상복구 불가 시 반려 종결)
  const rejectHold = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '교환 반려',
              rejectedAt: '2026-09-07 16:00',
              stockStatus: '보류 건 최종 반려',
              updatedAt: '2026-09-07 16:00',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건을 교환 반려 처리하여 [교환 이력]으로 보냈습니다.`,
      type: 'danger',
    });
    setSelectedId(null);
  };

  // 3) 고객 재연락 메모 갱신
  const recordContact = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              updatedAt: '2026-09-07 16:10',
              holdMemo: `${item.holdMemo || ''} (09/07 16:10 고객 재안내 알림톡 발송 완료)`,
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 고객 알림톡 재발송 및 안내 이력을 등록했습니다.`,
      type: 'info',
    });
  };

  const rows: GridRow[] = filtered.map((item) => ({
    id: item.id,
    onClick: () => setSelectedId(item.id),
    cells: [
      { kind: 'text', text: item.id, weight: 600 },
      { kind: 'text', text: item.orderId },
      {
        kind: 'stack',
        title: item.member,
        subtitle: item.phone || '-',
      },
      {
        kind: 'stack',
        title: item.product,
        subtitle: `${item.optionBefore} → ${item.optionAfter}`,
      },
      {
        kind: 'badge',
        text: item.holdReason || '보류',
        bg: '#fffbeb',
        fg: '#b45309',
      },
      {
        kind: 'text',
        text: item.holdMemo || '사유 확인 대기',
      },
      { kind: 'text', text: item.assignee },
      { kind: 'text', text: item.updatedAt, numeric: true },
    ],
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>교환 보류</div>
            <div className={styles.subtitle}>
              재고 부족, 고객 연락 두절, 배송비 미입금 등 처리가 멈춘 건을 모니터링하고 사유 해소 시 업무에 복귀시킵니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="교환번호 / 주문번호 / 고객명 / 연락처 / 보류메모"
            />
            <button className={styles.searchBtn}>검색</button>

            {/* 사유별 탭: 전체 | 재고 부족 | 고객 연락 두절 | 배송비 미입금 | 기타 */}
            <div className={styles.quickFilters}>
              {HOLD_REASONS.map((reason) => {
                const count = holdItems.filter(
                  (item) => reason === '전체' || item.holdReason === reason
                ).length;
                return (
                  <CommonButton
                    key={reason}
                    variant={selectedReason === reason ? 'primary-light' : 'secondary'}
                    size="md"
                    className={`${styles.qfBtn} ${selectedReason === reason ? styles.active : ''}`}
                    onClick={() => setSelectedReason(reason)}
                  >
                    <span className={styles.qfLabel}>{reason}</span>
                    <span className={styles.qfCount}>{count}</span>
                  </CommonButton>
                );
              })}
            </div>
          </div>

          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>보류일</span>
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
                setSelectedReason('전체');
                setKeyword('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 보류 진행 중</span>
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
          gridTemplate="130px 140px 120px minmax(200px,1.2fr) 110px minmax(220px,1.8fr) 85px 130px"
          minWidth="1135px"
          empty={!rows.length}
          emptyText="보류 중인 교환 건이 없습니다."
          showPagination
          pages={[{ label: '1', active: true }]}
        />
      </div>

      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="교환 보류 상세"
          onClose={() => setSelectedId(null)}
          actions={
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                className={drawer.primaryBtn}
                style={{ flex: 1.2 }}
                onClick={releaseHold}
              >
                보류 해제 (재출고 준비로 복귀)
              </button>
              <button
                className={drawer.secondaryBtn}
                style={{ flex: 0.8 }}
                onClick={recordContact}
              >
                고객 알림 재발송
              </button>
              <button
                className={drawer.dangerBtn}
                style={{ flex: 0.8 }}
                onClick={rejectHold}
              >
                교환 반려 종결
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}
