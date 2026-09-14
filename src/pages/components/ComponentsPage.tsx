import { useRef, useState } from 'react';
import { Plus, TrendingUp, AlertCircle, CheckCircle, ArrowUpRight } from 'lucide-react';
import styles from './ComponentsPage.module.css';
import {
  CommonButton, CommonButtonGroup, CommonSegmented, CommonInput, CommonSelect, CommonCheckbox, CommonCheckboxGroup,
  CommonRadioGroup, CommonSwitch, CommonTextarea, CommonDivider, CommonBadge, CommonHeader, CommonForm, CommonFormField,
  PageSizeSelect,
  type CommonSelectOption,
} from '../../components/common/CommonControls';
import { SearchField } from '../../components/SearchField';
import {
  CommonTable, CommonListItem, CommonList, CommonAccordion, CommonAccordionItem, CommonNoData,
  CommonTooltip, CommonTabs, CommonBreadcrumb, CommonGrid, type CommonTableColumn,
} from '../../components/common/CommonData';
import {
  CommonCard, CommonStatCard, CommonStatGrid,
} from '../../components/common/CommonCard';
import {
  showToast, CommonLoading, CommonProgressBar, CommonSteps, CommonConfirmAction,
  CommonAlert, CommonNotice,
} from '../../components/common/CommonFeedback';
import { CommonDatePicker, CommonTimePicker } from '../../components/common/CommonDateTime';
import { DatePicker } from '../../components/forms/DatePicker';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { BusinessScopeSwitch } from '../../components/business/BusinessScopeSwitch';
import { StatisticsBarChart, StatisticsDonutChart, StatisticsHorizontalBarChart, StatisticsLineChart } from '../../components/charts';
import { DesignTokensSection } from './DesignTokensSection';

interface Section {
  key: string;
  label: string;
}

