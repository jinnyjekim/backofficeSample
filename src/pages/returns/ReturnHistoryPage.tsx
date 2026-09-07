import { useMemo, useState } from 'react';
import styles from '../delivery/deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { INITIAL_RETURNS, STAGE_META, type ReturnItem } from './returnsData';

const GRID_TEMPLATE = '140px 140px 90px minmax(180px, 1fr) 100px 110px 120px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '반품번호' },
  { label: '주문번호' },
  { label: '고객명' },
  { label: '반품상품' },
  { label: '진행단계' },
  { label: '담당자' },
  { label: '최근갱신' },
  { label: '관리' },
];

const QUICK_FILTERS = ['전체', '반품 요청', '반품 승인', '반품 회수', '회수 완료', '상품 확인', '반품 완료', '반품 반려'] as const;

export function ReturnHistoryPage() {
  const [items] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick = filter === '전체' || item.stage === filter;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.assignee}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchKey;
    });
  }, [items, filter, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const rows: GridRow[] = filtered.map((item) => {
    const sm = STAGE_META[item.stage] ?? { bg: '#f4f4f5', fg: '#52525b' };
    const latestDate = item.completedAt || item.rejectedAt || item.inspectedAt || item.collectedAt || item.approvedAt || item.requestedAt;
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.orderId, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.member, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.product, color: '#18181b', size: '12px' },
        { kind: 'badge', text: item.stage, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: item.assignee, color: '#52525b', size: '12px' },
        { kind: 'text', text: latestDate, color: '#71717a', size: '11.5px', numeric: true },
        { kind: 'link', text: '이력', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>반품 이력</div>
            <div className={styles.subtitle}>반품 신청 접수부터 수거, 실물 검수, 최종 환불 및 반려까지의 전체 처리 이력을 조회합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = items.filter((item) => k === '전체' || item.stage === k).length;
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
                <option>고객명</option>
                <option>담당자</option>
              </select>
            </label>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="반품번호 / 주문번호 / 고객명 / 상품명 / 담당자"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>조회기간</span>
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
          <span className={styles.resultLabel}>{`총 ${filtered.length}건 이력 기록`}</span>
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
          minWidth="1050px"
          showPagination
          pages={[{ label: '1', active: true }]}
          empty={rows.length === 0}
          emptyText="조건에 해당하는 반품 이력이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`반품 감사 이력 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님`}
          onClose={() => setSelectedId(null)}
          stats={[
            { label: '진행 단계', value: selected.stage },
            { label: '담당자', value: selected.assignee },
            { label: '환불 금액', value: `${selected.refundAmount.toLocaleString()}원` },
          ]}
          fields={[
            { label: '반품 사유', value: `${selected.reasonCategory} - ${selected.reasonDetail}` },
            { label: '회수 송장번호', value: selected.returnInvoiceNo },
            { label: '신청 일시', value: selected.requestedAt },
            { label: '최종 상태', value: selected.stage },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>상태 변경 감사 타임라인</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {selected.history.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                <strong style={{ minWidth: '150px' }}>{h.title}</strong>
                <span style={{ color: '#71717a' }}>{h.when}</span>
                {h.by && <span style={{ color: '#a1a1aa' }}>({h.by})</span>}
              </div>
            ))}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
