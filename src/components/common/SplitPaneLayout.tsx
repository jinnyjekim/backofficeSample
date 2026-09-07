import type { ReactNode } from 'react';
import styles from './SplitPaneLayout.module.css';

export interface SplitPaneLayoutProps {
  list: ReactNode;
  detail: ReactNode | null;
  emptyMessage: ReactNode;
  detailWidth?: string;
  className?: string;
}

/**
 * TYPE D (처리형) queue layout: a scrollable list on the left and a persistent
 * judgment/detail panel on the right, replacing an overlay drawer so both stay
 * visible at once. Falls back to `emptyMessage` when nothing is selected.
 */
export function SplitPaneLayout({ list, detail, emptyMessage, detailWidth, className }: SplitPaneLayoutProps) {
  return (
    <div className={[styles.splitRow, className].filter(Boolean).join(' ')}>
      <div className={styles.splitListCol}>{list}</div>
      <div className={styles.splitDetailCol} style={detailWidth ? { width: detailWidth } : undefined}>
        {detail ?? <div className={styles.splitEmpty}>{emptyMessage}</div>}
      </div>
    </div>
  );
}

export function SplitPanePanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.panelRoot, className].filter(Boolean).join(' ')}>{children}</div>;
}
