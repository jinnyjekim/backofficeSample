import { useRef, useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { STATUS_META, computeIssues, productName, productStatus, type Brand, type Memo } from './brandsData';

const TABS = [
  { key: 'summary', label: '기본 정보' },
  { key: 'display', label: '표시 정보' },
  { key: 'products', label: '연결 상품' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  brand: Brand;
  all: Brand[];
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onToggleExposure: () => void;
  onRequestDelete: () => void;
  onViewProducts: () => void;
  onAddMemo: (text: string) => void;
}

export function BrandDetailDrawer({ brand: b, all, onClose, onEdit, onToggleStatus, onToggleExposure, onRequestDelete, onViewProducts, onAddMemo }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [memoText, setMemoText] = useState('');

  const sm = STATUS_META[b.status];
  const issues = computeIssues(b, all);

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(memoText.trim());
    setMemoText('');
  }

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>브랜드 관리 · {b.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{b.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{b.status}</span>
              <span className={styles.badge} style={{ background: b.exposure ? '#eef2ff' : '#f4f4f5', color: b.exposure ? '#4338ca' : '#71717a' }}>{b.exposure ? '노출' : '비노출'}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 검토 필요</span>}
            </div>
            <div className={styles.sub}>{b.code} · 연결 상품 {b.productCodes.length}개</div>
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
          <button type="button" className={styles.actionLink} onClick={onEdit}>수정</button>
          <button type="button" className={styles.actionLink} onClick={onToggleExposure}>{b.exposure ? '비노출로 전환' : '노출로 전환'}</button>
          <div className={styles.spacer} />
          <button type="button" className={styles.actionLink} onClick={onToggleStatus}>{b.status === '사용중' ? '미사용 처리' : '사용 재개'}</button>
          {b.productCodes.length === 0 && (
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
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>브랜드 ID</span><span className={styles.fieldValue}>{b.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>브랜드 코드</span><span className={styles.fieldValue}>{b.code}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>브랜드명</span><span className={styles.fieldValue}>{b.name}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>사용 상태</span><span className={styles.fieldValue}>{b.status}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 상태</span><span className={styles.fieldValue}>{b.exposure ? '노출' : '비노출'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 순서</span><span className={styles.fieldValue}>{b.exposureOrder}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>연결 상품</span><span className={styles.fieldValue}>{b.productCodes.length}개</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>담당자</span><span className={styles.fieldValue}>{b.owner}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록일</span><span className={styles.fieldValue}>{b.createdAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 수정</span><span className={styles.fieldValue}>{b.updatedBy} · {b.updatedAt}</span></div>
            </div>
          </div>
        )}

        {tab === 'display' && (
          <div>
            <div className={styles.sectionTitle}>로고</div>
            {b.hasLogo ? (
              <div style={{ width: 64, height: 64, borderRadius: 12, background: '#18181b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                {b.name.slice(0, 1)}
              </div>
            ) : (
              <div className={styles.emptyInline} style={{ marginBottom: 16 }}>등록된 로고가 없습니다.</div>
            )}
            <div className={styles.sectionTitle}>브랜드 설명</div>
            <div className={styles.bodyText}>{b.description || '등록된 설명이 없습니다.'}</div>
          </div>
        )}

        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div className={styles.sectionTitle}>연결 상품 ({b.productCodes.length}개)</div>
              <button type="button" className={styles.actionLink} onClick={onViewProducts}>상품 관리에서 보기</button>
            </div>
            {b.productCodes.length === 0 ? (
              <div className={styles.emptyInline}>연결된 상품이 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {b.productCodes.map((code) => (
                  <div className={styles.fieldRow} key={code}>
                    <span className={styles.fieldLabel}>{productName(code)}</span>
                    <span className={styles.fieldValue}>{productStatus(code)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.emptyInline}>상품과의 브랜드 연결은 상품 등록/수정에서 관리합니다.</div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {b.memos.length === 0 ? (
              <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              b.memos.map((m: Memo) => (
                <div key={m.id} className={styles.memoItem}>
                  <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                  <div className={styles.memoText}>{m.text}</div>
                </div>
              ))
            )}

            <div className={styles.sectionTitleLoose}>변경 이력</div>
            {b.history.slice().reverse().map((h) => (
              <div key={h.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.at}</span>
                  </div>
                  {h.before && h.after && <div className={styles.timelineDetail}>{h.before} → {h.after}</div>}
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
