import shared from '../ops/opsShared.module.css';
import styles from './ShippingPolicyPlaceholderPage.module.css';

interface Props {
  title: string;
  subtitle: string;
}

export function ShippingPolicyPlaceholderPage({ title, subtitle }: Props) {
  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>{title}</h1>
            <p className={shared.subtitle}>{subtitle}</p>
          </div>
        </div>
      </div>
      <div className={styles.emptyWrap}>
        <div className={styles.emptyCard}>
          <div className={styles.icon}>◧</div>
          <div className={styles.emptyTitle}>이 메뉴는 아직 준비 중입니다.</div>
          <div className={styles.emptyDesc}>{title} 화면은 곧 제공될 예정입니다.</div>
        </div>
      </div>
    </section>
  );
}
