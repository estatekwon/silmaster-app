"use client";

import { useMapStore } from "@/stores/mapStore";
import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const SIGUNGU_LIST = [
  "수원시", "성남시", "안양시", "부천시", "광명시", "평택시", "안산시",
  "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시",
  "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시", "김포시",
  "화성시", "광주시", "양주시", "포천시", "여주시", "의정부시", "동두천시",
  "연천군", "가평군", "양평군",
];

const INDUSTRY_TYPES = [
  { value: "식품", label: "🍱 식품·음료" },
  { value: "섬유", label: "🧵 섬유·의류" },
  { value: "목재", label: "🪵 목재·가구" },
  { value: "화학", label: "⚗️ 화학·고무·플라스틱" },
  { value: "금속", label: "⚙️ 금속·기계" },
  { value: "전기", label: "💡 전기·전자" },
  { value: "자동차", label: "🚗 자동차·운송장비" },
  { value: "인쇄", label: "🖨️ 인쇄·출판" },
  { value: "기타", label: "🏭 기타" },
];

const YEAR_OPTIONS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(1990 + i));

const inputStyle = {
  background: "var(--surface-3)",
  border: "1px solid var(--surface-border)",
  color: "var(--text-primary)",
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
  width: "100%",
  boxSizing: "border-box" as const,
};

export default function FilterPanel() {
  const { filters, setFilter, resetFilters } = useMapStore();
  const [open, setOpen] = useState(false);

  const hasFilters = Object.values(filters).some(Boolean);
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          background: hasFilters ? "rgba(201,169,110,0.12)" : "var(--surface-1)",
          border: `1px solid ${hasFilters ? "rgba(201,169,110,0.5)" : "var(--surface-border)"}`,
          color: hasFilters ? "var(--accent-primary)" : "var(--text-secondary)",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          transition: "all 0.15s",
        }}
      >
        <SlidersHorizontal size={13} />
        <span>필터</span>
        {hasFilters && (
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--accent-primary)",
              color: "#0D0F14",
              fontSize: 9,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            background: "var(--surface-1)",
            border: "1px solid var(--surface-border)",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
            width: 260,
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              상세 필터
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  style={{ fontSize: 10, color: "#F87171", cursor: "pointer", fontWeight: 600 }}
                >
                  초기화
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* 지역 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 5, fontWeight: 600 }}>
              시군구
            </label>
            <select
              value={filters.sigungu}
              onChange={(e) => setFilter("sigungu", e.target.value)}
              style={inputStyle}
            >
              <option value="">전체 경기도</option>
              {SIGUNGU_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 업종 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 5, fontWeight: 600 }}>
              업종 <span style={{ color: "var(--text-muted)", fontSize: 9, fontWeight: 400 }}>(등록공장)</span>
            </label>
            <select
              value={filters.industryType}
              onChange={(e) => setFilter("industryType", e.target.value)}
              style={inputStyle}
            >
              <option value="">전체 업종</option>
              {INDUSTRY_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* 등록/계약 연도 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 5, fontWeight: 600 }}>
              연도
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select
                value={filters.yearFrom}
                onChange={(e) => setFilter("yearFrom", e.target.value)}
                style={{ ...inputStyle, padding: "6px 6px" }}
              >
                <option value="">시작</option>
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <span style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>~</span>
              <select
                value={filters.yearTo}
                onChange={(e) => setFilter("yearTo", e.target.value)}
                style={{ ...inputStyle, padding: "6px 6px" }}
              >
                <option value="">종료</option>
                {YEAR_OPTIONS.slice().reverse().map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* 면적 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 5, fontWeight: 600 }}>
              면적 (㎡)
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="number"
                placeholder="최소"
                value={filters.areaMin}
                onChange={(e) => setFilter("areaMin", e.target.value)}
                style={{ ...inputStyle, width: "50%" }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>~</span>
              <input
                type="number"
                placeholder="최대"
                value={filters.areaMax}
                onChange={(e) => setFilter("areaMax", e.target.value)}
                style={{ ...inputStyle, width: "50%" }}
              />
            </div>
          </div>

          {/* 거래가 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 5, fontWeight: 600 }}>
              거래가 (만원)
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="number"
                placeholder="최소"
                value={filters.priceMin}
                onChange={(e) => setFilter("priceMin", e.target.value)}
                style={{ ...inputStyle, width: "50%" }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>~</span>
              <input
                type="number"
                placeholder="최대"
                value={filters.priceMax}
                onChange={(e) => setFilter("priceMax", e.target.value)}
                style={{ ...inputStyle, width: "50%" }}
              />
            </div>
          </div>

          {/* 계약일 */}
          <div>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 5, fontWeight: 600 }}>
              계약일 <span style={{ color: "var(--text-muted)", fontSize: 9, fontWeight: 400 }}>(YYYYMMDD)</span>
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="text"
                placeholder="20230101"
                value={filters.dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
                style={{ ...inputStyle, width: "50%", fontFamily: "monospace" }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>~</span>
              <input
                type="text"
                placeholder="20261231"
                value={filters.dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
                style={{ ...inputStyle, width: "50%", fontFamily: "monospace" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
