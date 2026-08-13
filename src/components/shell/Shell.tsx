import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import styles from './Shell.module.css';

export function Shell() {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className={styles.root}>
      <Sidebar open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
      <div className={styles.content}>
        <Header />
        <div className={styles.page}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
