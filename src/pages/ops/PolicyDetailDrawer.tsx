import { useRef, useState } from 'react';
import drawer from './opsDrawerShared.module.css';
import styles from './TermsManagementPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { currentPolicyVersion, type PolicyDefinition, type PolicyStatus } from './policyData';

type Tab = 'basic' | 'content' | 'versions' | 'history';
interface Props { policy: PolicyDefinition; onClose: () => void; onNewVersion: () => void; onEdit: () => void; onEnd: () => void; onViewVersion: (versionId: string) => void }
const STATUS_META: Record<PolicyStatus, { bg: string; fg: string }> = { 임시저장: { bg: '#f4f4f5', fg: '#52525b' }, '적용 예정': { bg: '#eff6ff', fg: '#2563eb' }, 적용중: { bg: '#ecfdf5', fg: '#047857' }, 종료: { bg: '#f4f4f5', fg: '#71717a' } };

export function PolicyDetailDrawer({ policy, onClose, onNewVersion, onEdit, onEnd, onViewVersion }: Props) {
  const [tab, setTab] = useState<Tab>('basic');
  const version = currentPolicyVersion(policy);
  const meta = STATUS_META[version.status];
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);
  return <aside ref={asideRef} className={`${drawer.aside} ${styles.detailDrawer}`}>
    <div className={drawer.head}><div className={drawer.headRow}><div className={drawer.headBody}><div className={drawer.eyebrow}>{policy.code} · 정책 상세</div><div className={drawer.titleRow}><h2 className={drawer.title}>{policy.name}</h2><span className={drawer.badge} style={{ background: meta.bg, color: meta.fg }}>{version.status}</span></div><div className={drawer.sub}>{policy.type} · {version.version} · {policy.visibility}</div></div><button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button></div>
      <div className={styles.summaryGrid}><div><span>현재/예정 버전</span><strong>{version.version}</strong></div><div><span>공개 범위</span><strong>{policy.visibility}</strong></div><div><span>적용 시작일</span><strong>{version.effectiveFrom || '-'}</strong></div><div><span>적용 종료일</span><strong>{version.effectiveTo ?? '-'}</strong></div></div>
      <div className={drawer.actionRow}>{version.status === '임시저장' && <button type="button" className={drawer.actionLink} onClick={onEdit}>수정</button>}{version.status !== '임시저장' && <button type="button" className={drawer.primaryBtn} onClick={onNewVersion}>새 버전 등록</button>}{policy.versions.some((item) => item.status === '적용중') && <button type="button" className={drawer.dangerBtn} onClick={onEnd}>적용 종료</button>}</div>
      <div className={drawer.tabs}>{([['basic', '기본 정보'], ['content', '정책 내용'], ['versions', `버전 이력 ${policy.versions.length}`], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>)}</div>
    </div>
    <div className={drawer.scroll}>
      {tab === 'basic' && <><div className={drawer.fieldBox}><Info label="정책명" value={policy.name}/><Info label="정책 코드" value={policy.code}/><Info label="정책 유형" value={policy.type}/><Info label="현재 버전" value={version.version}/><Info label="공개 범위" value={policy.visibility}/><Info label="상태" value={version.status}/><Info label="적용 시작일" value={version.effectiveFrom || '-'}/><Info label="적용 종료일" value={version.effectiveTo ?? '-'}/></div><div className={drawer.bodyText}>{policy.description || '등록된 설명이 없습니다.'}</div></>}
      {tab === 'content' && <><div className={styles.previewHead}><h3>{policy.name}</h3><p>{policy.visibility} · 버전 {version.version} · 시행일 {version.effectiveFrom}</p></div><div className={styles.contentPaper}>{version.content}</div><div className={styles.ruleNote}>적용된 정책은 직접 수정할 수 없습니다. 내용 변경은 새 버전으로 등록해야 합니다.</div></>}
      {tab === 'versions' && <div className={styles.versionTable}><div className={styles.versionHead}><span>버전</span><span>적용 기간</span><span>상태</span><span>변경 내용</span><span>등록자</span><span>관리</span></div>{policy.versions.map((item) => <div key={item.id} className={styles.versionRow}><strong>{item.version}</strong><span>{item.effectiveFrom} ~ {item.effectiveTo ?? ''}</span><em style={{ background: STATUS_META[item.status].bg, color: STATUS_META[item.status].fg }}>{item.status}</em><span>{item.changeReason}</span><span>{item.createdBy}</span><button type="button" onClick={() => onViewVersion(item.id)}>보기</button></div>)}</div>}
      {tab === 'history' && policy.history.map((item, index) => <div key={`${item.at}-${index}`} className={drawer.timelineItem}><span className={drawer.timelineDot}/><div className={drawer.timelineBody}><div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{item.action}</strong><span className={drawer.timelineWhen}>{item.at}</span></div><div className={drawer.timelineDetail}>{item.detail} · {item.actor}</div></div></div>)}
    </div>
  </aside>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>{label}</span><strong className={drawer.fieldValue}>{value}</strong></div>; }
