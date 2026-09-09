import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { HOLD_DELIVERIES, type HoldDelivery } from './deliveryExtraData';

const GRID_TEMPLATE = '120px 140px 90px 90px 120px 100px 120px 110px minmax(150px, 1fr) 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '배송번호' },
  { label: '주문번호' },
  { label: '수령인' },
  { label: '택배사' },
  { label: '보류일시' },
  { label: '보류유형' },
  { label: '요청자' },
  { label: '해제예정일' },
  { label: '보류사유 및 상세' },
  { label: '관리' },
];

const HOLD_REASON_META: Record<string, { bg: string; fg: string }> = {
  '고객 요청': { bg: '#eff6ff', fg: '#1d4ed8' },
  '배송지 변경': { bg: '#f5f3ff', fg: '#7c3aed' },
  '기상/재해': { bg: '#fef2f2', fg: '#dc2626' },
  '재고 검수': { bg: '#fffbeb', fg: '#b45309' },
  '주문 취소 접수': { bg: '#f4f4f5', fg: '#52525b' },
};

const QUICK_FILTERS = ['전체', '고객 요청', '배송지 변경', '기상/재해', '보류중', '해제 대기'] as const;

export function DeliveryHoldPage() {
  const [items, setItems] = useState<HoldDelivery[]>(HOLD_DELIVERIES);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [reasonType, setReasonType] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick =
        filter === '전체' ||
        item.reasonType === filter ||
        item.status === filter;
      const matchReason = !reasonType || item.reasonType === reasonType;
      const matchKey =
        !keyword ||
        `${item.id} ${item.order} ${item.receiver} ${item.details} ${item.requester}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchReason && matchKey;
    });
  }, [items, filter, reasonType, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handleRelease = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: '출고 재개',
              history: [
                ...item.history,
                { when: '2026.08.27 15:35', title: '보류 해제 및 출고 재개 처리', by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: '배송 보류가 해제되어 출고 재개 처리되었습니다.', type: 'success' });
  };

  const rows: GridRow[] = filtered.map((item) => {
    const rm = HOLD_REASON_META[item.reasonType] ?? { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.order, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.receiver, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.carrier, color: '#71717a', size: '12px' },
        { kind: 'text', text: item.holdAt, color: '#18181b', size: '11.5px', numeric: true },
        { kind: 'badge', text: item.reasonType, bg: rm.bg, fg: rm.fg },
        { kind: 'text', text: item.requester, color: '#52525b', size: '12px' },
        { kind: 'text', text: item.targetReleaseDate, color: '#18181b', size: '11.5px', weight: 600 },
        { kind: 'text', text: item.details, color: '#3f3f46', size: '12px' },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>배송 보류</div>
            <div className={styles.subtitle}>고객 요청, 배송지 변경, 기상 악화 등으로 보류된 건을 관리하고 출고를 재개합니다.</div>
          </div>
        </div>

        

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="배송번호 / 주문번호 / 수령인 / 요청자 / 사유"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = items.filter((item) => k === '전체' || item.reasonType === k || item.status === k).length;
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
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField">
              <span>보류 유형</span>
              <select
                aria-label="보류 유형"
                className={styles.selectXs}
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
              >
                <option value="">전체 보류 유형</option>
                <option>고객 요청</option>
                <option>배송지 변경</option>
                <option>기상/재해</option>
                <option>재고 검수</option>
                <option>주문 취소 접수</option>
              </select>
            </label>
            <label className={styles.dateFilterField}>
              <span>보류일</span>
              <div className={styles.dateRange}>
                <DatePicker defaultValue="2026-08-20" />
                <span className={styles.dateSeparator}>~</span>
                <DatePicker defaultValue="2026-08-27" />
              </div>
            </label>
            <div className={styles.rowSpacer} />
            <button type="button" className="detailFilterBtn">상세 필터</button>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setFilter('전체');
                setKeyword('');
                setReasonType('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건`}</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1160px"
          showPagination
          pages={[{ label: '1', active: true }]}
          empty={rows.length === 0}
          emptyText="조건에 해당하는 배송 보류 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`배송 보류 상세 · ${selected.id}`}
          title={`${selected.order} (${selected.receiver} 님)`}
          status={selected.status}
          statusMeta={selected.status === '출고 재개' ? { bg: '#ecfdf5', fg: '#059669' } : { bg: '#fffbeb', fg: '#b45309' }}
          subtitle={`${selected.carrier} · ${selected.reasonType}`}
          onClose={() => setSelectedId(null)}
          actions={
            selected.status !== '출고 재개' ? (
              <button
                type="button"
                className={drawer.primaryBtn}
                onClick={() => handleRelease(selected.id)}
              >
                보류 해제 (출고 재개)
              </button>
            ) : undefined
          }
          stats={[
            { label: '보류 유형', value: selected.reasonType },
            { label: '요청자', value: selected.requester },
            { label: '해제 예정일', value: selected.targetReleaseDate },
          ]}
          fields={[
            { label: '보류 일시', value: selected.holdAt },
            { label: '수령인 연락처', value: selected.phone },
            { label: '택배사', value: selected.carrier },
            { label: '상세 사유', value: selected.details },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>보류 상세 내역</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#3f3f46', background: '#fffbeb', padding: '12px 14px', borderRadius: '8px', border: '1px solid #fef3c7', marginBottom: '16px' }}>
            {selected.details}
          </div>

          <div className={drawer.sectionTitleLoose}>운영 메모</div>
          <div style={{ fontSize: '12.5px', color: '#3f3f46', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {selected.memos.length ? selected.memos.map((m, idx) => <p key={idx} style={{ margin: 0 }}>[{m.when} / {m.by}] {m.text}</p>) : '등록된 운영 메모가 없습니다.'}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
