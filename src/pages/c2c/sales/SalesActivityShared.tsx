import { useRef, type ReactNode } from 'react';
import { useOutsideClose } from '../../../lib/useOutsideClose';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import styles from './SalesActivity.module.css';

export interface Metric { label: string; value: string; note: string; tone?: 'up' | 'down'; dot?: string }
export interface DrawerField { label: string; value: ReactNode }
export interface DrawerStat { label: string; value: string }

export function PageHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className={shared.headTop}><div className={shared.headRow}><div><h1 className={shared.title}>{title}</h1><p className={shared.subtitle}>{subtitle}</p></div>{action && <div className={styles.headerActions}>{action}</div>}</div></div>;
}

export function Metrics({ items }: { items: Metric[] }) {
  return <div className={styles.summaryGrid}>{items.map((item) => <div key={item.label} className={styles.summaryCard}><div className={styles.summaryHead}><span>{item.label}</span>{item.dot && <i className={styles.summaryDot} style={{ background: item.dot }}/>}</div><strong>{item.value}</strong><em className={item.tone === 'up' ? styles.deltaUp : item.tone === 'down' ? styles.deltaDown : ''}>{item.note}</em></div>)}</div>;
}

export function FilterBox({ children }: { children: ReactNode }) { return <div className={shared.filterBox}>{children}</div>; }
export function ControlArea({ children }: { children: ReactNode }) { return <div className={styles.controlArea}>{children}</div>; }
export function ResultBar({ count, unit = '명', children }: { count: number; unit?: string; children?: ReactNode }) { return <div className={shared.resultRow}><span className={shared.resultLabel}>총 {count.toLocaleString()}{unit}</span><div className={shared.resultActions}>{children}</div></div>; }
export function GridArea({ children }: { children: ReactNode }) { return <div className={shared.gridWrap}>{children}</div>; }

export function DetailDrawer({ eyebrow, title, status, statusMeta, subtitle, stats, fields, actions, children, onClose }: { eyebrow: string; title: string; status: string; statusMeta: { bg: string; fg: string }; subtitle: string; stats?: DrawerStat[]; fields: DrawerField[]; actions?: ReactNode; children?: ReactNode; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, onClose);
  return <aside ref={drawerRef} className={drawer.aside}><div className={drawer.head}><div className={drawer.headRow}><div className={drawer.headBody}><div className={drawer.eyebrow}>{eyebrow}</div><div className={drawer.titleRow}><h2 className={drawer.title}>{title}</h2><span className={drawer.badge} style={{ background: statusMeta.bg, color: statusMeta.fg }}>{status}</span></div><div className={drawer.sub}>{subtitle}</div></div><button type="button" className={drawer.closeBtn} aria-label="닫기" onClick={onClose}>×</button></div>{actions && <div className={drawer.actionRow}>{actions}</div>}</div><div className={drawer.scroll}>{stats && <div className={drawer.statGrid}>{stats.map((stat) => <div key={stat.label} className={drawer.statCell}><div className={drawer.statLabel}>{stat.label}</div><div className={drawer.statValue}>{stat.value}</div></div>)}</div>}<div className={drawer.sectionTitle}>상세 정보</div><div className={drawer.fieldBox}>{fields.map((field) => <div key={field.label} className={drawer.fieldRow}><span className={drawer.fieldLabel}>{field.label}</span><strong className={drawer.fieldValue}>{field.value}</strong></div>)}</div>{children}</div></aside>;
}

export function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) { return <label className={`${styles.field} ${wide ? styles.fullField : ''}`}><span>{label}</span>{children}</label>; }
