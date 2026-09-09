import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommonButton,
  CommonInput,
  CommonSelect,
  CommonSwitch,
  CommonTextarea,
  showToast,
} from "../../components/common";
import shared from "../ops/opsShared.module.css";
import { OWNERS } from "./brandsData";
import styles from "./BrandPages.module.css";

export function BrandCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [owner, setOwner] = useState(OWNERS[0]);
  const [description, setDescription] = useState("");
  const [exposure, setExposure] = useState(true);
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim() || !code.trim()) {
      setError("브랜드명과 브랜드 코드를 입력해 주세요.");
      return;
    }
    showToast({ message: "브랜드를 등록했습니다.", type: "success" });
    navigate("/brands");
  };

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>브랜드 등록</h1>
            <p className={shared.subtitle}>
              상품에 연결할 신규 브랜드의 기본 정보와 노출 상태를 등록합니다.
            </p>
          </div>
        </div>
      </div>
      <div className={styles.pageBody}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>기본 정보</h2>
              <p>
                브랜드명과 코드는 등록 후에도 브랜드 상세에서 수정할 수
                있습니다.
              </p>
            </div>
          </div>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className={styles.field}>
              <span>브랜드명 *</span>
              <CommonInput
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="브랜드명을 입력하세요"
              />
            </label>
            <label className={styles.field}>
              <span>브랜드 코드 *</span>
              <CommonInput
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="예: BRAND07"
              />
              <small className={styles.helper}>
                영문 대문자와 숫자를 사용합니다.
              </small>
            </label>
            <label className={styles.field}>
              <span>담당자</span>
              <CommonSelect
                value={owner}
                options={OWNERS.map((value) => ({ label: value, value }))}
                onChange={(value) => setOwner(String(value))}
              />
            </label>
            <label className={styles.field}>
              <span>사용자 화면 노출</span>
              <CommonSwitch
                checked={exposure}
                onChange={setExposure}
                label={exposure ? "노출" : "비노출"}
              />
            </label>
            <label className={styles.wideField}>
              <span>브랜드 설명</span>
              <CommonTextarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="브랜드 소개를 입력하세요"
                maxLength={500}
                showCount
              />
            </label>
            {error && <div className={styles.wideField}>{error}</div>}
            <div className={styles.formActions}>
              <CommonButton
                variant="secondary"
                size="md"
                onClick={() => navigate("/brands")}
              >
                취소
              </CommonButton>
              <CommonButton type="submit" variant="primary" size="md">
                브랜드 등록
              </CommonButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
