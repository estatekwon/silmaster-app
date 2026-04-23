"use client";

import type { Listing } from "./ListingPanel";

interface Props {
  listing: Listing;
  onClose: () => void;
}

export default function ListingDetail({ listing: l, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{l.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{l.addr}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* 가격 히어로 */}
          <div className="modal-hero">
            <div className="modal-hero-label">거래금액</div>
            <div className="modal-hero-val">{l.price}</div>
          </div>

          {/* 기본 정보 */}
          <div className="modal-section">
            <div className="modal-section-title">기본 정보</div>
            <div className="modal-grid">
              <div className="modal-field"><div className="modal-field-label">거래형태</div><div className="modal-field-val">{l.type}</div></div>
              <div className="modal-field"><div className="modal-field-label">매물종류</div><div className="modal-field-val">{l.kind}</div></div>
              <div className="modal-field"><div className="modal-field-label">용도지역</div><div className="modal-field-val">{l.cat}</div></div>
              <div className="modal-field"><div className="modal-field-label">사용승인일</div><div className="modal-field-val mono">{l.approved}</div></div>
              <div className="modal-field"><div className="modal-field-label">대지면적</div><div className="modal-field-val mono">{l.area}</div></div>
              <div className="modal-field"><div className="modal-field-label">건축면적</div><div className="modal-field-val mono">{l.buildArea}</div></div>
            </div>
          </div>

          {/* 산업용 스펙 */}
          {l.kind !== "토지" && (
            <div className="modal-section">
              <div className="modal-section-title">산업용 스펙</div>
              <div className="modal-grid">
                <div className="modal-field"><div className="modal-field-label">층고</div><div className="modal-field-val mono">{l.floor}</div></div>
                <div className="modal-field"><div className="modal-field-label">전력</div><div className="modal-field-val mono">{l.power}</div></div>
                <div className="modal-field"><div className="modal-field-label">호이스트</div><div className="modal-field-val">{l.hoist}</div></div>
                <div className="modal-field"><div className="modal-field-label">진입도로</div><div className="modal-field-val mono">{l.road}</div></div>
                <div className="modal-field"><div className="modal-field-label">마당</div><div className="modal-field-val">{l.yard}</div></div>
                <div className="modal-field"><div className="modal-field-label">주구조</div><div className="modal-field-val">{l.structure}</div></div>
              </div>
            </div>
          )}

          {/* 사진 */}
          <div className="modal-section">
            <div className="modal-section-title">현장 사진</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {["외부 전경", "내부 전경", "진입로"].map((label) => (
                <div key={label} className="img-placeholder" style={{ height: 80 }}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-sm btn-gold">고객 제안</button>
            <button className="btn-sm">지도에서 보기</button>
            <button className="btn-sm">수정</button>
          </div>
        </div>
      </div>
    </div>
  );
}
