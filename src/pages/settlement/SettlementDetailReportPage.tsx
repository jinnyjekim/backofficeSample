import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import {
  PAY_STATUS_META,
  SETTLE_STATUS_META,
  calcAdjustTotal,
  calcFee,
  calcFinal,
  fmt,
  matchesQuery,
  signed,
} from './settlementData';

export function SettlementDetailReportPage() {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [q, setQ] = useState('');
  const filtered = useMemo(() => settlements.filter((r) => matchesQuery(r, q)), [settlements, q]);

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>정산 상세</div>
        <div className={styles.subtitle}>정산별 거래금액 → 공제 → 조정 → 최종 정산금액의 구성 근거를 한 번에 확인합니다.</div>

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
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
          </div>
        </div>
      </div>

      <div className={styles.reportList}>
        {filtered.map((r) => {
          const sm = SETTLE_STATUS_META[r.settleStatus];
          const pm = PAY_STATUS_META[r.payStatus];
          const fee = calcFee(r);
          const adjustTotal = calcAdjustTotal(r);
          const final = calcFinal(r);
          return (
            <div key={r.id} className={styles.reportCard} onClick={() => openDetail(r.id)}>
              <div className={styles.reportCardHead}>
                <div>
                  <div className={styles.reportTitleLine}>
                    <span className={styles.reportNo}>{r.id}</span>
                    <span className={styles.qfCount} style={{ background: sm.bg, color: sm.fg, padding: '3px 8px', borderRadius: 999, fontSize: 11 }}>{r.settleStatus}</span>
                    <span className={styles.qfCount} style={{ background: pm.bg, color: pm.fg, padding: '3px 8px', borderRadius: 999, fontSize: 11 }}>{r.payStatus}</span>
                  </div>
                  <div className={styles.reportTarget}>{r.target} · {r.period} · 담당 {r.assignee}</div>
                </div>
                <div>
                  <div className={styles.reportAmount}>{fmt(final)}</div>
                  <div className={styles.reportDue}>지급예정 {r.dueDate}</div>
                </div>
              </div>

              {r.issues.length > 0 && <div className={styles.reportIssue}>⚠ {r.issues.join(' · ')}</div>}

              <div className={styles.reportGrid}>
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>거래 건수</div>
                  <div className={styles.reportFieldValue}>{r.txCount}건</div>
                </div>
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>총 거래금액</div>
                  <div className={styles.reportFieldValue}>{fmt(r.gross)}</div>
                </div>
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>공제</div>
                  <div className={styles.reportFieldValue} style={{ color: fee ? '#dc2626' : undefined }}>{fee ? '-' + fmt(fee) : fmt(0)}</div>
                </div>
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>조정</div>
                  <div className={styles.reportFieldValue} style={{ color: adjustTotal > 0 ? '#059669' : adjustTotal < 0 ? '#dc2626' : undefined }}>
                    {adjustTotal ? signed(adjustTotal) : fmt(0)}
                  </div>
                </div>
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>세금계산서</div>
                  <div className={styles.reportFieldValue}>{r.taxInvoice}</div>
                </div>
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>지급 계좌</div>
                  <div className={styles.reportFieldValue}>{r.payAccount}</div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className={styles.resultLabel}>등록된 정산 내역이 없습니다.</div>}
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
