import { useMemo, useState } from 'react';
import styles from './TradeTermsPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  FILTER_KEYS,
  TERMS_COLUMNS,
  TERMS_GRID_MIN_WIDTH,
  TERMS_GRID_TEMPLATE,
  TRADE_TERMS,
  buildTermsRowCells,
  computeCounts,
  filterList,
  withCalc,
  type TermsFilterKey,
  type TradeTerms,
} from './tradeTermsData';
import { buildTradeTermsDetail } from './tradeTermsDetail';
import { TradeTermsDetailDrawer } from './TradeTermsDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

export function TradeTermsPage() {
  const [data, setData] = useState<TradeTerms[]>(TRADE_TERMS);
  const [filter, setFilter] = useState<TermsFilterKey>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('compare');
  const [showChangePanel, setShowChangePanel] = useState(false);

  const calc = useMemo(() => withCalc(data), [data]);
  const counts = useMemo(() => computeCounts(calc), [calc]);
  const filtered = useMemo(() => filterList(calc, filter, q), [calc, filter, q]);

  const selected = selectedId ? calc.find((c) => c.id === selectedId) ?? null : null;
  const detail = selected ? buildTradeTermsDetail(selected) : null;

  function openTerms(id: string) {
    setSelectedId(id);
    setActiveTab('compare');
    setShowChangePanel(false);
  }

  function confirmChange() {
    if (!selected) return;
    const id = selected.id;
    setData((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, history: [{ when: '방금', action: '거래조건 변경 요청', by: 'admin01' }, ...c.history] }
          : c,
      ),
    );
    setShowChangePanel(false);
  }

  const rows: GridRow[] = filtered.map((c) => ({
    id: c.id,
    cells: buildTermsRowCells(c),
    onClick: () => openTerms(c.id),
  }));

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === 1 }));

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.title}>계약 거래 조건 관리</div>
          <div className={styles.subtitle}>계약별 결제, 주문, 납품 및 기타 거래 조건을 관리합니다.</div>
        </div>
        <button type="button" className={styles.registerBtn}>+ 거래 조건 등록</button>
      </div>

      <div className={styles.quickFilters}>
        {FILTER_KEYS.map((k) => {
          const active = filter === k;
          return (
            <CommonButton
              key={k}
              variant={active ? 'primary-light' : 'secondary'}
              size="md"
              className={`${styles.quickFilter} ${active ? styles.quickFilterActive : ''}`}
              onClick={() => setFilter(k)}
            >
              <span className={styles.quickFilterLabel}>{k}</span>
              <span className={styles.quickFilterCount}>{counts[k]}</span>
            </CommonButton>
          );
        })}
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchRow}>
          <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.select}>
            <option>전체</option>
            <option>계약번호</option>
            <option>계약명</option>
            <option>거래처명</option>
          </select></label>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="계약번호 또는 거래처명"
          />
          <button type="button" className={styles.searchBtn}>검색</button>
        </div>
        <div className={styles.filterRow}>
          <label className="globalFilterField"><span>결제조건</span><select aria-label="결제조건" className={styles.selectSm}>
            <option>결제조건 전체</option>
            <option>익월말 현금</option>
            <option>당월말 현금</option>
            <option>선결제</option>
            <option>어음 60일</option>
          </select></label>
          <label className="globalFilterField"><span>납품조건</span><select aria-label="납품조건" className={styles.selectSm}>
            <option>납품조건 전체</option>
            <option>발주 후 7일 이내</option>
            <option>발주 후 14일 이내</option>
            <option>익일 배송</option>
            <option>주 1회 정기</option>
          </select></label>
          <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectSm}>
            <option>거래처 전체</option>
            <option>회사 01</option>
            <option>회사 02</option>
          </select></label>
          <div className={styles.spacer} />
          <button type="button" className={styles.clearBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
        </div>
      </div>

      <div className={styles.resultRow}>
        <span className={styles.resultLabel}>총 {filtered.length}건</span>
        <div className={styles.resultActions}>
          <ExcelDownloadButton type="button" data-grid-download />
          <select className={styles.selectSm}>
            <option>20개씩 보기</option>
            <option>50개씩 보기</option>
          </select>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={TERMS_COLUMNS}
          rows={rows}
          gridTemplate={TERMS_GRID_TEMPLATE}
          minWidth={TERMS_GRID_MIN_WIDTH}
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="해당 조건의 거래 조건이 없습니다."
        />
      </div>

      {detail && (
        <TradeTermsDetailDrawer
          detail={detail}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showChangePanel={showChangePanel}
          onToggleChangePanel={() => setShowChangePanel((v) => !v)}
          onConfirmChange={confirmChange}
        />
      )}
    </div>
  );
}
