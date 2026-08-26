import { useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import type { Brand } from './brandsData';

interface Props {
  brands: Brand[];
  onCancel: () => void;
  onSave: (orderedIds: string[]) => void;
}

export function BrandExposureOrderDrawer({ brands, onCancel, onSave }: Props) {
  const [order, setOrder] = useState<string[]>(
    brands.slice().sort((a, b) => a.exposureOrder - b.exposureOrder).map((b) => b.id),
  );

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>브랜드 관리 · 브랜드 목록</div>
            <div className={styles.titleRow}><span className={styles.title}>노출 순서 관리</span></div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.emptyInline} style={{ marginBottom: 12 }}>사용자 화면에 노출되는 브랜드 순서입니다. 위/아래 화살표로 순서를 바꿀 수 있습니다.</div>
        {order.map((id, i) => {
          const brand = brands.find((b) => b.id === id)!;
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < order.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
              <span style={{ fontSize: 11.5, color: '#a1a1aa', width: 16 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, color: '#18181b', flex: 1 }}>{brand.name}{!brand.exposure ? ' (비노출)' : ''}</span>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={styles.actionLink} style={{ height: 26, padding: '0 8px' }}>↑</button>
              <button type="button" disabled={i === order.length - 1} onClick={() => move(i, 1)} className={styles.actionLink} style={{ height: 26, padding: '0 8px' }}>↓</button>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.editCancel} onClick={onCancel}>취소</button>
        <button type="button" className={styles.editConfirm} onClick={() => onSave(order)}>저장</button>
      </div>
    </aside>
  );
}
