import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './OrderStatusPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  CHANGE_MODES, LIFECYCLE_STAGES, incoming, outgoing,
  type BadgeTone, type ChangeMode, type EditPolicy, type LifecycleStage, type OrderStatusEntry, type TransitionEntry,
} from './orderStatusData';

type Tab = 'settings' | 'transitions' | 'usage' | 'history';

interface Props {
  initial: OrderStatusEntry;
  isNew: boolean;
  startEditing?: boolean;
  transitions: TransitionEntry[];
  statusName: (id: string) => string;
  issues: string[];
  onClose: () => void;
  onSave: (item: OrderStatusEntry) => void;
  onDeactivate: (item: OrderStatusEntry) => void;
  onOpenTransitions: (statusId: string) => void;
}

export function OrderStatusDrawer({ initial, isNew, startEditing = false, transitions, statusName, issues, onClose, onSave, onDeactivate, onOpenTransitions }: Props) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(isNew || startEditing);
  const [tab, setTab] = useState<Tab>('settings');
  const [error, setError] = useState('');
  const set = <K extends keyof OrderStatusEntry>(key: K, value: OrderStatusEntry[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!draft.name.trim() || !draft.code.trim()) return setError('상태명과 상태 코드는 필수입니다.');
    if (draft.isSuccess && draft.isCancelled) return setError('성공 완료와 취소 상태를 동시에 지정할 수 없습니다.');
    onSave({
      ...draft,
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase().replace(/\s+/g, '_'),
      isTerminal: draft.isTerminal || draft.isSuccess || draft.isCancelled,
    });
  };

  const out = outgoing(draft.id, transitions);
  const inn = incoming(draft.id, transitions);

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={`${drawer.aside} ${styles.statusDrawer}`} aria-label="주문 상태 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{isNew ? '신규 주문 상태' : draft.code}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{isNew ? '주문 상태 등록' : draft.name}</h2>
              <span className={drawer.badge} style={{ background: draft.active ? '#ecfdf5' : '#f4f4f5', color: draft.active ? '#047857' : '#71717a' }}>{draft.active ? '사용' : '비활성'}</span>
              {!isNew && issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 설정 확인</span>}
            </div>
            {!isNew && <div className={drawer.sub}>{draft.stage} 단계 · 최근 수정 {draft.updatedAt} · {draft.updatedBy}</div>}
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>
        {!isNew && (
          <div className={drawer.actionRow}>
            <button type="button" className={drawer.actionLink} onClick={() => setEditing((current) => !current)}>{editing ? '수정 취소' : '수정'}</button>
            <button type="button" className={drawer.actionLink} onClick={() => onOpenTransitions(draft.id)}>전환 설정 바로가기</button>
            <span className={drawer.spacer} />
            {draft.active && <button type="button" className={drawer.dangerBtn} onClick={() => onDeactivate(draft)}>비활성화</button>}
          </div>
        )}
        <div className={drawer.tabs}>
          {([['settings', '기본 정보'], ['transitions', '전환 정보'], ['usage', '사용 현황'], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className={drawer.scroll}>
        {tab === 'settings' && (
          <>
            {!isNew && issues.length > 0 && (
              <div className={styles.errorBanner}>
                <strong>설정 확인 필요</strong>
                {issues.map((item) => <span key={item}>⚠ {item}</span>)}
              </div>
            )}
            <Section title="기본 정보">
              <FormField label="상태명 *"><input disabled={!editing} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 주문 확정" /></FormField>
              <FormField label="상태 코드 *" hint={!isNew ? '생성 후 변경할 수 없습니다.' : '영문 대문자와 밑줄 사용'}>
                <input disabled={!editing || !isNew} value={draft.code} onChange={(e) => set('code', e.target.value)} placeholder="CONFIRMED" />
              </FormField>
              <FormField label="Lifecycle 단계 *">
                <select disabled={!editing} value={draft.stage} onChange={(e) => set('stage', e.target.value as LifecycleStage)}>
                  {LIFECYCLE_STAGES.map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </FormField>
              <FormField label="상태 설명"><textarea disabled={!editing} value={draft.description} onChange={(e) => set('description', e.target.value)} /></FormField>
            </Section>

            <Section title="상태 성격">
              <div className={styles.toggleGrid}>
                <Toggle label="종료 상태" checked={draft.isTerminal} disabled={!editing || draft.isSuccess || draft.isCancelled} onChange={(v) => set('isTerminal', v)} />
                <Toggle label="성공 완료 상태" checked={draft.isSuccess} disabled={!editing} onChange={(v) => set('isSuccess', v)} />
                <Toggle label="취소 상태" checked={draft.isCancelled} disabled={!editing} onChange={(v) => set('isCancelled', v)} />
                <Toggle label="예외 상태" checked={draft.isException} disabled={!editing} onChange={(v) => set('isException', v)} />
              </div>
            </Section>

            <Section title="변경 설정">
              <div className={styles.formGrid}>
                <FormField label="상태 변경 방식">
                  <select disabled={!editing} value={draft.changeMode} onChange={(e) => set('changeMode', e.target.value as ChangeMode)}>
                    {CHANGE_MODES.map((mode) => <option key={mode}>{mode}</option>)}
                  </select>
                </FormField>
                <FormField label="주문 정보 수정 정책">
                  <select disabled={!editing} value={draft.editPolicy} onChange={(e) => set('editPolicy', e.target.value as EditPolicy)}>
                    <option>가능</option>
                    <option>제한적</option>
                    <option>불가</option>
                  </select>
                </FormField>
              </div>
            </Section>

            <Section title="표시 설정">
              <div className={styles.formGrid}>
                <FormField label="사용자 노출명"><input disabled={!editing} value={draft.userLabel} onChange={(e) => set('userLabel', e.target.value)} /></FormField>
                <FormField label="Badge 색상">
                  <select disabled={!editing} value={draft.badgeTone} onChange={(e) => set('badgeTone', e.target.value as BadgeTone)}>
                    <option value="neutral">Neutral</option>
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                  </select>
                </FormField>
              </div>
              <Toggle label="사용자 화면 노출" checked={draft.userVisible} disabled={!editing} onChange={(v) => set('userVisible', v)} />
            </Section>

            <Section title="관리자 메모">
              <FormField label=""><textarea disabled={!editing} value={draft.adminMemo} onChange={(e) => set('adminMemo', e.target.value)} placeholder="내부 참고 메모" /></FormField>
            </Section>
          </>
        )}

        {tab === 'transitions' && (
          <>
            <div className={styles.infoNote}>전환 규칙(조건·변경 방식·허용 역할)은 [상태 전환 설정] 화면에서 관리합니다.</div>
            <Section title="다음 상태로 전환">
              {out.length > 0 ? (
                <div className={styles.transitionList}>
                  {out.map((t) => (
                    <div key={t.id} className={styles.transitionRow}>
                      <span>→</span><strong>{statusName(t.to)}</strong>
                      {t.condition && <em>{t.condition}</em>}
                      <span className={styles.transitionMode}>{t.mode}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.infoNote}>{draft.isTerminal ? '종료 상태로, 다음 상태가 없습니다.' : '설정된 다음 상태가 없습니다. 전환 설정을 확인해 주세요.'}</div>
              )}
            </Section>
            <Section title="이전 상태에서 진입">
              {inn.length > 0 ? (
                <div className={styles.transitionList}>
                  {inn.map((t) => (
                    <div key={t.id} className={styles.transitionRow}>
                      <strong>{statusName(t.from)}</strong><span>→</span>
                      <span className={styles.transitionMode}>{t.mode}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.infoNote}>이 상태로 진입 가능한 전환이 없습니다.</div>
              )}
            </Section>
            <button type="button" className={styles.cancelButton} onClick={() => onOpenTransitions(draft.id)}>상태 전환 설정에서 관리</button>
          </>
        )}

        {tab === 'usage' && (
          <>
            <div className={styles.usageGrid}>
              <div><span>현재 주문수</span><strong>{draft.orderCount.toLocaleString()}건</strong></div>
              <div><span>정의된 전환 경로</span><strong>{out.length + inn.length}개</strong></div>
            </div>
            <div className={styles.infoNote}>상태를 비활성화해도 기존 주문의 상태 이력에는 영향을 주지 않습니다.</div>
          </>
        )}

        {tab === 'history' && (
          <>
            {draft.history.length ? draft.history.slice().reverse().map((item) => (
              <div key={item.id} className={drawer.timelineItem}>
                <span className={drawer.timelineDot} />
                <div className={drawer.timelineBody}>
                  <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{item.action}</strong><span className={drawer.timelineWhen}>{item.at}</span></div>
                  <div className={drawer.timelineDetail}>{item.by}{item.before && item.after ? ` · ${item.before} → ${item.after}` : ''}</div>
                </div>
              </div>
            )) : <div className={styles.infoNote}>저장 후 변경 이력이 기록됩니다.</div>}
          </>
        )}
        {error && <div className={styles.formError}>{error}</div>}
      </div>

      {editing && (
        <div className={drawer.footer}>
          <button type="button" className={styles.cancelButton} onClick={isNew ? onClose : () => { setDraft(initial); setEditing(false); }}>취소</button>
          <button type="button" className={styles.primaryButton} onClick={save}>저장</button>
        </div>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={styles.formSection}><h3>{title}</h3>{children}</section>;
}
function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className={styles.formField}><span>{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}
function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <label className={styles.toggleField}><span>{label}</span><button type="button" disabled={disabled} className={`${styles.switch} ${checked ? styles.switchOn : ''}`} onClick={() => onChange(!checked)}><i /></button></label>;
}
