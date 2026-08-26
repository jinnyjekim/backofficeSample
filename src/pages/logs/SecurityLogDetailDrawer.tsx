import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './SecurityLogPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { RISK_META, type SecurityLogEntry } from './securityLogData';

interface Props { entry: SecurityLogEntry; onClose: () => void }
const RESULT_META = { 성공: { bg: '#ecfdf5', fg: '#047857' }, 실패: { bg: '#fef2f2', fg: '#dc2626' }, 차단: { bg: '#fef2f2', fg: '#b91c1c' } };

export function SecurityLogDetailDrawer({ entry: e, onClose }: Props) {
  const navigate = useNavigate(); const risk = RISK_META[e.risk]; const result = RESULT_META[e.result];
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);
  return <aside ref={asideRef} className={`${drawer.aside} ${styles.drawerWide}`}>
    <div className={drawer.head}><div className={drawer.headRow}><div className={drawer.headBody}><div className={drawer.eyebrow}>보안 로그 상세 · {e.id}</div><div className={drawer.titleRow}><h2 className={drawer.title}>{e.event}</h2><span className={drawer.badge} style={{ background: result.bg, color: result.fg }}>{e.result}</span><span className={drawer.badge} style={{ background: risk.bg, color: risk.fg }}>{e.risk}</span></div><div className={drawer.sub}>{e.category} · {e.at} · {e.eventCode}</div></div><button type="button" className={drawer.closeBtn} onClick={onClose}>×</button></div>
      <div className={styles.riskSummary}><div><span>대상 유형</span><strong>{e.targetType}</strong></div><div><span>대상</span><strong>{e.targetId}</strong></div><div><span>접속 IP</span><strong>{e.ip}</strong></div><div><span>위험 수준</span><strong style={{ color: risk.fg }}>{e.risk}</strong></div></div>
    </div>
    <div className={drawer.scroll}>
      <Section title="이벤트 정보"><Box><Info label="이벤트 ID" value={e.id}/><Info label="발생 일시" value={e.at}/><Info label="이벤트 유형" value={e.category}/><Info label="이벤트 코드" value={e.eventCode}/><Info label="이벤트" value={e.event}/><Info label="위험 수준" value={e.risk}/><Info label="결과" value={e.result}/></Box></Section>
      <Section title="대상 정보"><Box><Info label="대상 유형" value={e.targetType}/><Info label="대상" value={`${e.targetName} / ${e.targetId}`}/><Info label="현재 역할" value={e.role}/>{e.accountStatus && <Info label="계정 상태" value={e.accountStatus}/>}</Box></Section>
      {e.repeatCount && <Section title={e.event === '로그인 실패' ? '반복 로그인 실패' : '반복 이벤트'}><Box><Info label="최근 집계 횟수" value={`${e.repeatCount}회`}/><Info label="최초 발생" value={e.firstAt ?? '-'}/><Info label="최근 발생" value={e.at}/>{e.unlockAt && <Info label="잠금 해제 예정" value={e.unlockAt}/>}</Box></Section>}
      {e.before && e.after && <Section title="권한 변경"><Box><Info label="작업자" value={e.actor ?? '-'}/><Info label="대상 관리자" value={`${e.targetId} / ${e.targetName}`}/></Box><div className={styles.diff}><div className={styles.diffBox}><span>변경 전</span><strong>{e.before}</strong></div><span className={styles.diffArrow}>→</span><div className={styles.diffBox}><span>변경 후</span><strong>{e.after}</strong></div></div></Section>}
      <Section title="접근 정보"><Box><Info label="메뉴 / 기능" value={e.menu}/><Info label="요청 URL" value={e.requestUrl}/><Info label="IP" value={e.ip}/><Info label="국가 / 지역" value={e.region}/><Info label="접속 환경" value={`${e.environment.os} / ${e.environment.browser} / ${e.environment.device}`}/></Box></Section>
      <Section title="처리 정보"><Box><Info label="처리 / 차단 사유" value={e.reason}/><Info label="Request ID" value={e.requestId}/></Box></Section>
      <Section title="기술 정보"><pre className={styles.technical}>{`User-Agent: ${e.environment.userAgent}\nAuthorization: ************\nAccess-Token: 저장하지 않음\nRequest-ID: ${e.requestId}`}</pre><div className={styles.maskNote}>비밀번호, 인증번호, Token, Secret Key와 전체 인증 Header는 저장하거나 표시하지 않습니다. IP 위치는 추정 정보입니다.</div></Section>
      <Section title="관련 로그"><div className={styles.relatedRow}><button type="button" className={styles.relatedBtn} onClick={() => navigate('/logs/system')}>{e.requestId} · 시스템 로그 보기</button>{e.relatedAdminLog && <button type="button" className={styles.relatedBtn} onClick={() => navigate('/admin/history')}>{e.relatedAdminLog} · 관리자 이력 보기</button>}</div></Section>
    </div>
  </aside>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <><div className={drawer.sectionTitleLoose}>{title}</div>{children}</>; }
function Box({ children }: { children: React.ReactNode }) { return <div className={drawer.fieldBox}>{children}</div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>{label}</span><strong className={drawer.fieldValue}>{value}</strong></div>; }
