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
            <button
              key={k}
              type="button"
              className={`${styles.quickFilter} ${active ? styles.quickFilterActive : ''}`}
              onClick={() => setFilter(k)}
            >
              <span className={styles.quickFilterLabel}>{k}</span>
              <span className={styles.quickFilterCount}>{counts[k]}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchRow}>
          <select className={styles.select}>
            <option>전체</option>
            <option>계약번호</option>
            <option>거래처명</option>
            <option>상품명</option>
            <option>상품코드</option>
          </select>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="계약번호 · 거래처 · 상품"
          />
          <button type="button" className={styles.searchBtn}>검색</button>
        </div>
        <div className={styles.filterRow}>
          <select className={styles.selectSm}>
            <option>거래처 전체</option>
            <option>회사 01</option>
            <option>회사 02</option>
          </select>
          <select className={styles.selectSm}>
            <option>계약상태 전체</option>
            <option>계약 예정</option>
            <option>계약중</option>
            <option>만료</option>
          </select>
          <select className={styles.selectSm}>
            <option>단가상태 전체</option>
            <option>적용예정</option>
            <option>적용중</option>
            <option>종료</option>
          </select>
          <button type="button" className={styles.detailFilterBtn}>상세 필터 ＋</button>
          <div className={styles.spacer} />
          <button type="button" className={styles.clearBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
        </div>
      </div>

      <div className={styles.resultRow}>
        <span className={styles.resultLabel}>총 {filtered.length}건</span>
        <div className={styles.resultActions}>
          <button type="button" className={styles.downloadBtn}>대량 등록</button>
          <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
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
          emptyText="등록된 계약 단가가 없습니다. 계약에 포함된 상품의 단가를 설정해 주세요."
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
