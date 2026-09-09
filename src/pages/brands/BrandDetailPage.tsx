import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommonButton,
  CommonInput,
  CommonSelect,
} from "../../components/common";
import shared from "../ops/opsShared.module.css";
import {
  BRANDS,
  EXPOSURE_META,
  STATUS_META,
  computeIssues,
} from "./brandsData";
import styles from "./BrandPages.module.css";

export function BrandDetailPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [brandId, setBrandId] = useState(BRANDS[0]?.id ?? "");
  const matchingBrands = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return BRANDS;
    return BRANDS.filter((brand) =>
      `${brand.name} ${brand.code} ${brand.id}`.toLowerCase().includes(query),
    );
  }, [keyword]);
  const brand =
    matchingBrands.find((item) => item.id === brandId) ??
    matchingBrands[0] ??
    null;

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>브랜드 상세</h1>
            <p className={shared.subtitle}>
              브랜드별 기본 정보, 연결 상품과 변경 이력을 확인합니다.
            </p>
          </div>
          <CommonButton
            variant="primary"
            size="md"
            onClick={() => navigate("/brands")}
          >
            브랜드 목록
          </CommonButton>
        </div>
        <div className={shared.filterBox}>
          <div className={shared.filterRow1}>
            <CommonInput.Search
              aria-label="브랜드 상세 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="브랜드명 / 브랜드 코드 / 브랜드 ID 검색"
              className={shared.searchInput}
            />
            <CommonSelect
              aria-label="브랜드 선택"
              value={brand?.id ?? ""}
              options={matchingBrands.map((item) => ({
                label: `${item.name} · ${item.code}`,
                value: item.id,
              }))}
              onChange={(value) => setBrandId(String(value))}
              placeholder="브랜드 선택"
            />
          </div>
        </div>
      </div>
      <div className={styles.pageBody}>
        {brand ? (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2>{brand.name}</h2>
                <p>
                  {brand.id} · {brand.code}
                </p>
              </div>
            </div>
            <div className={styles.summaryGrid}>
              <div>
                <span>사용 상태</span>
                <strong style={{ color: STATUS_META[brand.status].fg }}>
                  {brand.status}
                </strong>
              </div>
              <div>
                <span>노출 상태</span>
                <strong
                  style={{
                    color: EXPOSURE_META[brand.exposure ? "노출" : "비노출"].fg,
                  }}
                >
                  {brand.exposure ? "노출" : "비노출"}
                </strong>
              </div>
              <div>
                <span>연결 상품</span>
                <strong>{brand.productCodes.length}개</strong>
              </div>
              <div>
                <span>확인 필요</span>
                <strong>{computeIssues(brand, BRANDS).length}건</strong>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span>담당자</span>
                <strong>{brand.owner}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>노출 순서</span>
                <strong>{brand.exposureOrder}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>등록일</span>
                <strong>{brand.createdAt}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>최종 수정</span>
                <strong>
                  {brand.updatedAt} · {brand.updatedBy}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>브랜드 설명</span>
                <strong>
                  {brand.description || "등록된 설명이 없습니다."}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>연결 상품 코드</span>
                <strong>
                  {brand.productCodes.join(", ") || "연결 상품 없음"}
                </strong>
              </div>
            </div>
            <div className={styles.cardHeader}>
              <div>
                <h2>변경 이력</h2>
                <p>최근 변경 순으로 표시합니다.</p>
              </div>
            </div>
            <div className={styles.historyList}>
              {[...brand.history].reverse().map((entry) => (
                <div className={styles.historyItem} key={entry.id}>
                  <span>{entry.at}</span>
                  <strong>{entry.action}</strong>
                  <span>
                    {entry.before && entry.after
                      ? `${entry.before} → ${entry.after}`
                      : "-"}
                  </span>
                  <span>{entry.by}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.cardHeader}>검색 결과가 없습니다.</div>
        )}
      </div>
    </section>
  );
}
