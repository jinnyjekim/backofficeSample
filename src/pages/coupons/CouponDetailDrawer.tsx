import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  STATUS_META,
  calcPreview,
  computeStatus,
  discountSummary,
  fmtWon,
  issuePeriodSummary,
  productName,
  targetSummary,
  validitySummary,
  type Coupon,
} from './couponsData';

const TABS = [
  { key: 'summary', label: '기본 정보' },
  { key: 'target', label: '사용 대상' },
  { key: 'issue', label: '발급 · 유효기간' },
  { key: 'rules', label: '중복 정책' },
  { key: 'usage', label: '발급 · 사용 현황' },
  { key: 'preview', label: '적용 테스트' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  coupon: Coupon;
  issues: string[];
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onRequestStop: () => void;
  onRequestDelete: () => void;
}

export function CouponDetailDrawer({ coupon: c, issues, onClose, onEdit, onDuplicate, onToggleActive, onRequestStop, onRequestDelete }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [orderAmount, setOrderAmount] = useState(String(Math.max(c.minPurchaseAmount, 30000)));
  const [promotionDiscount, setPromotionDiscount] = useState('0');
  const [targetIncluded, setTargetIncluded] = useState(true);
  const [result, setResult] = useState<ReturnType<typeof calcPreview> | null>(null);

  const status = computeStatus(c);
  const sm = STATUS_META[status];
  const remaining = c.totalLimit > 0 ? Math.max(0, c.totalLimit - c.issuedCount) : null;

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>쿠폰 관리 · {c.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{c.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{status}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 검토 필요</span>}
            </div>
            <div className={styles.sub}>{c.code} · {targetSummary(c)} · {discountSummary(c)}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {issues.length > 0 && (
          <div className={styles.editPanel} style={{ marginTop: 12, background: '#fffbeb', borderColor: '#fde68a' }}>
            <div className={styles.editTitle} style={{ color: '#b45309' }}>검토가 필요합니다</div>
            {issues.map((issue) => (
              <div key={issue} style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>⚠ {issue}</div>
            ))}
          </div>
        )}

        <div className={styles.actionRow}>
          {status !== '발급 종료' && <button type="button" className={styles.actionLink} onClick={onEdit}>수정</button>}
          <button type="button" className={styles.actionLink} onClick={onDuplicate}>복제</button>
          <div className={styles.spacer} />
          {status === '발급중' && <button type="button" className={styles.dangerBtn} onClick={onRequestStop}>발급 중지</button>}
          {(status === '발급 예정' || status === '비활성') && (
            <button type="button" className={styles.actionLink} onClick={onToggleActive}>{c.active ? '비활성화' : '활성화'}</button>
          )}
          {c.issuedCount === 0 && (
            <button type="button" className={styles.dangerBtn} onClick={onRequestDelete}>삭제</button>
          )}
        </div>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.key} type="button" className={`${styles.tabBtn} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {tab === 'summary' && (
          <div>
            <div className={styles.sectionTitle}>기본 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 코드</span><span className={styles.fieldValue}>{c.code}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 유형</span><span className={styles.fieldValue}>{c.applyUnit} 쿠폰</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인 방식</span><span className={styles.fieldValue}>{c.discountMethod}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인</span><span className={styles.fieldValue}>{discountSummary(c)}</span></div>
              {c.discountMethod === '정률' && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 할인금액</span><span className={styles.fieldValue}>{c.maxDiscountAmount > 0 ? fmtWon(c.maxDiscountAmount) : '제한 없음'}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최소 구매금액</span><span className={styles.fieldValue}>{c.minPurchaseAmount > 0 ? fmtWon(c.minPurchaseAmount) : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>담당자</span><span className={styles.fieldValue}>{c.owner}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 수정</span><span className={styles.fieldValue}>{c.updatedBy} · {c.updatedAt}</span></div>
            </div>
          </div>
        )}

        {tab === 'target' && (
          <div>
            <div className={styles.sectionTitle}>사용 대상</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>대상 유형</span><span className={styles.fieldValue}>{c.targetType}</span></div>
            </div>
            {c.targetType === '특정 상품' && (
              c.targetProductCodes.length === 0 ? <div className={styles.emptyInline}>선택된 상품이 없습니다.</div> : (
                <div className={styles.fieldBox}>
                  {c.targetProductCodes.map((code) => (
                    <div className={styles.fieldRow} key={code}><span className={styles.fieldLabel}>{productName(code)}</span><span className={styles.fieldValue}>{code}</span></div>
                  ))}
                </div>
              )
            )}
            {c.targetType === '특정 카테고리' && (
              c.targetCategories.length === 0 ? <div className={styles.emptyInline}>선택된 카테고리가 없습니다.</div> : (
                <div className={styles.fieldBox}>
                  {c.targetCategories.map((cat) => (
                    <div className={styles.fieldRow} key={cat}><span className={styles.fieldLabel}>{cat}</span><span className={styles.fieldValue}>포함</span></div>
                  ))}
                </div>
              )
            )}

            <div className={styles.sectionTitleLoose}>제외 대상</div>
            {c.excludeProductCodes.length === 0 ? (
              <div className={styles.emptyInline}>제외된 상품이 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {c.excludeProductCodes.map((code) => (
                  <div className={styles.fieldRow} key={code}><span className={styles.fieldLabel}>{productName(code)}</span><span className={styles.fieldValue}>{code}</span></div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'issue' && (
          <div>
            <div className={styles.sectionTitle}>발급 조건</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급 방식</span><span className={styles.fieldValue}>{c.issueMethod}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급 기간</span><span className={styles.fieldValue}>{issuePeriodSummary(c)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>총 발급 한도</span><span className={styles.fieldValue}>{c.totalLimit > 0 ? `${c.totalLimit.toLocaleString('ko-KR')}장` : '제한 없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>회원당 발급</span><span className={styles.fieldValue}>{c.perMemberLimit}장</span></div>
            </div>

            <div className={styles.sectionTitleLoose}>사용 유효기간</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>유효기간 방식</span><span className={styles.fieldValue}>{c.validityType === '발급후N일' ? '발급일 기준' : '날짜 지정'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>유효기간</span><span className={styles.fieldValue}>{validitySummary(c)}</span></div>
            </div>
            <div className={styles.emptyInline}>발급 기간이 종료돼도, 이미 발급된 쿠폰은 위 사용 유효기간까지 사용할 수 있습니다.</div>
          </div>
        )}

        {tab === 'rules' && (
          <div>
            <div className={styles.sectionTitle}>중복 적용</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션과 중복</span><span className={styles.fieldValue}>{c.stackPromotion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>다른 쿠폰과 중복</span><span className={styles.fieldValue}>{c.stackCoupon}</span></div>
            </div>
          </div>
        )}

        {tab === 'usage' && (
          <div>
            <div className={styles.sectionTitle}>발급 · 사용 현황</div>
            <div className={styles.statGrid}>
              <div className={styles.statCell}><div className={styles.statLabel}>발급</div><div className={styles.statValue}>{c.issuedCount.toLocaleString('ko-KR')}장</div></div>
              <div className={styles.statCell}><div className={styles.statLabel}>사용</div><div className={styles.statValue}>{c.usedCount.toLocaleString('ko-KR')}장</div></div>
              <div className={styles.statCell}><div className={styles.statLabel}>잔여 발급</div><div className={styles.statValue}>{remaining === null ? '제한 없음' : `${remaining.toLocaleString('ko-KR')}장`}</div></div>
            </div>
            {c.issuedCount === 0 ? (
              <div className={styles.emptyInline}>아직 발급된 이력이 없습니다.</div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/coupons/issue?code=${c.code}`} className={styles.actionLink} style={{ display: 'inline-block', textDecoration: 'none' }}>
                  발급 내역 보기 →
                </Link>
                <Link to={`/coupons/usage?code=${c.code}`} className={styles.actionLink} style={{ display: 'inline-block', textDecoration: 'none' }}>
                  사용 내역 보기 →
                </Link>
              </div>
            )}
          </div>
        )}

        {tab === 'preview' && (
          <div>
            <div className={styles.sectionTitle}>쿠폰 적용 테스트</div>
            <div className={styles.previewCard}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>상품금액 (원)</label>
                <input className={styles.formInput} type="number" min={0} value={orderAmount} onChange={(e) => { setOrderAmount(e.target.value); setResult(null); }} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>프로모션 할인 (원, 선택)</label>
                <input className={styles.formInput} type="number" min={0} value={promotionDiscount} onChange={(e) => { setPromotionDiscount(e.target.value); setResult(null); }} />
              </div>
              {c.targetType !== '전체' && (
                <div className={styles.formGroup}>
                  <label className={styles.checkRow}>
                    <input type="checkbox" checked={targetIncluded} onChange={(e) => { setTargetIncluded(e.target.checked); setResult(null); }} />
                    주문에 대상 {c.targetType === '특정 상품' ? '상품' : '카테고리'}가 포함됨
                  </label>
                </div>
              )}
              <button
                type="button"
                className={styles.editConfirm}
                onClick={() => setResult(calcPreview(c, Math.max(0, Number(orderAmount) || 0), Math.max(0, Number(promotionDiscount) || 0), targetIncluded))}
              >
                계산
              </button>

              {result && (
                <div style={{ marginTop: 14 }}>
                  {result.applicable ? (
                    <div className={styles.fieldBox}>
                      <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 적용 기준금액</span><span className={styles.fieldValue}>{fmtWon(result.baseAmount)}</span></div>
                      <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 할인</span><span className={styles.fieldValue} style={{ color: '#dc2626' }}>-{fmtWon(result.discount)}</span></div>
                      <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 금액</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtWon(result.final)}</span></div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>쿠폰을 사용할 수 없습니다.</div>
                      {result.reasons.map((r) => (
                        <div key={r} style={{ fontSize: 12, color: '#71717a', marginBottom: 3 }}>• {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.bodyText}>{c.adminMemo || '등록된 메모가 없습니다.'}</div>

            <div className={styles.sectionTitleLoose}>변경 이력</div>
            {c.history.slice().reverse().map((h) => (
              <div key={h.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.at}</span>
                  </div>
                  <div className={styles.timelineDetail}>{h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
