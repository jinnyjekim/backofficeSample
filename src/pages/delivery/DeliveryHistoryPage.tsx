import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { DELIVERY_EVENT_LOGS, type DeliveryEventLog } from './deliveryExtraData';

const GRID_TEMPLATE = '140px 140px 120px 100px 100px 140px minmax(220px, 1fr) 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '발생일시' },
  { label: '로그 ID' },
  { label: '주문번호' },
  { label: '이벤트유형' },
  { label: '처리주체' },
  { label: '택배사 / 송장' },
  { label: '이벤트 상세 및 사유' },
  { label: '관리' },
];

const EVENT_META: Record<string, { bg: string; fg: string }> = {
  출고: { bg: '#eff6ff', fg: '#2563eb' },
  송장변경: { bg: '#f5f3ff', fg: '#7c3aed' },
  상태전환: { bg: '#ecfdf5', fg: '#059669' },
  예외발생: { bg: '#fef2f2', fg: '#dc2626' },
  배송완료: { bg: '#ecfdf5', fg: '#047857' },
  반송: { bg: '#fffbeb', fg: '#b45309' },
  관리자개입: { bg: '#fefce8', fg: '#854d0e' },
};

const QUICK_FILTERS = ['전체', '출고', '상태전환', '예외발생', '반송', '관리자개입'] as const;

export function DeliveryHistoryPage() {
  const [items] = useState<DeliveryEventLog[]>(DELIVERY_EVENT_LOGS);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick = filter === '전체' || item.eventType === filter;
      const matchActor = !actorRole || item.actorRole === actorRole;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.shipmentId} ${item.invoiceNo} ${item.description} ${item.actor}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchActor && matchKey;
    });
  }, [items, filter, actorRole, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const rows: GridRow[] = filtered.map((item) => {
    const em = EVENT_META[item.eventType] ?? { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.occurredAt, color: '#18181b', size: '12px', numeric: true, weight: 600 },
        { kind: 'text', text: item.id, color: '#71717a', size: '12px' },
        { kind: 'text', text: item.orderId, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'badge', text: item.eventType, bg: em.bg, fg: em.fg },
        { kind: 'stack', title: item.actor, subtitle: item.actorRole },
        { kind: 'stack', title: item.carrier, subtitle: item.invoiceNo },
        { kind: 'text', text: item.description, color: '#18181b', size: '12px' },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>배송 이력</div>
            <div className={styles.subtitle}>출고 이후 배송 완료, 지연 및 예외 처리 과정의 모든 감사(Audit) 로그를 조회합니다.</div>
          </div>
        </div>

        

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="로그 ID / 주문번호 / 운송장번호 / 처리자 / 이벤트 내용"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = items.filter((item) => k === '전체' || item.eventType === k).length;
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
              <span>처리 주체</span>
              <select
                aria-label="처리 주체"
                className={styles.selectXs}
                value={actorRole}
                onChange={(e) => setActorRole(e.target.value)}
              >
                <option value="">전체 처리 주체</option>
                <option>운영 관리자</option>
                <option>배송사 연동</option>
                <option>SYSTEM</option>
                <option>CS 상담원</option>
              </select>
            </label>
            <label className={styles.dateFilterField}>
              <span>발생일</span>
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
                setActorRole('');
              }}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건 감사 로그`}</span>
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
          emptyText="조건에 해당하는 배송 이력 로그가 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`배송 감사 로그 · ${selected.id}`}
          title={`${selected.orderId} (${selected.eventType})`}
          status={selected.eventType}
          statusMeta={EVENT_META[selected.eventType] ?? { bg: '#f4f4f5', fg: '#52525b' }}
          subtitle={`${selected.carrier} · ${selected.invoiceNo}`}
          onClose={() => setSelectedId(null)}
          stats={[
            { label: '이벤트 유형', value: selected.eventType },
            { label: '처리 주체', value: selected.actorRole },
            { label: '발생 시각', value: selected.occurredAt },
          ]}
          fields={[
            { label: '주문번호', value: selected.orderId },
            { label: '배송번호', value: selected.shipmentId },
            { label: '처리자', value: selected.actor },
            { label: '접속 IP', value: selected.ipAddress },
            { label: '이벤트 설명', value: selected.description },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>감사 로그 원칙</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            배송 이력 로그는 시스템 간 통신 및 관리자 수기 조치 내역을 원본 그대로 보존하며, 사후 수정이나 삭제가 불가한 불변(Immutable) 감사 기록입니다.
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
