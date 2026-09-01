import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import styles from './ReviewAnalyticsPage.module.css';
import { REVIEWS, pendingReportCount, productName } from './reviewsData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const COLUMNS: GridColumn[] = [
  { label: '상품' },
  { label: '리뷰', align: 'right' },
  { label: '평균 평점', align: 'right' },
  { label: '저평점', align: 'right' },
  { label: '처리 대기 신고', align: 'right' },
  { label: '답변률', align: 'right' },
];

export function ReviewAnalyticsPage() {
  const [period, setPeriod] = useState('30');
  const [productFilter, setProductFilter] = useState('');

  const productOptions = useMemo(
    () => Array.from(new Set(REVIEWS.map((review) => review.productCode))),
    [],
  );

  const scopedReviews = useMemo(() => {
    const cutoff = new Date('2026-08-26T23:59:59');
    cutoff.setDate(cutoff.getDate() - Number(period));
    return REVIEWS.filter((review) => {
      if (new Date(review.createdAt.replace(' ', 'T')) < cutoff) return false;
      return !productFilter || review.productCode === productFilter;
    });
  }, [period, productFilter]);

  const total = scopedReviews.length;
  const averageRating = total === 0 ? 0 : scopedReviews.reduce((sum, review) => sum + review.rating, 0) / total;
  const exposed = scopedReviews.filter((review) => review.exposure === '노출').length;
  const pendingReports = scopedReviews.reduce((sum, review) => sum + pendingReportCount(review), 0);
  const replied = scopedReviews.filter((review) => review.adminReply !== null).length;
  const replyRate = total === 0 ? 0 : Math.round((replied / total) * 100);

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = scopedReviews.filter((review) => review.rating === rating).length;
    return { rating, count, percent: total === 0 ? 0 : Math.round((count / total) * 100) };
  });

  const rows = useMemo<GridRow[]>(() => {
    const grouped = new Map<string, typeof REVIEWS>();
    scopedReviews.forEach((review) => grouped.set(review.productCode, [...(grouped.get(review.productCode) ?? []), review]));

    return Array.from(grouped.entries())
      .map(([code, reviews]) => {
        const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        const lowRating = reviews.filter((review) => review.rating <= 2).length;
        const reports = reviews.reduce((sum, review) => sum + pendingReportCount(review), 0);
        const responses = reviews.filter((review) => review.adminReply !== null).length;
        return {
          id: code,
          sort: reviews.length,
          row: {
            id: code,
            cells: [
              { kind: 'stack', title: productName(code), subtitle: code },
              { kind: 'text', text: `${reviews.length}건`, color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
              { kind: 'text', text: average.toFixed(1), color: '#18181b', size: '12px', weight: 700, align: 'right', numeric: true },
              { kind: 'text', text: `${lowRating}건`, color: lowRating > 0 ? '#dc2626' : '#71717a', size: '12px', weight: 600, align: 'right', numeric: true },
              { kind: 'text', text: `${reports}건`, color: reports > 0 ? '#d97706' : '#71717a', size: '12px', weight: 600, align: 'right', numeric: true },
              { kind: 'text', text: `${Math.round((responses / reviews.length) * 100)}%`, color: '#4338ca', size: '12px', weight: 700, align: 'right', numeric: true },
            ],
          } satisfies GridRow,
        };
      })
      .sort((a, b) => b.sort - a.sort)
      .map((item) => item.row);
  }, [scopedReviews]);

  return (
    <div className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <div className={shared.title}>리뷰 분석</div>
            <div className={shared.subtitle}>리뷰 품질, 고객 반응과 운영 대응 현황을 상품별로 분석합니다.</div>
          </div>
        </div>

        <div className={shared.filterBox}>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>조회 기간</span><select aria-label="조회 기간" className={shared.selectSm} value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="7">최근 7일</option>
              <option value="30">최근 30일</option>
              <option value="90">최근 90일</option>
            </select></label>
            <label className="globalFilterField"><span>상품</span><select aria-label="상품" className={shared.selectSm} value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
              <option value="">전체 상품</option>
              {productOptions.map((code) => <option key={code} value={code}>{productName(code)} · {code}</option>)}
            </select></label>
            <span className={shared.rowSpacer} />
          <ExcelDownloadButton type="button" data-grid-download />
          </div>
        </div>

        <div className={styles.metricGrid}>
          <div className={styles.metricCard}><span>전체 리뷰</span><strong>{total}건</strong><small>선택 기간 등록 기준</small></div>
          <div className={styles.metricCard}><span>평균 평점</span><strong>{averageRating.toFixed(1)}</strong><small>5점 만점</small></div>
          <div className={styles.metricCard}><span>노출률</span><strong>{total === 0 ? 0 : Math.round((exposed / total) * 100)}%</strong><small>{exposed}건 노출중</small></div>
          <div className={styles.metricCard}><span>답변률</span><strong>{replyRate}%</strong><small>{replied}건 답변 완료</small></div>
          <div className={`${styles.metricCard} ${pendingReports > 0 ? styles.warningCard : ''}`}><span>처리 대기 신고</span><strong>{pendingReports}건</strong><small>리뷰 운영에서 처리</small></div>
        </div>

        <div className={styles.analysisGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHead}><strong>평점 분포</strong><span>전체 리뷰 기준</span></div>
            <div className={styles.ratingList}>
              {ratingDistribution.map((item) => (
                <div className={styles.ratingRow} key={item.rating}>
                  <span>{item.rating}점</span>
                  <div className={styles.track}><i style={{ width: `${item.percent}%` }} /></div>
                  <strong>{item.count}건</strong>
                  <em>{item.percent}%</em>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}><strong>운영 점검</strong><span>현재 상태</span></div>
            <div className={styles.checkList}>
              <div><span>신고가 접수된 리뷰</span><strong>{scopedReviews.filter((review) => pendingReportCount(review) > 0).length}건</strong></div>
              <div><span>비노출·삭제 리뷰</span><strong>{scopedReviews.filter((review) => review.exposure !== '노출').length}건</strong></div>
              <div><span>답변 대기 리뷰</span><strong>{scopedReviews.filter((review) => review.adminReply === null && review.exposure !== '삭제').length}건</strong></div>
              <div><span>저평점(1~2점) 리뷰</span><strong>{scopedReviews.filter((review) => review.rating <= 2).length}건</strong></div>
            </div>
          </section>
        </div>

        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>상품별 리뷰 성과</span>
        </div>
      </div>

      <div className={shared.gridWrap}>
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="1.5fr 90px 90px 90px 110px 90px" minWidth="760px" empty={rows.length === 0} emptyText="분석할 리뷰 데이터가 없습니다." />
      </div>
    </div>
  );
}
