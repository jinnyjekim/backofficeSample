import { useMemo, useState } from 'react';
import styles from './UnitPricePage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  FILTER_KEYS,
  PRICE_COLUMNS,
  PRICE_GRID_MIN_WIDTH,
  PRICE_GRID_TEMPLATE,
  UNIT_PRICES,
  buildPriceRowCells,
  computeCounts,
  filterList,
  withCalc,
  type PriceFilterKey,
  type UnitPrice,
} from './unitPriceData';
import { buildUnitPriceDetail } from './unitPriceDetail';
import { UnitPriceDetailDrawer } from './UnitPriceDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

export function UnitPricePage() {
  const [data, setData] = useState<UnitPrice[]>(UNIT_PRICES);
  const [filter, setFilter] = useState<PriceFilterKey>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showChangePanel, setShowChangePanel] = useState(false);

  const calc = useMemo(() => withCalc(data), [data]);
  const counts = useMemo(() => computeCounts(calc), [calc]);
  const filtered = useMemo(() => filterList(calc, filter, q), [calc, filter, q]);

  const selected = selectedId ? calc.find((p) => p.id === selectedId) ?? null : null;
  const detail = selected ? buildUnitPriceDetail(selected) : null;

  function openPrice(id: string) {
    setSelectedId(id);
    setActiveTab('info');
    setShowChangePanel(false);
  }

  function confirmChange() {
    if (!selected) return;
    const id = selected.id;
    setData((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, history: [{ when: '방금', action: '계약단가 변경 요청', by: 'admin01' }, ...p.history] }
          : p,
      ),
    );
    setShowChangePanel(false);
  }

  const rows: GridRow[] = filtered.map((p) => ({
    id: p.id,
    cells: buildPriceRowCells(p),
    onClick: () => openPrice(p.id),
  }));

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === 1 }));

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.title}>계약 단가 관리</div>
          <div className={styles.subtitle}>계약별 상품 단가와 적용기간을 관리합니다.</div>
        </div>
        <button type="button" className={styles.registerBtn}>+ 계약 단가 등록</button>
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
            <option>상품코드</option>
            <option>상품명</option>
            <option>거래처명</option>
          </select></label>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="상품코드, 상품명 또는 거래처명"
          />
          <button type="button" className={styles.searchBtn}>검색</button>
        </div>
        <div className={styles.filterRow}>
          <label className="globalFilterField"><span>상태</span><select aria-label="상태" className={styles.selectSm}>
            <option>상태 전체</option>
            <option>적용중</option>
            <option>적용대기</option>
            <option>만료</option>
          </select></label>
          <label className="globalFilterField"><span>단가유형</span><select aria-label="단가유형" className={styles.selectSm}>
            <option>단가유형 전체</option>
            <option>고정가</option>
            <option>할인율</option>
            <option>구간할인</option>
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
          columns={PRICE_COLUMNS}
          rows={rows}
          gridTemplate={PRICE_GRID_TEMPLATE}
          minWidth={PRICE_GRID_MIN_WIDTH}
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="해당 조건의 계약 단가 정보가 없습니다."
        />
      </div>

      {detail && (
        <UnitPriceDetailDrawer
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
