import { CreditCard, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import {
  CommonButton,
  CommonDatePicker,
  CommonFormField,
  CommonInput,
  CommonSelect,
  CommonTextarea,
} from '../../components/common';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { MatchStatus, PaymentStatus } from './paymentsData';
import styles from './PaymentRegisterDrawer.module.css';

export interface PaymentRegisterValues {
  partner: string;
  amount: number;
  method: string;
  paidAt: string;
  depositor: string;
  bank: string;
  txId: string;
  orderId: string;
  invoiceId: string;
  owner: string;
  status: PaymentStatus;
  match: MatchStatus;
  memo: string;
}

interface PaymentRegisterDrawerProps {
  onClose: () => void;
  onSubmit: (values: PaymentRegisterValues) => void;
}

interface RegisterForm {
  partner: string;
  amount: string;
  method: string;
  paidAt: string;
  depositor: string;
  bank: string;
  txId: string;
  orderId: string;
  invoiceId: string;
  owner: string;
  status: PaymentStatus;
  match: MatchStatus;
  memo: string;
}

type RegisterField = keyof RegisterForm;
type FormErrors = Partial<Record<RegisterField, string>>;

function localDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

const initialForm = (): RegisterForm => ({
  partner: '',
  amount: '',
  method: '계좌이체',
  paidAt: localDateTime(),
  depositor: '',
  bank: '국민은행',
  txId: '',
  orderId: '',
  invoiceId: '',
  owner: 'admin01',
  status: '확인대기',
  match: '미매칭',
  memo: '',
});

export function PaymentRegisterDrawer({ onClose, onSubmit }: PaymentRegisterDrawerProps) {
  const asideRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  useOutsideClose(asideRef, onClose);

  const update = <K extends RegisterField>(key: K, value: RegisterForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const amount = Number(form.amount);
    if (!form.partner.trim()) nextErrors.partner = '거래처를 입력해 주세요.';
    if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = '0원보다 큰 결제금액을 입력해 주세요.';
    if (!form.paidAt) nextErrors.paidAt = '결제일시를 선택해 주세요.';
    if (!form.depositor.trim()) nextErrors.depositor = '입금자 또는 결제자명을 입력해 주세요.';
    if (form.match !== '미매칭' && !form.invoiceId.trim()) nextErrors.invoiceId = '매칭 상태라면 청구번호가 필요합니다.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSubmit({ ...form, partner: form.partner.trim(), amount, depositor: form.depositor.trim(), txId: form.txId.trim(), orderId: form.orderId.trim(), invoiceId: form.invoiceId.trim(), memo: form.memo.trim() });
  };

  return (
    <aside ref={asideRef} className={styles.aside} aria-label="결제 등록">
      <div className={styles.head}>
        <div className={styles.headIcon}><CreditCard size={18} /></div>
        <div><h2>결제 등록</h2><p>수동으로 확인한 결제·입금 내역을 등록합니다.</p></div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="결제 등록 닫기"><X size={18} /></button>
      </div>

      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.body}>
          <section className={styles.section}>
            <div className={styles.sectionHead}><h3>결제 기본 정보</h3><span>* 필수 입력</span></div>
            <div className={styles.grid}>
              <CommonFormField label="거래처" required error={errors.partner} className={styles.full}>
                <CommonInput value={form.partner} onChange={(event) => update('partner', event.target.value)} placeholder="거래처명을 입력하세요" list="payment-partners" error={Boolean(errors.partner)} />
                <datalist id="payment-partners"><option value="회사 01" /><option value="회사 02" /><option value="㈜한빛물산" /><option value="대성유통" /><option value="케이스퀘어" /></datalist>
              </CommonFormField>
              <CommonFormField label="결제금액" required error={errors.amount}>
                <CommonInput.Number value={form.amount} min={1} step={1000} onChange={(event) => update('amount', event.target.value)} placeholder="0" suffix="원" error={Boolean(errors.amount)} />
              </CommonFormField>
              <CommonFormField label="결제수단" required>
                <CommonSelect value={form.method} onChange={(value) => update('method', String(value))} options={['계좌이체', '무통장입금', '카드', '가상계좌'].map((value) => ({ label: value, value }))} />
              </CommonFormField>
              <CommonFormField label="결제일시" required error={errors.paidAt} className={styles.full}>
                <CommonDatePicker showTime value={form.paidAt} onChange={(value) => update('paidAt', String(value ?? ''))} clearable={false} error={Boolean(errors.paidAt)} className={styles.datePicker} />
              </CommonFormField>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><h3>입금·승인 정보</h3></div>
            <div className={styles.grid}>
              <CommonFormField label="입금자 / 결제자" required error={errors.depositor}>
                <CommonInput value={form.depositor} onChange={(event) => update('depositor', event.target.value)} placeholder="입금자명" error={Boolean(errors.depositor)} />
              </CommonFormField>
              <CommonFormField label="은행 / 결제기관">
                <CommonSelect value={form.bank} onChange={(value) => update('bank', String(value))} options={['국민은행', '신한은행', '우리은행', '하나은행', '카드사 / PG', '-'].map((value) => ({ label: value, value }))} />
              </CommonFormField>
              <CommonFormField label="거래 ID" className={styles.full} helper="비워두면 내부 관리번호가 자동 생성됩니다.">
                <CommonInput value={form.txId} onChange={(event) => update('txId', event.target.value)} placeholder="은행 거래번호 또는 PG TID" />
              </CommonFormField>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><h3>연결 및 처리 정보</h3></div>
            <div className={styles.grid}>
              <CommonFormField label="주문번호">
                <CommonInput value={form.orderId} onChange={(event) => update('orderId', event.target.value)} placeholder="예: O-00583" />
              </CommonFormField>
              <CommonFormField label="청구번호" error={errors.invoiceId}>
                <CommonInput value={form.invoiceId} onChange={(event) => update('invoiceId', event.target.value)} placeholder="예: INV-00183" error={Boolean(errors.invoiceId)} />
              </CommonFormField>
              <CommonFormField label="처리 상태" required>
                <CommonSelect value={form.status} onChange={(value) => update('status', String(value) as PaymentStatus)} options={['확인대기', '완료', '부분결제'].map((value) => ({ label: value, value }))} />
              </CommonFormField>
              <CommonFormField label="매칭 상태" required>
                <CommonSelect value={form.match} onChange={(value) => update('match', String(value) as MatchStatus)} options={['미매칭', '매칭완료', '일부매칭'].map((value) => ({ label: value, value }))} />
              </CommonFormField>
              <CommonFormField label="담당자" required className={styles.full}>
                <CommonSelect value={form.owner} onChange={(value) => update('owner', String(value))} options={['admin01', 'admin02', 'admin03'].map((value) => ({ label: value, value }))} />
              </CommonFormField>
              <CommonFormField label="관리자 메모" className={styles.full}>
                <CommonTextarea value={form.memo} onChange={(event) => update('memo', event.target.value)} placeholder="확인 근거나 후속 조치 내용을 입력하세요" rows={3} maxLength={300} showCount />
              </CommonFormField>
            </div>
          </section>

          <div className={styles.notice}>등록된 결제는 목록 최상단에 추가되며, 상세 화면에서 결제 확인·배분 수정·취소 처리를 이어갈 수 있습니다.</div>
        </div>

        <div className={styles.footer}>
          <CommonButton variant="secondary" onClick={onClose}>취소</CommonButton>
          <CommonButton type="submit">결제 등록</CommonButton>
        </div>
      </form>
    </aside>
  );
}
