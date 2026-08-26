import { useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { ROLES, type AdminAccount, type AdminStatus } from './adminData';

interface Props {
  admin: AdminAccount | null;
  nextId: string;
  lockSuperAdminRole: boolean;
  onClose: () => void;
  onSave: (input: { id: string; name: string; email: string; phone: string; roleIds: string[]; status: AdminStatus; memo: string }) => void;
}

export function AdminEditorDrawer({ admin, nextId, lockSuperAdminRole, onClose, onSave }: Props) {
  const isEdit = !!admin;
  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [phone, setPhone] = useState(admin?.phone ?? '');
  const [roleIds, setRoleIds] = useState<string[]>(admin?.roleIds ?? []);
  const [status, setStatus] = useState<AdminStatus>(admin?.status ?? '정상');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  function toggleRole(id: string) {
    if (id === 'role-super' && lockSuperAdminRole && roleIds.includes(id)) return;
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function submit() {
    if (!name.trim() || !email.trim()) {
      setError('관리자명과 이메일은 필수 입력 항목입니다.');
      return;
    }
    if (roleIds.length === 0) {
      setError('최소 하나 이상의 역할을 선택해야 합니다.');
      return;
    }
    onSave({ id: admin?.id ?? nextId, name: name.trim(), email: email.trim(), phone: phone.trim(), roleIds, status, memo: memo.trim() });
  }

  return (
    <aside className={`${styles.aside} ${styles.wideAside}`}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>관리자 관리</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{isEdit ? '관리자 정보 수정' : '관리자 등록'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>관리자 ID</label>
          <input className={styles.formInput} value={admin?.id ?? nextId} disabled style={{ color: '#a1a1aa', background: '#fafafa' }} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>관리자명 *</label>
          <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="관리자명을 입력하세요" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>이메일 *</label>
          <input className={styles.formInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>연락처</label>
          <input className={styles.formInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
        </div>

        <div className={styles.sectionTitleLoose}>권한 설정</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>역할 *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map((r) => (
              <label key={r.id} className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={roleIds.includes(r.id)}
                  disabled={r.id === 'role-super' && lockSuperAdminRole && roleIds.includes(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                {r.name}
              </label>
            ))}
          </div>
          {lockSuperAdminRole && (
            <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 6 }}>
              마지막 남은 최고 관리자 계정입니다. 이 계정의 최고 관리자 역할은 해제할 수 없습니다.
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>계정 상태</label>
          <div className={styles.radioRow}>
            {(['정상', '비활성'] as AdminStatus[]).map((s) => (
              <label key={s} className={styles.radioOption}>
                <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} disabled={admin?.isSuperAdmin && s === '비활성' && lockSuperAdminRole} />
                {s}
              </label>
            ))}
          </div>
        </div>

        {!isEdit && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>관리자 메모</label>
            <textarea className={styles.formTextarea} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="선택 사항" />
          </div>
        )}

        {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.editCancel} onClick={onClose}>취소</button>
        <button type="button" className={styles.editConfirm} onClick={submit}>{isEdit ? '저장' : '등록'}</button>
      </div>
    </aside>
  );
}
