import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './ComponentsPage.module.css';
import {
  CommonButton, CommonButtonGroup, CommonInput, CommonSelect, CommonCheckbox, CommonCheckboxGroup,
  CommonRadioGroup, CommonSwitch, CommonTextarea, CommonDivider, CommonBadge, CommonHeader, CommonForm, CommonFormField,
  type CommonSelectOption,
} from '../../components/common/CommonControls';
import {
  CommonTable, CommonListItem, CommonList, CommonAccordion, CommonAccordionItem, CommonNoData,
  CommonTooltip, CommonTabs, CommonBreadcrumb, CommonGrid, type CommonTableColumn,
} from '../../components/common/CommonData';
import {
  showToast, CommonToastContainer, CommonLoading, CommonProgressBar, CommonSteps, CommonConfirmAction,
} from '../../components/common/CommonFeedback';
import { CommonDatePicker, CommonTimePicker } from '../../components/common/CommonDateTime';
import { DatePicker } from '../../components/forms/DatePicker';
import { SearchField } from '../../components/SearchField';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { BusinessScopeSwitch } from '../../components/business/BusinessScopeSwitch';

interface Section {
  key: string;
  label: string;
}

const SECTIONS: Section[] = [
  { key: 'buttons', label: '버튼' },
  { key: 'inputs', label: '입력 필드' },
  { key: 'choices', label: '선택 컨트롤' },
  { key: 'misc', label: '배지 · 폼 · 기타' },
  { key: 'table', label: '테이블' },
  { key: 'display', label: '리스트 · 표시' },
  { key: 'feedback', label: '피드백' },
  { key: 'datetime', label: '날짜 · 시간' },
  { key: 'search-grid', label: '검색 · 데이터 그리드' },
  { key: 'business', label: '비즈니스 모드' },
];

interface DemoRow {
  id: number;
  name: string;
  status: string;
  amount: string;
}

const DEMO_ROWS: DemoRow[] = [
  { id: 1, name: '회사 01', status: '정상', amount: '1,200,000원' },
  { id: 2, name: '회사 02', status: '보류', amount: '640,000원' },
  { id: 3, name: '회사 03', status: '정상', amount: '2,980,000원' },
];

const SELECT_OPTIONS: CommonSelectOption[] = [
  { label: 'Google', value: 'google' },
  { label: 'Kakao', value: 'kakao' },
  { label: 'Naver', value: 'naver' },
  { label: 'Apple', value: 'apple' },
];

function Demo({ name, desc, col, children, note }: { name: string; desc?: string; col?: boolean; children: React.ReactNode; note?: string }) {
  return (
    <div className={styles.demo}>
      <div className={styles.demoHead}>
        <span className={styles.demoName}>{name}</span>
        {desc && <span className={styles.demoDesc}>{desc}</span>}
      </div>
      <div className={`${styles.demoBody} ${col ? styles.col : ''}`}>{children}</div>
      {note && <div className={styles.demoNote}>{note}</div>}
    </div>
  );
}

