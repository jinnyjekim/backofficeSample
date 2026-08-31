import { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '../common';
import { useGridDownload } from '../../lib/useGridDownload';
import styles from './Shell.module.css';

export function Shell() {
  const [navOpen, setNavOpen] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  useGridDownload(pageRef);

  return (
    <ToastProvider>
      <div className={styles.root}>
        <Sidebar open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
        <div className={styles.content}>
          <Header />
          <div ref={pageRef} className={styles.page}>
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
