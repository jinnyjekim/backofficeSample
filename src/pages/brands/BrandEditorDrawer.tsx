import { useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { OWNERS, type Brand, type BrandStatus } from './brandsData';

export interface BrandFormData {
  name: string;
  code: string;
  status: BrandStatus;
  hasLogo: boolean;
  description: string;
  exposure: boolean;
  exposureOrder: number;
  owner: string;
}

interface Props {
  brand: Brand | null;
  onCancel: () => void;
  onSubmit: (form: BrandFormData) => void;
}

export function BrandEditorDrawer({ brand: b, onCancel, onSubmit }: Props) {
  const editing = !!b;

  const [name, setName] = useState(b?.name ?? '');
  const [code, setCode] = useState(b?.code ?? '');
  const [status, setStatus] = useState<BrandStatus>(b?.status ?? '사용중');
  const [hasLogo, setHasLogo] = useState(b?.hasLogo ?? false);
  const [description, setDescription] = useState(b?.description ?? '');
  const [exposure, setExposure] = useState(b?.exposure ?? true);
  const [exposureOrder, setExposureOrder] = useState(String(b?.exposureOrder ?? 100));
  const [owner, setOwner] = useState(b?.owner ?? OWNERS[0]);
  const [error, setError] = useState('');

  function submit() {
    if (!name.trim()) return setError('브랜드명을 입력해 주세요.');
    if (!code.trim()) return setError('브랜드 코드를 입력해 주세요.');

    setError('');
    onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      status,
      hasLogo,
      description: description.trim(),
      exposure,
      exposureOrder: Math.max(1, Number(exposureOrder) || 1),
      owner,
    });
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>브랜드 관리 · 브랜드 목록</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{editing ? `브랜드 수정 · ${b!.id}` : '브랜드 등록'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>브랜드명 *</label>
          <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 브랜드01" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>브랜드 코드 *</label>
          <input className={styles.formInput} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="예: BRAND01" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ marginBottom: 6 }}>사용 상태</label>
          <div className={styles.radioRow}>
            <label className={styles.radioOption}><input type="radio" checked={status === '사용중'} onChange={() => setStatus('사용중')} />사용중</label>
            <label className={styles.radioOption}><input type="radio" checked={status === '미사용'} onChange={() => setStatus('미사용')} />미사용</label>
          </div>
        </div>

        <div className={styles.sectionTitleLoose}>브랜드 표시 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>로고</label>
          <div className={styles.attachAddRow}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: hasLogo ? '#18181b' : '#f4f4f5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
              {hasLogo ? name.slice(0, 1) || '?' : ''}
            </div>
            <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={() => setHasLogo((v) => !v)}>{hasLogo ? '로고 제거' : '로고 업로드'}</button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>브랜드 설명</label>
          <textarea className={styles.formTextarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="브랜드 소개를 입력하세요" />
        </div>

        <div className={styles.sectionTitleLoose}>노출 설정</div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={exposure} onChange={(e) => setExposure(e.target.checked)} />
            브랜드 노출
          </label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>노출 순서</label>
          <input className={styles.formInput} type="number" min={1} value={exposureOrder} onChange={(e) => setExposureOrder(e.target.value)} />
        </div>

        <div className={styles.sectionTitleLoose}>내부 관리</div>
        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label className={styles.formLabel}>담당자</label>
          <select className={styles.formSelect} value={owner} onChange={(e) => setOwner(e.target.value)}>
            {OWNERS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 12 }}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.editCancel} onClick={onCancel}>취소</button>
        <button type="button" className={styles.editConfirm} onClick={submit}>{editing ? '수정 저장' : '등록'}</button>
      </div>
    </aside>
  );
}
