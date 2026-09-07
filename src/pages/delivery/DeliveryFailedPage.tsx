import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { FAILED_DELIVERIES, type FailedDelivery } from './deliveryExtraData';

const GRID_TEMPLATE = '120px 140px 90px 90px 130px 130px 100px 100px minmax(140px, 1fr) 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '배송번호' },
  { label: '주문번호' },
  { label: '수령인' },
  { label: '택배사' },
  { label: '송장번호' },
  { label: '실패일시' },
  { label: '실패사유' },
  { label: '처리상태' },
  { label: '현재위치 / 사유메모' },
  { label: '관리' },
];

const REASON_META: Record<string, { bg: string; fg: string }> = {
  '수취인 부재': { bg: '#fffbeb', fg: '#b45309' },
  '주소 불명': { bg: '#fef2f2', fg: '#dc2626' },
  '연락 불가': { bg: '#fef2f2', fg: '#dc2626' },
  '수취 거절': { bg: '#f5f3ff', fg: '#7c3aed' },
  '파손/오염': { bg: '#fef2f2', fg: '#991b1b' },
};

const STATUS_META: Record<string, { bg: string; fg: string }> = {
  '재배송 대기': { bg: '#eff6ff', fg: '#1d4ed8' },
  '주소 확인중': { bg: '#fffbeb', fg: '#b45309' },
  '반송 접수': { bg: '#fef2f2', fg: '#dc2626' },
  '처리 완료': { bg: '#ecfdf5', fg: '#059669' },
};

const QUICK_FILTERS = ['전체', '수취인 부재', '주소 불명', '수취 거절', '반송 접수', '재배송 대기'] as const;

export function DeliveryFailedPage() {
  const [items, setItems] = useState<FailedDelivery[]>(FAILED_DELIVERIES);
  const [filter, setFilter] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [carrier, setCarrier] = useState('');
  const [reason, setReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick =
        filter === '전체' ||
        item.reason === filter ||
        item.status === filter;
      const matchCarrier = !carrier || item.carrier === carrier;
      const matchReason = !reason || item.reason === reason;
      const matchKey =
        !keyword ||
        `${item.id} ${item.order} ${item.receiver} ${item.invoiceNo} ${item.notes}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchCarrier && matchReason && matchKey;
    });
  }, [items, filter, carrier, reason, keyword]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handleAction = (id: string, newStatus: FailedDelivery['status'], msg: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              history: [
                ...item.history,
                { when: '2026.08.27 15:30', title: msg, by: 'admin01' },
              ],
            }
          : item
      )
    );
    showToast({ message: msg, type: 'success' });
  };

  const rows: GridRow[] = filtered.map((item) => {
    const rm = REASON_META[item.reason] ?? { bg: '#f4f4f5', fg: '#52525b' };
    const sm = STATUS_META[item.status] ?? { bg: '#f4f4f5', fg: '#52525b' };
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        { kind: 'text', text: item.id, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.order, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: item.receiver, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: item.carrier, color: '#71717a', size: '12px' },
        { kind: 'text', text: item.invoiceNo, color: '#3f3f46', size: '12px', numeric: true },
        { kind: 'text', text: item.failedAt, color: '#18181b', size: '11.5px', numeric: true },
        { kind: 'badge', text: item.reason, bg: rm.bg, fg: rm.fg },
        { kind: 'badge', text: item.status, bg: sm.bg, fg: sm.fg },
        { kind: 'stack', title: item.location, subtitle: item.notes },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>배송 실패</div>
            <div className={styles.subtitle}>수취인 부재, 주소 불명 등으로 배송에 실패한 건을 조회하고 재배송·반송을 처리합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((k) => {
            const active = filter === k;
            const count = items.filter((item) => k === '전체' || item.reason === k || item.status === k).length;
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
                <option>배송번호</option>
                <option>주문번호</option>
                <option>수령인</option>
                <option>송장번호</option>
              </select>
            </label>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="배송번호 / 주문번호 / 수령인 / 송장번호 / 사유"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField">
              <span>실패 사유</span>
              <select
                aria-label="실패 사유"
                className={styles.selectXs}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">전체 사유</option>
                <option>수취인 부재</option>
                <option>주소 불명</option>
                <option>연락 불가</option>
                <option>수취 거절</option>
                <option>파손/오염</option>
              </select>
            </label>
            <label className="globalFilterField">
              <span>택배사</span>
              <select
                aria-label="택배사"
                className={styles.selectXs}
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
              <span>실패일</span>
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
                setCarrier('');
                setReason('');
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
          emptyText="조건에 해당하는 배송 실패 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`배송 실패 상세 · ${selected.id}`}
          title={`${selected.order} (${selected.receiver} 님)`}
          status={selected.status}
          statusMeta={STATUS_META[selected.status] ?? { bg: '#f4f4f5', fg: '#52525b' }}
          subtitle={`${selected.carrier} · 송장 ${selected.invoiceNo}`}
          onClose={() => setSelectedId(null)}
          actions={
            <>
              {selected.status !== '재배송 대기' && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleAction(selected.id, '재배송 대기', '재배송 접수 처리되었습니다.')}
                >
                  재배송 접수
                </button>
              )}
              {selected.status !== '반송 접수' && (
                <button
                  type="button"
                  className={drawer.dangerBtn}
                  onClick={() => handleAction(selected.id, '반송 접수', '물류센터 반송 접수되었습니다.')}
                >
                  반송 처리
                </button>
              )}
            </>
          }
          stats={[
            { label: '실패 사유', value: selected.reason },
            { label: '방문 시도', value: `${selected.attemptCount}회` },
            { label: '실패 일시', value: selected.failedAt },
          ]}
          fields={[
            { label: '배송지 주소', value: selected.address },
            { label: '연락처', value: selected.phone },
            { label: '보관 위치', value: selected.location },
            { label: '상세 내용', value: selected.notes },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>배송 추적 타임라인</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {selected.tracking.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.dot }} />
                <strong style={{ minWidth: '130px' }}>{t.title}</strong>
                <span style={{ color: '#71717a' }}>{t.when}</span>
                <span style={{ color: '#a1a1aa' }}>({t.source})</span>
              </div>
            ))}
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
