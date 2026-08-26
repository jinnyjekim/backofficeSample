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
  periodSummary,
  productName,
  targetSummary,
  type Promotion,
} from './promotionsData';

const TABS = [
  { key: 'summary', label: '기본 정보' },
  { key: 'target', label: '적용 대상' },
  { key: 'rules', label: '중복 · 우선순위' },
  { key: 'usage', label: '적용 현황' },
  { key: 'preview', label: '적용 미리보기' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  promotion: Promotion;
  issues: string[];
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onRequestEnd: () => void;
  onRequestDelete: () => void;
}

export function PromotionDetailDrawer({ promotion: p, issues, onClose, onEdit, onDuplicate, onToggleActive, onRequestEnd, onRequestDelete }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [orderAmount, setOrderAmount] = useState(String(Math.max(p.minPurchaseAmount, 30000)));
  const [targetIncluded, setTargetIncluded] = useState(true);
  const [result, setResult] = useState<ReturnType<typeof calcPreview> | null>(null);

  const status = computeStatus(p);
  const sm = STATUS_META[status];

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>프로모션 관리 · {p.code}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{p.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{status}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 검토 필요</span>}
            </div>
            <div className={styles.sub}>{targetSummary(p)} · {discountSummary(p)} · {periodSummary(p)}</div>
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
          {status !== '종료' && <button type="button" className={styles.actionLink} onClick={onEdit}>수정</button>}
          <button type="button" className={styles.actionLink} onClick={onDuplicate}>복제</button>
          <div className={styles.spacer} />
          {status === '진행중' && <button type="button" className={styles.dangerBtn} onClick={onRequestEnd}>종료</button>}
          {(status === '진행 예정' || status === '비활성') && (
            <button type="button" className={styles.actionLink} onClick={onToggleActive}>{p.active ? '비활성화' : '활성화'}</button>
          )}
          {p.appliedCount === 0 && (
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
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 코드</span><span className={styles.fieldValue}>{p.code}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>적용 단위</span><span className={styles.fieldValue}>{p.applyUnit}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인 방식</span><span className={styles.fieldValue}>{p.discountMethod}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인</span><span className={styles.fieldValue}>{discountSummary(p)}</span></div>
              {p.discountMethod === '정률' && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 할인금액</span><span className={styles.fieldValue}>{p.maxDiscountAmount > 0 ? fmtWon(p.maxDiscountAmount) : '제한 없음'}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최소 구매금액</span><span className={styles.fieldValue}>{p.minPurchaseAmount > 0 ? fmtWon(p.minPurchaseAmount) : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>적용기간</span><span className={styles.fieldValue}>{periodSummary(p)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>담당자</span><span className={styles.fieldValue}>{p.owner}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 수정</span><span className={styles.fieldValue}>{p.updatedBy} · {p.updatedAt}</span></div>
            </div>
          </div>
        )}

        {tab === 'target' && (
          <div>
            <div className={styles.sectionTitle}>적용 대상</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>대상 유형</span><span className={styles.fieldValue}>{p.targetType}</span></div>
            </div>
            {p.targetType === '특정 상품' && (
              p.targetProductCodes.length === 0 ? <div className={styles.emptyInline}>선택된 상품이 없습니다.</div> : (
                <div className={styles.fieldBox}>
                  {p.targetProductCodes.map((code) => (
                    <div className={styles.fieldRow} key={code}><span className={styles.fieldLabel}>{productName(code)}</span><span className={styles.fieldValue}>{code}</span></div>
                  ))}
                </div>
              )
            )}
            {p.targetType === '특정 카테고리' && (
              p.targetCategories.length === 0 ? <div className={styles.emptyInline}>선택된 카테고리가 없습니다.</div> : (
                <div className={styles.fieldBox}>
                  {p.targetCategories.map((c) => (
                    <div className={styles.fieldRow} key={c}><span className={styles.fieldLabel}>{c}</span><span className={styles.fieldValue}>포함</span></div>
                  ))}
                </div>
              )
            )}

            <div className={styles.sectionTitleLoose}>제외 대상</div>
            {p.excludeProductCodes.length === 0 ? (
              <div className={styles.emptyInline}>제외된 상품이 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {p.excludeProductCodes.map((code) => (
                  <div className={styles.fieldRow} key={code}><span className={styles.fieldLabel}>{productName(code)}</span><span className={styles.fieldValue}>{code}</span></div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'rules' && (
          <div>
            <div className={styles.sectionTitle}>중복 적용</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>다른 프로모션과 중복</span><span className={styles.fieldValue}>{p.stackPromotion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰과 중복</span><span className={styles.fieldValue}>{p.stackCoupon}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>우선순위</span><span className={styles.fieldValue}>{p.priority} <span style={{ color: '#a1a1aa' }}>(숫자가 작을수록 우선)</span></span></div>
            </div>
          </div>
        )}

        {tab === 'usage' && (
          <div>
            <div className={styles.sectionTitle}>적용 현황</div>
            {p.appliedCount === 0 ? (
              <div className={styles.emptyInline}>아직 적용된 이력이 없습니다.</div>
            ) : (
              <>
                <div className={styles.statGrid}>
                  <div className={styles.statCell}><div className={styles.statLabel}>적용 건수</div><div className={styles.statValue}>{p.appliedCount.toLocaleString('ko-KR')}건</div></div>
                  <div className={styles.statCell}><div className={styles.statLabel}>총 할인금액</div><div className={styles.statValue}>{fmtWon(p.appliedAmount)}</div></div>
                  <div className={styles.statCell}><div className={styles.statLabel}>건당 평균 할인</div><div className={styles.statValue}>{fmtWon(Math.round(p.appliedAmount / p.appliedCount))}</div></div>
                </div>
                <Link to={`/promotions/history?code=${p.code}`} className={styles.actionLink} style={{ display: 'inline-block', textDecoration: 'none' }}>
                  적용 이력 보기 →
                </Link>
              </>
            )}
          </div>
        )}

        {tab === 'preview' && (
          <div>
            <div className={styles.sectionTitle}>적용 미리보기</div>
            <div className={styles.previewCard}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>주문금액 (원)</label>
                <input className={styles.formInput} type="number" min={0} value={orderAmount} onChange={(e) => { setOrderAmount(e.target.value); setResult(null); }} />
              </div>
              {p.targetType !== '전체' && (
                <div className={styles.formGroup}>
                  <label className={styles.checkRow}>
                    <input type="checkbox" checked={targetIncluded} onChange={(e) => { setTargetIncluded(e.target.checked); setResult(null); }} />
                    주문에 대상 {p.targetType === '특정 상품' ? '상품' : '카테고리'}가 포함됨
                  </label>
                </div>
              )}
              <button type="button" className={styles.editConfirm} onClick={() => setResult(calcPreview(p, Math.max(0, Number(orderAmount) || 0), targetIncluded))}>계산</button>

              {result && (
                <div style={{ marginTop: 14 }}>
                  {result.applicable ? (
                    <div className={styles.fieldBox}>
                      <div className={styles.fieldRow}><span className={styles.fieldLabel}>주문금액</span><span className={styles.fieldValue}>{fmtWon(result.orderAmount)}</span></div>
                      <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 할인</span><span className={styles.fieldValue} style={{ color: '#dc2626' }}>-{fmtWon(result.discount)}</span></div>
                      <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 금액</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtWon(result.final)}</span></div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>적용되지 않습니다.</div>
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
            <div className={styles.bodyText}>{p.adminMemo || '등록된 메모가 없습니다.'}</div>

            <div className={styles.sectionTitleLoose}>변경 이력</div>
            {p.history.slice().reverse().map((h) => (
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