const SECTIONS: Section[] = [
  { key: 'tokens', label: '디자인 토큰' },
  { key: 'cards', label: '카드 · 통계' },
  { key: 'buttons', label: '버튼' },
  { key: 'inputs', label: '입력 필드' },
  { key: 'choices', label: '선택 컨트롤' },
  { key: 'misc', label: '배지 · 폼 · 기타' },
  { key: 'table', label: '테이블' },
  { key: 'display', label: '리스트 · 표시' },
  { key: 'charts', label: '통계 차트' },
  { key: 'feedback', label: '피드백' },
  { key: 'datetime', label: '날짜 · 시간' },
  { key: 'search-grid', label: '검색 필드 · 데이터 그리드' },
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

const CHART_DATA = [
  { label: '8/01', value: 42 },
  { label: '8/05', value: 58 },
  { label: '8/10', value: 51 },
  { label: '8/15', value: 76 },
  { label: '8/20', value: 68 },
  { label: '8/25', value: 91 },
  { label: '8/31', value: 84 },
];
const CHART_PREVIOUS = [35, 47, 49, 61, 57, 72, 69];

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
  const [active, setActive] = useState('tokens');

  const [btnSegmented, setBtnSegmented] = useState('daily');
  const [btnPreset, setBtnPreset] = useState('1m');

  const [inputText, setInputText] = useState('');
  const [inputPw, setInputPw] = useState('');
  const [inputSearch, setInputSearch] = useState('');
  const [searchFieldText, setSearchFieldText] = useState('');
  const [selectValue, setSelectValue] = useState('kakao');
  const [multiValue, setMultiValue] = useState<string[]>(['google']);
  const [textareaValue, setTextareaValue] = useState('');

  const [checked, setChecked] = useState(true);
  const [checkGroup, setCheckGroup] = useState<string[]>(['a']);
  const [radioValue, setRadioValue] = useState('b2c');
  const [switchOn, setSwitchOn] = useState(true);

  const [tableSel, setTableSel] = useState<Array<string | number>>([]);
  const [tabValue, setTabValue] = useState('all');
  const [segmentTab, setSegmentTab] = useState('b2c');
  const [stepIndex, setStepIndex] = useState(1);
  const [progress, setProgress] = useState(62);

  const [dateSingle, setDateSingle] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [timeValue, setTimeValue] = useState('');
  const [legacyDate, setLegacyDate] = useState('');

  const [gridSearch, setGridSearch] = useState('');
  const [mode, setMode] = useState<'B2C' | 'C2C' | 'B2B'>('B2C');
  const [chartHeight, setChartHeight] = useState(220);

  function scrollTo(key: string) {
    setActive(key);
    const target = document.getElementById(`section-${key}`);
    if (target && contentRef.current) {
      const targetTop = target.offsetTop - contentRef.current.offsetTop;
      contentRef.current.scrollTo({ top: Math.max(0, targetTop - 12), behavior: 'smooth' });
    } else {
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
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
          {/* 디자인 토큰 */}
          <section id="section-tokens" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>디자인 토큰</span>
              <span className={styles.sectionHint}>Design Tokens — 색상, 서체, 곡률, 그림자, 높이 등 백오피스 UI 표준 규격</span>
            </div>
            <div className={styles.card}>
              <DesignTokensSection />
            </div>
          </section>

          {/* 카드 · 통계 */}
          <section id="section-cards" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>카드 · 통계</span>
              <span className={styles.sectionHint}>CommonStatCard · CommonStatGrid · CommonCard — 백오피스 대시보드 및 지표 요약에 사용하는 공용 카드 컴포넌트</span>
            </div>
            <div className={styles.card}>
              {/* 1. 첨부 이미지 기준 표준 지표 카드 */}
              <Demo
                name="표준 통계 카드 (첨부 이미지 규격)"
                col
                desc="상태 표시 도트(dot), 주요 지표 수치(value), 보조 설명(note), 톤 컬러(tone)가 적용된 4열 메트릭 카드입니다"
              >
                <CommonStatGrid columns={4}>
                  <CommonStatCard
                    label="검토 필요"
                    dot="#ef4444"
                    value="1건"
                    note="담당자 배정 필요"
                    tone="danger"
                  />
                  <CommonStatCard
                    label="고위험 건"
                    dot="#f59e0b"
                    value="4건"
                    note="위험도 높음 이상"
                    tone="warn"
                  />
                  <CommonStatCard
                    label="거래 보류 연계"
                    dot="#8b5cf6"
                    value="2건"
                    note="현재 보류 상태"
                    tone="neutral"
                  />
                  <CommonStatCard
                    label="오늘 종결"
                    dot="#10b981"
                    value="2건"
                    note="조치 및 오탐 포함"
                    tone="up"
                  />
                </CommonStatGrid>
              </Demo>

              {/* 2. 속성 베리에이션 (톤 및 도트, 뱃지, 아이콘) */}
              <Demo
                name="속성 베리에이션 (Tone · Badge · Icon · Custom ValueColor)"
                col
                desc="tone('up' | 'down' | 'warn' | 'neutral'), badge, icon, valueColor 등의 속성으로 카드의 시각적 의미를 조절합니다"
              >
                <CommonStatGrid columns={4}>
                  <CommonStatCard
                    label="당월 총 매출"
                    value="₩128,450,000"
                    valueColor="#18181b"
                    note="+14.2% 전월 대비 상승"
                    tone="up"
                    badge={<CommonBadge color="green" size="sm">성장</CommonBadge>}
                  />
                  <CommonStatCard
                    label="신규 반품 요청"
                    value="23건"
                    valueColor="#dc2626"
                    note="-3건 전주 대비 감소"
                    tone="down"
                    dot="#ef4444"
                  />
                  <CommonStatCard
                    label="미처리 정산 건"
                    value="12건"
                    note="마감 D-2 예정"
                    tone="warn"
                    dot="#f59e0b"
                  />
                  <CommonStatCard
                    label="시스템 가동률"
                    value="99.98%"
                    note="최근 30일 정상 유지"
                    tone="up"
                    icon={<CheckCircle size={14} color="#10b981" />}
                  />
                </CommonStatGrid>
              </Demo>

              {/* 3. 카드 외형 베리에이션 (Variant) 및 클릭 인터랙션 */}
              <Demo
                name="외형 베리에이션 & 클릭 인터랙션 (Variant & Clickable)"
                col
                desc="variant('default' | 'flat' | 'bordered' | 'active') 및 onClick 속성을 통해 인터랙티브 카드를 지원합니다"
              >
                <CommonStatGrid columns={4}>
                  <CommonStatCard
                    variant="default"
                    label="기본 카드 (Default)"
                    value="1,420명"
                    note="클릭 시 토스트 알림"
                    onClick={() => showToast({ message: '회원 통계 카드가 클릭되었습니다.' })}
                  />
                  <CommonStatCard
                    variant="flat"
                    label="플랫 배경 (Flat)"
                    value="84.5%"
                    note="은은한 배경색 강조"
                    dot="#3b82f6"
                  />
                  <CommonStatCard
                    variant="bordered"
                    label="테두리 강조 (Bordered)"
                    value="3,200건"
                    note="선명한 외곽선"
                    dot="#8b5cf6"
                  />
                  <CommonStatCard
                    variant="active"
                    label="활성 상태 (Active)"
                    value="선택됨"
                    note="현재 필터 적용 중"
                    dot="#10b981"
                    tone="up"
                  />
                </CommonStatGrid>
              </Demo>

              {/* 4. 범용 컨테이너 카드 (CommonCard) */}
              <Demo
                name="범용 컨테이너 카드 (CommonCard)"
                col
                desc="헤더(title, extra)와 자유로운 본문 콘텐츠(children)를 감싸는 범용 카드 컴포넌트입니다"
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, width: '100%' }}>
                  <CommonCard
                    title="최근 정산 집계 현황"
                    extra={<CommonButton variant="ghost" size="sm" icon={<ArrowUpRight size={13} />}>상세보기</CommonButton>}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem', color: 'var(--common-text-sub)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>정산 확정 완료액</span>
                        <strong style={{ color: 'var(--common-text)' }}>₩45,200,000</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>보류 및 심사 중</span>
                        <strong style={{ color: '#dc2626' }}>₩1,350,000</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>차기 정산 예정일</span>
                        <strong style={{ color: 'var(--common-text)' }}>2026.04.05</strong>
                      </div>
                    </div>
                  </CommonCard>

                  <CommonCard
                    variant="flat"
                    title="배송 정책 알림"
                    extra={<CommonBadge color="blue" size="sm">정책 안내</CommonBadge>}
                  >
                    <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--common-text-sub)' }}>
                      기본 배송비 및 도서산간 배송비 정책이 표준화되어 모든 B2C/C2C 거래에 일괄 적용됩니다.
                      추가 설정이 필요하신 경우 배송 관리 메뉴를 확인하세요.
                    </p>
                  </CommonCard>
                </div>
              </Demo>
            </div>
          </section>

          {/* 버튼 */}
          <section id="section-buttons" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>버튼</span>
              <span className={styles.sectionHint}>CommonButton · CommonButtonGroup</span>
            </div>
            <div className={styles.card}>
              <Demo name="Variant" desc="기본 업무 버튼">
                <CommonButton variant="primary">Primary</CommonButton>
                <CommonButton variant="primary-light">Primary Light</CommonButton>
                <CommonButton variant="secondary">Secondary</CommonButton>
                <CommonButton variant="ghost">Ghost</CommonButton>
                <CommonButton variant="emphasis">Emphasis</CommonButton>
                <CommonButton variant="outlined">Outlined</CommonButton>
                <CommonButton variant="none">Text</CommonButton>
                <CommonButton variant="inactive">Inactive</CommonButton>
              </Demo>
              <Demo name="Status Variant" desc="실제 승인·경고·삭제 업무에 사용하는 색상">
                <CommonButton variant="success">승인</CommonButton>
                <CommonButton variant="success-light">승인 선택</CommonButton>
                <CommonButton variant="warning">확인 필요</CommonButton>
                <CommonButton variant="danger-light">반려</CommonButton>
                <CommonButton variant="danger">삭제</CommonButton>
              </Demo>
              <Demo name="Size · Round · Icon · Loading" desc="sm 30 / md 34 / lg 36px">
                <CommonButton size="sm">Small</CommonButton>
                <CommonButton size="md">Medium</CommonButton>
                <CommonButton size="lg">Large</CommonButton>
                <CommonButton round icon={<Plus size={14} />}>등록</CommonButton>
                <CommonButton loading>저장 중</CommonButton>
                <CommonButton disabled>Disabled</CommonButton>
              </Demo>
              <Demo
                name="ButtonGroup & Segmented (실무 사용 버튼 그룹)"
                col
                desc="m2m-uiux-react 기반 ButtonGroup 및 Segmented 컴포넌트에 백오피스 표준 디자인을 덮어씌운 실무 버튼 그룹입니다"
              >
                {/* 1. 세그먼트형 버튼 그룹 (Segmented) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--common-text-sub)' }}>
                    세그먼트형 (CommonSegmented) — 조회 단위(일간/주간/월간) 및 뷰 전환 토글에 사용
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                    <CommonSegmented
                      size="md"
                      value={btnSegmented}
                      onChange={(val) => setBtnSegmented(val)}
                      options={[
                        { label: '일간', value: 'daily' },
                        { label: '주간', value: 'weekly' },
                        { label: '월간', value: 'monthly' },
                        { label: '연간', value: 'yearly' },
                      ]}
                    />
                    <span style={{ fontSize: '0.71875rem', color: 'var(--common-text-muted)' }}>
                      선택된 단위: <b style={{ color: 'var(--common-primary)' }}>{btnSegmented}</b>
                    </span>
                  </div>
                </div>

                {/* 2. 맞붙은 프리셋 선택형 버튼 그룹 (Attached Preset Group) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 10 }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--common-text-sub)' }}>
                    맞붙은 프리셋 선택형 (CommonButtonGroup attached) — 날짜 기간 필터 및 비율 프리셋에 사용
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                    <CommonButtonGroup attached size="md">
                      {[
                        { label: '오늘', value: 'today' },
                        { label: '1주일', value: '1w' },
                        { label: '1개월', value: '1m' },
                        { label: '3개월', value: '3m' },
                        { label: '전체', value: 'all' },
                      ].map((item) => (
                        <CommonButton
                          key={item.value}
                          type="button"
                          variant={btnPreset === item.value ? 'emphasis' : 'secondary'}
                          size="md"
                          selected={btnPreset === item.value}
                          aria-pressed={btnPreset === item.value}
                          onClick={() => setBtnPreset(item.value)}
                        >
                          {item.label}
                        </CommonButton>
                      ))}
                    </CommonButtonGroup>
                    <span style={{ fontSize: '0.71875rem', color: 'var(--common-text-muted)' }}>
                      선택된 기간: <b style={{ color: 'var(--common-primary)' }}>{btnPreset}</b>
                    </span>
                  </div>
                </div>

                {/* 3. 작업 액션 버튼 그룹 (Spaced Action Group) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 10 }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--common-text-sub)' }}>
                    작업 액션 버튼 그룹 (CommonButtonGroup) — 다이얼로그 / 목록 툴바 액션 묶음
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
                    <CommonButtonGroup direction="row">
                      <CommonButton variant="secondary" size="md" onClick={() => showToast({ message: '취소했습니다' })}>
                        취소
                      </CommonButton>
                      <CommonButton variant="primary" size="md" onClick={() => showToast({ message: '저장 완료되었습니다', type: 'success' })}>
                        저장
                      </CommonButton>
                    </CommonButtonGroup>

                    <CommonButtonGroup direction="row">
                      <CommonButton variant="outlined" size="md">
                        엑셀 다운로드
                      </CommonButton>
                      <CommonButton variant="emphasis" size="md">
                        신규 등록
                      </CommonButton>
                    </CommonButtonGroup>
                  </div>
                </div>

                {/* 4. 크기 규격 (Sizes: sm 28px · md 32px · lg 36px) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 10 }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--common-text-sub)' }}>
                    크기 규격 (Sizes: Small 28px · Medium 32px · Large 36px)
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
                    <CommonSegmented size="sm" defaultValue="B2C" options={['B2C', 'C2C', 'B2B']} />
                    <CommonSegmented size="md" defaultValue="B2C" options={['B2C', 'C2C', 'B2B']} />
                    <CommonSegmented size="lg" defaultValue="B2C" options={['B2C', 'C2C', 'B2B']} />
                  </div>
                </div>
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
              <Demo name="검색 필드 (SearchField)" desc="목록 페이지 전반에서 쓰는 돋보기 아이콘 일체형 표준 검색창입니다. value / onValueChange 로 제어합니다.">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                  <SearchField
                    style={{ minWidth: 320, maxWidth: 460 }}
                    value={searchFieldText}
                    onValueChange={setSearchFieldText}
                    placeholder="취소번호 / 주문번호 / 고객명 / 상품명 / 취소사유"
                    onSearch={(v) => showToast({ message: `검색: ${v || "(비어있음)"}` })}
                  />
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
                <div className={styles.pair}>
                  <span className={styles.pairLabel}>페이지 크기 (PageSizeSelect)</span>
                  <PageSizeSelect defaultValue="20개씩 보기" />
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
              <Demo name="Badge" desc="운영 화면에서 사용하는 상태 색상">
                <CommonBadge type="success-light">정상</CommonBadge>
                <CommonBadge type="info-light">진행중</CommonBadge>
                <CommonBadge type="primary-light">예약</CommonBadge>
                <CommonBadge type="warning-light">주의</CommonBadge>
                <CommonBadge type="error-light">실패</CommonBadge>
                <CommonBadge type="ghost">중지</CommonBadge>
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
              <Demo name="Tabs" col desc="type 또는 kind 속성으로 디자인 구분 (segmented: 세그먼트형 · filter: 검색 필터형 · line: 기본 라인형)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.71875rem', fontWeight: 700, color: 'var(--common-text-muted)' }}>
                      세그먼트형 (kind="segmented") — 유형 전환 / 토글 탭
                    </span>
                    <CommonTabs
                      kind="segmented"
                      value={segmentTab}
                      onChange={setSegmentTab}
                      items={[
                        { key: 'b2c', label: 'B2C' },
                        { key: 'c2c', label: 'C2C' },
                        { key: 'b2b', label: 'B2B' },
                      ]}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.71875rem', fontWeight: 700, color: 'var(--common-text-muted)' }}>
                      검색 필터형 (kind="filter" 또는 type="pill") — 목록 상태 필터 탭
                    </span>
                    <CommonTabs
                      kind="filter"
                      value={tabValue}
                      onChange={setTabValue}
                      items={[
                        { key: 'all', label: '전체' },
                        { key: 'ok', label: '정상' },
                        { key: 'hold', label: '보류' },
                      ]}
                    />
                  </div>
                </div>
              </Demo>
              <Demo name="Breadcrumb">
                <CommonBreadcrumb items={[{ label: '서비스 관리' }, { label: '회원 관리' }, { label: '회원 목록' }]} />
              </Demo>
              <Demo name="Grid" col>
                <CommonGrid columns={3} gap={10}>
                  <div className={styles.card} style={{ padding: 12, fontSize: '0.75rem' }}>1</div>
                  <div className={styles.card} style={{ padding: 12, fontSize: '0.75rem' }}>2</div>
                  <div className={styles.card} style={{ padding: 12, fontSize: '0.75rem' }}>3</div>
                </CommonGrid>
              </Demo>
            </div>
          </section>

          {/* 통계 차트 */}
          <section id="section-charts" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>통계 차트</span>
              <span className={styles.sectionHint}>StatisticsBarChart · StatisticsLineChart · StatisticsHorizontalBarChart · StatisticsDonutChart — width, height, aspectRatio로 크기와 비율 조절</span>
            </div>
            <div className={styles.card}>
              <Demo name="막대 차트" col desc="색상, 음수 색상, 값 포맷, 표시 라벨 수를 설정할 수 있습니다.">
                <div className={styles.chartSizeControls}>
                  <span>높이 {chartHeight}px</span>
                  <CommonButtonGroup>
                    <CommonButton size="sm" variant="secondary" onClick={() => setChartHeight(180)}>180</CommonButton>
                    <CommonButton size="sm" variant="secondary" onClick={() => setChartHeight(220)}>220</CommonButton>
                    <CommonButton size="sm" variant="secondary" onClick={() => setChartHeight(280)}>280</CommonButton>
                  </CommonButtonGroup>
                </div>
                <StatisticsBarChart data={CHART_DATA} metricLabel="거래 건수" height={chartHeight} formatValue={(value) => `${value}건`} />
              </Demo>
              <Demo name="선형 · 비교선 차트" col desc="현재 값과 비교 기간 값을 하나의 차트에 표시합니다.">
                <StatisticsLineChart
                  values={CHART_DATA.map((item) => item.value)}
                  comparisonValues={CHART_PREVIOUS}
                  labels={CHART_DATA.map((item) => item.label)}
                  height={chartHeight}
                  ariaLabel="컴포넌트 예제 추이 차트"
                />
              </Demo>
              <Demo name="영역형 · 포인트 차트" col desc="aspectRatio를 지정하면 부모 넓이에 맞춰 비율이 유지됩니다.">
                <StatisticsLineChart
                  values={CHART_DATA.map((item) => item.value)}
                  labels={CHART_DATA.map((item) => item.label)}
                  width="100%"
                  aspectRatio={3.2}
                  fill
                  showPoints
                  ariaLabel="컴포넌트 예제 영역형 차트"
                />
              </Demo>
              <Demo name="가로 막대 · 분포 차트" col desc="리뷰 평점처럼 항목별 건수와 구성비를 함께 표현합니다.">
                <StatisticsHorizontalBarChart
                  data={[
                    { label: '5점', value: 128, percent: 64 },
                    { label: '4점', value: 44, percent: 22 },
                    { label: '3점', value: 18, percent: 9 },
                    { label: '2점', value: 7, percent: 3.5 },
                    { label: '1점', value: 3, percent: 1.5 },
                  ]}
                  formatValue={(value) => `${value}건`}
                  ariaLabel="평점 분포 차트 예제"
                />
              </Demo>
              <Demo name="도넛 · 구성비 차트" col desc="카테고리 구성비처럼 전체 대비 비중을 표현합니다. maxLegendItems를 넘는 항목은 '기타'로 합칩니다.">
                <StatisticsDonutChart
                  data={[
                    { label: '디지털/가전', value: 4820000 },
                    { label: '의류/패션', value: 1960000 },
                    { label: '생활/주방', value: 1140000 },
                    { label: '스포츠/레저', value: 720000 },
                    { label: '도서/음반', value: 310000 },
                    { label: '기타 잡화', value: 150000 },
                  ]}
                  centerValue={186}
                  centerLabel="상품"
                  maxLegendItems={4}
                  ariaLabel="카테고리 구성비 차트 예제"
                />
              </Demo>
              <Demo name="도넛 · 세로 배치" col desc="direction='column'과 size·thickness로 좁은 사이드바에도 배치할 수 있습니다.">
                <StatisticsDonutChart
                  data={[
                    { label: '카드', value: 62 },
                    { label: '계좌이체', value: 24 },
                    { label: '간편결제', value: 14 },
                  ]}
                  direction="column"
                  size={110}
                  thickness={20}
                  centerValue="62%"
                  centerLabel="카드"
                  formatValue={(value) => `${value}%`}
                  ariaLabel="결제수단 구성비 차트 예제"
                />
              </Demo>
            </div>
          </section>

          {/* 피드백 */}
          <section id="section-feedback" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>피드백</span>
              <span className={styles.sectionHint}>CommonAlert · CommonNotice · Toast · Loading · ProgressBar · Steps · ConfirmAction</span>
            </div>
            <div className={styles.card}>
              <Demo name="CommonAlert — 경고 카드 배너 (이미지 1)" col desc="설정 누락, 정책 경고 등 중요 알림에 사용되며 원형 배지 아이콘, 제목, 설명, 우측 액션 버튼을 지원합니다.">
                <CommonAlert
                  type="warning"
                  variant="card"
                  title="설정 확인 필요 · 1건"
                  description="'카드' 결제를 사용하지만 연결된 PG가 없습니다."
                  actionText="결제수단에서 확인"
                  onAction={() => showToast({ message: '결제수단 페이지로 이동합니다.', type: 'warning' })}
                />
              </Demo>

              <Demo name="CommonNotice — 슬림 안내 띠 배너 (이미지 2)" col desc="계산 공식, 도움말, 시스템 상태 설명 등에 활용되는 컴팩트한 안내 바입니다.">
                <CommonNotice>
                  현재 가능 재고 = 현재고 + 예약재고 + 기타 입고 · 예약재고는 결제 완료된 주문 기준 · 접수재고 최종 반영
                </CommonNotice>
              </Demo>

              <Demo name="CommonAlert — 카드형 상태별 (Info · Error · Success)" col desc="variant='card'로 안내, 오류, 완료 상태별 카드를 구성할 수 있습니다.">
                <CommonAlert
                  type="info"
                  variant="card"
                  title="신규 정책 적용 안내"
                  description="2026년 9월 1일부터 개정된 반품/교환 배송비 정책이 자동 적용됩니다."
                  actionText="정책 보기"
                  onAction={() => showToast({ message: '정책 상세 보기', type: 'info' })}
                />
                <CommonAlert
                  type="error"
                  variant="card"
                  title="PG사 연동 오류 · 2건"
                  description="네이버페이 및 카카오페이 API 키 검증에 실패했습니다. 키 설정을 재확인해주세요."
                  actionText="연동 재시도"
                  onAction={() => showToast({ message: '연동 재시도 중...', type: 'error' })}
                />
                <CommonAlert
                  type="success"
                  variant="card"
                  title="설정 정상 반영 완료"
                  description="모든 결제수단과 PG사 연동 설정이 정상적으로 저장되었습니다."
                  closable
                  onClose={() => showToast({ message: '알림 카드를 닫았습니다.' })}
                />
              </Demo>

              <Demo name="CommonAlert — 슬림 띠 배너 상태별 (Strip)" col desc="variant='strip'으로 슬림한 공지 바를 표현하며, 아이콘이나 액션 버튼도 유연하게 지원합니다.">
                <CommonAlert
                  type="warning"
                  variant="strip"
                  title="주의:"
                  description="일부 결제수단 설정이 미완료되어 결제가 제한될 수 있습니다."
                  actionText="확인"
                  onAction={() => showToast({ message: '확인 클릭' })}
                  closable
                  onClose={() => showToast({ message: '닫기 클릭' })}
                />
                <CommonAlert
                  type="neutral"
                  variant="strip"
                  description="읽기 전용 모드에서는 데이터를 조회할 수만 있으며 변경 사항은 저장되지 않습니다."
                />
              </Demo>

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
              <Demo
                name="검색 필드 (SearchField)"
                col
                desc="백오피스 전 페이지에서 공통으로 사용되는 우측 돋보기 아이콘 일체형 검색창 규격"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <SearchField
                      style={{ minWidth: 360, maxWidth: 520, flex: '0 1 480px' }}
                      value={gridSearch}
                      onValueChange={(val) => setGridSearch(val)}
                      onSearch={(val) => {
                        setGridSearch(val);
                        showToast({ message: `조회: ${val || '전체 목록'}` });
                      }}
                      placeholder="취소번호 / 주문번호 / 고객명 / 상품명 / 취소사유"
                      aria-label="검색 필드"
                    />
                  </div>
                  <span style={{ fontSize: '0.71875rem', color: 'var(--common-text-muted)' }}>
                    * 입력 후 Enter 키를 누르거나 우측 돋보기 아이콘을 클릭하여 조회할 수 있으며, 입력 시 아래 데이터 그리드가 실시간 필터링됩니다.
                  </span>
                </div>
              </Demo>
              <Demo name="DataGrid" col note="검색어를 입력하면 아래 표가 실시간으로 좁혀집니다">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#3f3f46' }}>총 {gridRows.length}건</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ExcelDownloadButton data-grid-download />
                    <PageSizeSelect defaultValue="20개씩 보기" />
                  </div>
                </div>
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

    </div>
  );
}
