import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast } from '../../components/common';
import { CARRIER_INFOS, type CarrierInfo } from './deliveryExtraData';

const GRID_TEMPLATE = '120px 140px minmax(180px, 1fr) 100px 160px 100px 90px 120px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '배송사코드' },
  { label: '택배사명' },
  { label: '서비스 유형' },
  { label: '출고마감' },
  { label: '트래킹 연동방식' },
  { label: '배송성공률' },
  { label: '연동상태' },
  { label: '담당조직' },
];

const CARRIER_STATUS_META: Record<string, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#059669' },
  점검: { bg: '#fffbeb', fg: '#b45309' },
  중지: { bg: '#f4f4f5', fg: '#71717a' },
};

const QUICK_FILTERS = ['전체', '정상', '점검', '중지'] as const;

export function DeliveryCarriersPage() {
  const [items, setItems] = useState<CarrierInfo[]>(CARRIER_INFOS);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick = filter === '전체' || item.status === filter;
      const matchKey =
        !keyword ||
        `${item.id} ${item.code} ${item.name} ${item.serviceType} ${item.owner}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchKey;
    });
  }, [items, filter, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === '정상' ? '중지' : '정상';
          const msg = `${item.name} 택배사 연동 상태가 [${nextStatus}] 상태로 변경되었습니다.`;
          showToast({ message: msg, type: 'success' });
          return {
            ...item,
            status: nextStatus,
            updatedAt: '2026.08.27 15:45',
          };
        }
        return item;
      })
    );
  };

  const rows: GridRow[] = filtered.map((item) => {
    const sm = CARRIER_STATUS_META[item.status] ?? { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.name, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: item.serviceType, color: '#3f3f46', size: '12px' },
        { kind: 'text', text: item.cutoffTime, color: '#18181b', size: '12px', weight: 600 },
        { kind: 'text', text: item.trackingMethod, color: '#52525b', size: '12px' },
        { kind: 'text', text: item.successRate, align: 'right', weight: 700, color: '#059669' },
        { kind: 'badge', text: item.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: item.owner, color: '#71717a', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>배송사 관리</div>
            <div className={styles.subtitle}>연동된 택배사 목록과 API 송수신 상태, 마감 시간 및 일일 처리량을 관리합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = items.filter((item) => k === '전체' || item.status === k).length;
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
                <option>배송사코드</option>
                <option>택배사명</option>
                <option>담당조직</option>
              </select>
            </label>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="배송사코드 / 택배사명 / 서비스 유형 / 담당조직"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
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
          <span className={styles.resultLabel}>{`총 ${filtered.length}개 배송사`}</span>
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
          minWidth="1010px"
          showPagination={false}
          empty={rows.length === 0}
          emptyText="조건에 해당하는 배송사가 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`배송사 설정 · ${selected.id}`}
          title={selected.name}
          status={selected.status}
          statusMeta={CARRIER_STATUS_META[selected.status] ?? { bg: '#f4f4f5', fg: '#52525b' }}
          subtitle={`${selected.serviceType} · 코드 [${selected.code}]`}
          onClose={() => setSelectedId(null)}
          actions={
            <button
              type="button"
              className={selected.status === '정상' ? drawer.dangerBtn : drawer.primaryBtn}
              onClick={() => toggleStatus(selected.id)}
            >
              {selected.status === '정상' ? '연동 중지' : '연동 재개'}
            </button>
          }
          stats={[
            { label: '배송 성공률', value: selected.successRate },
            { label: '일일 처리량', value: selected.dailyCapacity },
            { label: '출고 마감', value: selected.cutoffTime },
          ]}
          fields={[
            { label: 'API 엔드포인트', value: selected.apiEndpoint },
            { label: '트래킹 방식', value: selected.trackingMethod },
            { label: '담당 조직', value: selected.owner },
            { label: '최근 설정 갱신', value: selected.updatedAt },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>관리 가이드</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            택배사 연동을 중지하면 해당 택배사의 신규 송장 채번이 제한되며, 출고 처리 시 타 택배사 선택을 유도합니다. 기존 배송 건의 배송 추적 데이터는 보존됩니다.
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