export function ComponentsPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('buttons');

  const [inputText, setInputText] = useState('');
  const [inputPw, setInputPw] = useState('');
  const [inputSearch, setInputSearch] = useState('');
  const [selectValue, setSelectValue] = useState('kakao');
  const [multiValue, setMultiValue] = useState<string[]>(['google']);
  const [textareaValue, setTextareaValue] = useState('');

  const [checked, setChecked] = useState(true);
  const [checkGroup, setCheckGroup] = useState<string[]>(['a']);
  const [radioValue, setRadioValue] = useState('b2c');
  const [switchOn, setSwitchOn] = useState(true);

  const [tableSel, setTableSel] = useState<Array<string | number>>([]);
  const [tabValue, setTabValue] = useState('all');
  const [stepIndex, setStepIndex] = useState(1);
  const [progress, setProgress] = useState(62);

  const [dateSingle, setDateSingle] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [timeValue, setTimeValue] = useState('');
  const [legacyDate, setLegacyDate] = useState('');

  const [gridSearch, setGridSearch] = useState('');
  const [mode, setMode] = useState<'B2C' | 'C2C' | 'B2B'>('B2C');

  function scrollTo(key: string) {
    setActive(key);
    document.getElementById(`section-${key}`)?.scrollIntoView({ block: 'start' });
  }

  const tableColumns: CommonTableColumn<DemoRow>[] = [
    { key: 'name', title: '이름', dataIndex: 'name' },
    { key: 'status', title: '상태', dataIndex: 'status' },
    { key: 'amount', title: '금액', dataIndex: 'amount', align: 'right' },
  ];

  const gridColumns: GridColumn[] = [{ label: '이름' }, { label: '상태' }, { label: '금액', align: 'right' }];
  const gridRows: GridRow[] = DEMO_ROWS
    .filter((r) => r.name.includes(gridSearch))
    .map((r) => ({
      id: r.id,
      cells: [
        { kind: 'text', text: r.name, weight: 600 },
        { kind: 'statusDot', text: r.status, dot: r.status === '정상' ? '#059669' : '#b45309', fg: r.status === '정상' ? '#059669' : '#b45309' },
        { kind: 'text', text: r.amount, align: 'right', numeric: true },
      ],
    }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>컴포넌트</span>
        <span className={styles.subtitle}>이 백오피스에서 쓰는 공용 컴포넌트를 한 곳에서 확인합니다</span>
      </div>

      <div className={styles.body}>
        <nav className={styles.toc}>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`${styles.tocItem} ${active === s.key ? styles.active : ''}`}
              onClick={() => scrollTo(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className={styles.content} ref={contentRef}>
          {/* 버튼 */}
          <section id="section-buttons" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>버튼</span>
              <span className={styles.sectionHint}>CommonButton · CommonButtonGroup</span>
            </div>
            <div className={styles.card}>
              <Demo name="Variant" desc="primary / secondary / ghost / emphasis / outlined / inactive / none">
                <CommonButton variant="primary">Primary</CommonButton>
                <CommonButton variant="secondary">Secondary</CommonButton>
                <CommonButton variant="ghost">Ghost</CommonButton>
                <CommonButton variant="emphasis">Emphasis</CommonButton>
                <CommonButton variant="outlined">Outlined</CommonButton>
                <CommonButton variant="inactive">Inactive</CommonButton>
              </Demo>
              <Demo name="Size · Round · Icon · Loading">
                <CommonButton size="sm">Small</CommonButton>
                <CommonButton size="md">Medium</CommonButton>
                <CommonButton size="lg">Large</CommonButton>
                <CommonButton round icon={<Plus size={14} />}>등록</CommonButton>
                <CommonButton loading>저장 중</CommonButton>
                <CommonButton disabled>Disabled</CommonButton>
              </Demo>
              <Demo name="ButtonGroup">
                <CommonButtonGroup attached>
                  <CommonButton variant="secondary">일간</CommonButton>
                  <CommonButton variant="secondary">주간</CommonButton>
                  <CommonButton variant="secondary">월간</CommonButton>
                </CommonButtonGroup>
              </Demo>
            </div>
          </section>

          {/* 입력 필드 */}
          <section id="section-inputs" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>입력 필드</span>
              <span className={styles.sectionHint}>CommonInput · CommonSelect · CommonTextarea</span>
            </div>
            <div className={styles.card}>
              <Demo name="Input.Text / Search / Password" desc="clearable, showToggle, onSearch 지원">
                <div className={styles.pair}>
                  <span className={styles.pairLabel}>기본</span>
                  <CommonInput value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="이름을 입력하세요" />
                </div>
                <div className={styles.pair}>
                  <span className={styles.pairLabel}>검색</span>
                  <CommonInput.Search value={inputSearch} onChange={(e) => setInputSearch(e.target.value)} onSearch={(v) => showToast({ message: `검색: ${v || '(비어있음)'}` })} placeholder="검색어 입력 후 Enter" />
                </div>
                <div className={styles.pair}>
                  <span className={styles.pairLabel}>비밀번호</span>
                  <CommonInput.Password value={inputPw} onChange={(e) => setInputPw(e.target.value)} placeholder="••••••" />
                </div>
              </Demo>
              <Demo name="Select" desc="searchable / multi 지원">
                <div className={styles.pair}>
                  <span className={styles.pairLabel}>단일 선택</span>
                  <CommonSelect options={SELECT_OPTIONS} value={selectValue} onChange={(v) => setSelectValue(v as string)} />
                </div>
                <div className={styles.pair}>
                  <span className={styles.pairLabel}>다중 선택 · 검색</span>
                  <CommonSelect options={SELECT_OPTIONS} value={multiValue} onChange={(v) => setMultiValue(v as string[])} multi searchable />
                </div>
              </Demo>
              <Demo name="Textarea" col>
                <CommonTextarea value={textareaValue} onChange={(e) => setTextareaValue(e.target.value)} showCount maxLength={120} placeholder="메모를 입력하세요" />
              </Demo>
            </div>
          </section>

          {/* 선택 컨트롤 */}
          <section id="section-choices" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>선택 컨트롤</span>
              <span className={styles.sectionHint}>Checkbox · Radio · Switch</span>
            </div>
            <div className={styles.card}>
              <Demo name="Checkbox / CheckboxGroup">
                <CommonCheckbox checked={checked} onChange={setChecked}>단일 체크박스</CommonCheckbox>
                <CommonCheckboxGroup
                  options={[{ value: 'a', label: '옵션 A' }, { value: 'b', label: '옵션 B' }, { value: 'c', label: '옵션 C' }]}
                  value={checkGroup}
                  onChange={setCheckGroup}
                  direction="horizontal"
                />
              </Demo>
              <Demo name="RadioGroup">
                <CommonRadioGroup
                  name="demo-mode"
                  options={[{ value: 'b2c', label: 'B2C' }, { value: 'c2c', label: 'C2C' }, { value: 'b2b', label: 'B2B' }]}
                  value={radioValue}
                  onChange={setRadioValue}
                  direction="horizontal"
                />
              </Demo>
              <Demo name="Switch">
                <CommonSwitch checked={switchOn} onChange={setSwitchOn} label="마케팅 수신 동의" />
              </Demo>
            </div>
          </section>

          {/* 배지 · 폼 · 기타 */}
          <section id="section-misc" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>배지 · 폼 · 기타</span>
              <span className={styles.sectionHint}>Badge · Divider · Form/FormField · Header</span>
            </div>
            <div className={styles.card}>
              <Demo name="Badge">
                <CommonBadge type="primary">Primary</CommonBadge>
                <CommonBadge type="success">성공</CommonBadge>
                <CommonBadge type="error">오류</CommonBadge>
                <CommonBadge type="warning">경고</CommonBadge>
                <CommonBadge type="info-light">정보</CommonBadge>
                <CommonBadge type="ghost" dot>대기</CommonBadge>
              </Demo>
              <Demo name="Divider" col>
                <CommonDivider label="섹션 구분" />
              </Demo>
              <Demo name="Form / FormField" col>
                <CommonForm layout="2column">
                  <CommonFormField label="담당자" required>
                    <CommonInput placeholder="이름" />
                  </CommonFormField>
                  <CommonFormField label="이메일" helper="회사 도메인 계정만 허용됩니다">
                    <CommonInput placeholder="name@company.com" />
                  </CommonFormField>
                </CommonForm>
              </Demo>
              <Demo name="Header (CommonHeader)" col note="페이지 상단에 쓰는 별도의 헤더 컴포넌트 — 이 앱의 공용 상단바(components/shell/Header)와는 별개입니다.">
                <CommonHeader title="발주서 상세" back={() => showToast({ message: '뒤로가기 클릭' })} actions={<CommonButton size="sm">저장</CommonButton>} />
              </Demo>
            </div>
          </section>

          {/* 테이블 */}
          <section id="section-table" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>테이블</span>
              <span className={styles.sectionHint}>CommonTable — 정렬 · 선택 · 페이지네이션</span>
            </div>
            <div className={styles.card}>
              <Demo name="CommonTable" col>
                <CommonTable
                  columns={tableColumns}
                  data={DEMO_ROWS}
                  selectable
                  selectedRows={tableSel}
                  onSelectionChange={(keys) => setTableSel(keys)}
                  sortable
                  striped
                />
              </Demo>
            </div>
          </section>

          {/* 리스트 · 표시 */}
          <section id="section-display" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>리스트 · 표시</span>
              <span className={styles.sectionHint}>List · Accordion · NoData · Tooltip · Tabs · Breadcrumb · Grid</span>
            </div>
            <div className={styles.card}>
              <Demo name="List / ListItem" col>
                <CommonList bordered divided>
                  <CommonListItem title="김지은" description="ji***@gmail.com" trailing={<CommonBadge type="success-light">정상</CommonBadge>} />
                  <CommonListItem title="홍길동" description="ho***@naver.com" trailing={<CommonBadge type="error-light">정지</CommonBadge>} />
                </CommonList>
              </Demo>
              <Demo name="Accordion" col>
                <CommonAccordion>
                  <CommonAccordionItem value="a" title="배송 정책">묶음 배송, 도서산간 추가 배송비 등 배송 관련 정책입니다.</CommonAccordionItem>
                  <CommonAccordionItem value="b" title="환불 정책">단순 변심 환불은 7일 이내 가능합니다.</CommonAccordionItem>
                </CommonAccordion>
              </Demo>
              <Demo name="NoData">
                <CommonNoData type="empty" title="조건에 맞는 데이터가 없습니다" />
                <CommonNoData type="search" title="검색 결과가 없습니다" description="다른 검색어로 시도해 보세요" />
              </Demo>
              <Demo name="Tooltip">
                <CommonTooltip content="추가 설명이 여기에 표시됩니다"><CommonButton variant="secondary" size="sm">위에 마우스를 올려보세요</CommonButton></CommonTooltip>
              </Demo>
              <Demo name="Tabs" col>
                <CommonTabs
                  type="pill"
                  value={tabValue}
                  onChange={setTabValue}
                  items={[
                    { key: 'all', label: '전체' },
                    { key: 'ok', label: '정상' },
                    { key: 'hold', label: '보류' },
                  ]}
                />
              </Demo>
              <Demo name="Breadcrumb">
                <CommonBreadcrumb items={[{ label: '서비스 관리' }, { label: '회원 관리' }, { label: '회원 목록' }]} />
              </Demo>
              <Demo name="Grid" col>
                <CommonGrid columns={3} gap={10}>
                  <div className={styles.card} style={{ padding: 12, fontSize: 12 }}>1</div>
                  <div className={styles.card} style={{ padding: 12, fontSize: 12 }}>2</div>
                  <div className={styles.card} style={{ padding: 12, fontSize: 12 }}>3</div>
                </CommonGrid>
              </Demo>
            </div>
          </section>

          {/* 피드백 */}
          <section id="section-feedback" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>피드백</span>
              <span className={styles.sectionHint}>Toast · Loading · ProgressBar · Steps · ConfirmAction</span>
            </div>
            <div className={styles.card}>
              <Demo name="Toast" desc="showToast() 호출 — 화면 우상단에 표시됩니다">
                <CommonButton variant="secondary" size="sm" onClick={() => showToast({ message: '저장되었습니다', type: 'success' })}>성공</CommonButton>
                <CommonButton variant="secondary" size="sm" onClick={() => showToast({ message: '처리 중 오류가 발생했습니다', type: 'error' })}>오류</CommonButton>
                <CommonButton variant="secondary" size="sm" onClick={() => showToast({ message: '재고가 얼마 남지 않았습니다', type: 'warning' })}>경고</CommonButton>
              </Demo>
              <Demo name="Loading">
                <CommonLoading type="spinner" text="불러오는 중" />
                <CommonLoading type="dots" />
                <CommonLoading type="skeleton" rows={2} />
              </Demo>
              <Demo name="ProgressBar" col>
                <CommonProgressBar value={progress} showValue label="처리율" />
                <CommonButtonGroup>
                  <CommonButton size="sm" variant="secondary" onClick={() => setProgress((v) => Math.max(0, v - 10))}>-10</CommonButton>
                  <CommonButton size="sm" variant="secondary" onClick={() => setProgress((v) => Math.min(100, v + 10))}>+10</CommonButton>
                </CommonButtonGroup>
              </Demo>
              <Demo name="Steps" col>
                <CommonSteps
                  current={stepIndex}
                  onChange={setStepIndex}
                  steps={[{ title: '주문 접수' }, { title: '결제 확인' }, { title: '배송 준비' }, { title: '배송 완료' }]}
                />
              </Demo>
              <Demo name="ConfirmAction" col>
                <CommonConfirmAction
                  title="이 항목을 삭제할까요?"
                  description="삭제 후에는 되돌릴 수 없습니다."
                  destructive
                  onConfirm={() => showToast({ message: '삭제되었습니다', type: 'success' })}
                  onCancel={() => showToast({ message: '취소했습니다' })}
                />
              </Demo>
            </div>
          </section>

          {/* 날짜 · 시간 */}
          <section id="section-datetime" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>날짜 · 시간</span>
              <span className={styles.sectionHint}>CommonDatePicker · CommonTimePicker · (구)DatePicker</span>
            </div>
            <div className={styles.card}>
              <Demo name="CommonDatePicker — 단일">
                <CommonDatePicker value={dateSingle} onChange={(v) => setDateSingle(v as string | null)} />
              </Demo>
              <Demo name="CommonDatePicker — 기간">
                <CommonDatePicker mode="range" value={dateRange} onChange={(v) => setDateRange(v as [string | null, string | null])} />
              </Demo>
              <Demo name="CommonTimePicker">
                <CommonTimePicker value={timeValue} onChange={setTimeValue} />
              </Demo>
              <Demo name="DatePicker (레거시)" desc="components/forms — 일부 기존 페이지에서 계속 사용 중">
                <DatePicker value={legacyDate} onChange={(e) => setLegacyDate(e.target.value)} />
              </Demo>
            </div>
          </section>

          {/* 검색 · 데이터 그리드 */}
          <section id="section-search-grid" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>검색 · 데이터 그리드</span>
              <span className={styles.sectionHint}>SearchField · DataGrid — 대부분의 목록 페이지가 이 두 컴포넌트로 구성됩니다</span>
            </div>
            <div className={styles.card}>
              <Demo name="SearchField" col>
                <SearchField value={gridSearch} onValueChange={setGridSearch} placeholder="이름으로 검색" shortcutHint="/" />
              </Demo>
              <Demo name="DataGrid" col note="검색어를 입력하면 아래 표가 실시간으로 좁혀집니다">
                <DataGrid
                  columns={gridColumns}
                  rows={gridRows}
                  gridTemplate="1fr 100px 120px"
                  minWidth="420px"
                  empty={gridRows.length === 0}
                  emptyText="검색 결과가 없습니다"
                />
              </Demo>
            </div>
          </section>

          {/* 비즈니스 모드 */}
          <section id="section-business" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>비즈니스 모드</span>
              <span className={styles.sectionHint}>BusinessScopeSwitch — B2B/B2C/C2C 모드 토글에 쓰는 공용 컴포넌트</span>
            </div>
            <div className={styles.card}>
              <Demo name="BusinessScopeSwitch" col note="회원 목록 등 모드 통합 페이지 상단의 토글과 동일한 컴포넌트입니다">
                <BusinessScopeSwitch value={mode} options={['B2C', 'C2C', 'B2B'] as const} onChange={setMode} note={`현재 선택: ${mode}`} />
              </Demo>
            </div>
          </section>
        </div>
      </div>

      <CommonToastContainer />
    </div>
  );
}
