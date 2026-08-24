import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import { buildSettlementRows, SETTLEMENT_GRID_COLUMNS, SETTLEMENT_GRID_MIN_WIDTH, SETTLEMENT_GRID_TEMPLATE } from './settlementGrid';
import { matchesQuery, type Settlement } from './settlementData';

const PAGE_LABELS = ['1', '2'];

interface Props {
  title: string;
  subtitle: string;
  bannerBg: string;
  bannerFg: string;
  bannerLabel: string;
  emptyText: string;
  filter: (r: Settlement) => boolean;
}

export function SettlementStatusPage({ title, subtitle, bannerBg, bannerFg, bannerLabel, emptyText, filter }: Props) {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [q, setQ] = useState('');
  const [page, setPage] = useState('1');

  const scoped = useMemo(() => settlements.filter(filter), [settlements, filter]);
  const filtered = useMemo(() => scoped.filter((r) => matchesQuery(r, q)), [scoped, q]);
  const rows = buildSettlementRows(filtered, openDetail);

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>

        <div className={styles.statusBanner} style={{ background: bannerBg, color: bannerFg }}>
          <span>{bannerLabel}</span>
          <span className={styles.statusBannerCount}>{scoped.length}건</span>
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <select className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>정산번호</option>
              <option>정산대상</option>
              <option>사업자번호</option>
            </select>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="정산번호, 회사명 또는 사업자번호"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <select className={styles.selectXs} defaultValue="정산대상 전체">
              <option>정산대상 전체</option>
              <option>회사 01</option>
              <option>회사 02</option>
              <option>회사 03</option>
            </select>
            <select className={styles.selectXs} defaultValue="담당자 전체">
              <option>담당자 전체</option>
              <option>admin01</option>
              <option>admin02</option>
              <option>admin03</option>
            </select>
            <button type="button" className={styles.detailFilterBtn}>상세 필터 ＋</button>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => setQ('')}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={SETTLEMENT_GRID_COLUMNS}
          rows={rows}
          gridTemplate={SETTLEMENT_GRID_TEMPLATE}
          minWidth={SETTLEMENT_GRID_MIN_WIDTH}
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText={emptyText}
        />
      </div>

      {selected && (
        <SettlementDetailDrawer
          settlement={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={closeDetail}
          showHoldPanel={showHoldPanel}
          onToggleHoldPanel={toggleHoldPanel}
          onConfirmSettle={confirmSettle}
          onRequestPay={requestPay}
          onRetryPay={retryPay}
          onResume={resume}
          onConfirmHold={confirmHold}
        />
      )}
    </div>
  );
}
