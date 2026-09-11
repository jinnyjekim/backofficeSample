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

type CollectionTab = 'ALL' | 'COLLECTING' | 'COLLECTED' | 'INSPECTION';

const COLUMNS: GridColumn[] = [
  { label: '교환번호' },
  { label: '주문번호' },
  { label: '고객명' },
  { label: '교환 상품 / 변경 옵션' },
  { label: '단계' },
  { label: '택배사 / 회수 송장' },
  { label: '검수 및 상태' },
  { label: '최근 변경일시' },
];

export function ExchangeCollectionPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [activeTab, setActiveTab] = useState<CollectionTab>('ALL');
  const [carrier, setCarrier] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 회수·검수 범위 항목들
  const collectionStages: ExchangeStage[] = ['상품 회수', '회수 중', '회수 완료', '검수 대기'];

  const collectionItems = useMemo(
    () => items.filter((item) => collectionStages.includes(item.stage)),
    [items]
  );

  const counts = useMemo(
    () => ({
      ALL: collectionItems.length,
      COLLECTING: collectionItems.filter((i) => i.stage === '상품 회수' || i.stage === '회수 중').length,
      COLLECTED: collectionItems.filter((i) => i.stage === '회수 완료').length,
      INSPECTION: collectionItems.filter((i) => i.stage === '검수 대기').length,
    }),
    [collectionItems]
  );

  const filtered = useMemo(() => {
    return collectionItems.filter((item) => {
      if (activeTab === 'COLLECTING' && item.stage !== '상품 회수' && item.stage !== '회수 중') return false;
      if (activeTab === 'COLLECTED' && item.stage !== '회수 완료') return false;
      if (activeTab === 'INSPECTION' && item.stage !== '검수 대기') return false;
      if (carrier && item.carrier !== carrier) return false;
      return matchesExchangeKeyword(item, keyword);
    });
  }, [activeTab, carrier, collectionItems, keyword]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  // 1) 회수 완료 처리 (회수 중 -> 회수 완료)
  const markAsCollected = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '회수 완료',
              inspection: '물류 입고 완료 (검수 준비)',
              updatedAt: '2026-09-07 13:00',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건을 물류센터 [회수 완료]로 변경했습니다.`,
      type: 'success',
    });
    setSelectedId(null);
  };

  // 2) 검수 단계로 전환 (회수 완료 -> 검수 대기)
  const moveToInspection = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '검수 대기',
              inspection: '실물 상태 검수 진행 중 (오염/파손 점검)',
              updatedAt: '2026-09-07 13:30',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건의 실물 [검수]를 시작했습니다.`,
      type: 'info',
    });
    setSelectedId(null);
  };

  // 3-A) 검수 통과 -> 재출고(출고 준비) 인계
  const passInspection = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '출고 준비',
              inspection: '검수 통과 (정상 입고 확인)',
              stockStatus: '피킹 준비 중',
              updatedAt: '2026-09-07 14:00',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 검수 통과 완료! [재출고 - 출고 준비] 단계로 인계했습니다.`,
      type: 'success',
    });
    setSelectedId(null);
  };

  // 3-B) 검수 불합격 -> 교환 반려 (원주소 반송)
  const failInspection = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '교환 반려',
              inspection: '검수 불합격 (오염 또는 실사용 흔적 확인)',
              stockStatus: '착불 반송 처리',
              rejectedAt: '2026-09-07 14:00',
              updatedAt: '2026-09-07 14:00',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 검수 불합격으로 교환 반려 처리되었습니다. [교환 이력]에서 확인 가능합니다.`,
      type: 'danger',
    });
    setSelectedId(null);
  };

  // 3-C) 검수 중 문제 발견 -> 교환 보류
  const holdInspection = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage: '교환 보류',
              inspection: '부속품 일부 누락 확인 (고객 통화 필요)',
              holdReason: '기타',
              holdMemo: '반송 박스 내 택 및 정품 파우치 누락. 고객 확인 전까지 보류.',
              updatedAt: '2026-09-07 14:00',
            }
          : item
      )
    );
    showToast({
      message: `${selected.id} 건을 [교환 보류] 목록으로 이동했습니다.`,
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
      {
        kind: 'stack',
        title: item.product,
        subtitle: `${item.optionBefore} → ${item.optionAfter}`,
      },
      {
        kind: 'badge',
        text: item.stage,
        ...EXCHANGE_STAGE_META[item.stage],
      },
      {
        kind: 'stack',
        title: item.carrier,
        subtitle: item.trackingNo,
      },
      {
        kind: 'badge',
        text: item.inspection,
        bg: item.stage === '검수 대기' ? '#faf5ff' : '#f8fafc',
        fg: item.stage === '검수 대기' ? '#7e22ce' : '#475569',
      },
      { kind: 'text', text: item.updatedAt, numeric: true },
    ],
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>회수·검수</div>
            <div className={styles.subtitle}>
              회수 진행 상황을 추적하고, 입고된 실물 상품의 상태를 검수하여 재출고 여부를 판정합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="교환번호 / 주문번호 / 고객명 / 회수 송장 / 상품명"
            />
            <button className={styles.searchBtn}>검색</button>

            {/* 탭: 회수 중 | 회수 완료 | 검수 */}
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
                variant={activeTab === 'COLLECTING' ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${activeTab === 'COLLECTING' ? styles.active : ''}`}
                onClick={() => setActiveTab('COLLECTING')}
              >
                <span className={styles.qfLabel}>회수 중</span>
                <span className={styles.qfCount}>{counts.COLLECTING}</span>
              </CommonButton>
              <CommonButton
                variant={activeTab === 'COLLECTED' ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${activeTab === 'COLLECTED' ? styles.active : ''}`}
                onClick={() => setActiveTab('COLLECTED')}
              >
                <span className={styles.qfLabel}>회수 완료</span>
                <span className={styles.qfCount}>{counts.COLLECTED}</span>
              </CommonButton>
              <CommonButton
                variant={activeTab === 'INSPECTION' ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${activeTab === 'INSPECTION' ? styles.active : ''}`}
                onClick={() => setActiveTab('INSPECTION')}
              >
                <span className={styles.qfLabel}>검수</span>
                <span className={styles.qfCount}>{counts.INSPECTION}</span>
              </CommonButton>
            </div>
          </div>

          <div className={styles.filterRow2}>
            <label className="globalFilterField">
              <span>택배사</span>
              <select
                className={styles.selectSm}
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
                setCarrier('');
                setKeyword('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 목록</span>
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
          gridTemplate="130px 140px 90px minmax(200px,1fr) 95px 140px 170px 130px"
          minWidth="1095px"
          empty={!rows.length}
          emptyText="해당 상태의 회수·검수 건이 없습니다."
          showPagination
          pages={[{ label: '1', active: true }]}
        />
      </div>

      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="회수·검수 관리"
          onClose={() => setSelectedId(null)}
          actions={
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {(selected.stage === '상품 회수' || selected.stage === '회수 중') && (
                <button
                  className={drawer.primaryBtn}
                  style={{ flex: 1 }}
                  onClick={markAsCollected}
                >
                  물류 입고 완료 처리
                </button>
              )}
              {selected.stage === '회수 완료' && (
                <button
                  className={drawer.primaryBtn}
                  style={{ flex: 1 }}
                  onClick={moveToInspection}
                >
                  실물 검수 시작
                </button>
              )}
              {selected.stage === '검수 대기' && (
                <>
                  <button
                    className={drawer.primaryBtn}
                    style={{ flex: 1.2 }}
                    onClick={passInspection}
                  >
                    검수 합격 (재출고 인계)
                  </button>
                  <button
                    className={drawer.secondaryBtn}
                    style={{ flex: 0.8 }}
                    onClick={holdInspection}
                  >
                    검수 보류
                  </button>
                  <button
                    className={drawer.dangerBtn}
                    style={{ flex: 0.8 }}
                    onClick={failInspection}
                  >
                    검수 불합격 (반려)
                  </button>
                </>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
