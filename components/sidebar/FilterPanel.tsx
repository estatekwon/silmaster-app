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

export default function FilterPanel() {
  const { filters, setFilter, resetFilters } = useMapStore();
  const [open, setOpen] = useState(false);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
        style={{
          background: hasFilters ? "var(--accent-muted)" : "var(--surface-1)",
          border: `1px solid ${hasFilters ? "var(--accent-primary)" : "var(--surface-border)"}`,
          color: hasFilters ? "var(--accent-primary)" : "var(--text-secondary)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <SlidersHorizontal size={14} />
        <span className="font-medium">필터</span>
        {hasFilters && (
          <span
            className="w-4 h-4 rounded-full text-xs flex items-center justify-center"
            style={{ background: "var(--accent-primary)", color: "#000", fontSize: 10, fontWeight: 700 }}
          >
            {Object.values(filters).filter(Boolean).length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 rounded-xl p-4 fade-in"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--surface-border)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            width: 240,
            zIndex: 1000,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>필터</span>
            <button onClick={() => setOpen(false)} style={{ color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          </div>

          {/* 지역 */}
          <div className="mb-3">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--text-secondary)" }}>시군구</label>
            <select
              value={filters.sigungu}
              onChange={(e) => setFilter("sigungu", e.target.value)}
              className="w-full text-xs rounded-lg px-3 py-2"
              style={{
                background: "var(--surface-3)",
                border: "1px solid var(--surface-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">전체 경기도</option>
              {SIGUNGU_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 가격대 */}
          <div className="mb-3">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--text-secondary)" }}>거래가 (만원)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="최소"
                value={filters.priceMin}
                onChange={(e) => setFilter("priceMin", e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-2 w-0"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-primary)",
                }}
              />
              <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>~</span>
              <input
                type="number"
                placeholder="최대"
                value={filters.priceMax}
                onChange={(e) => setFilter("priceMax", e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-2 w-0"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* 면적 */}
          <div className="mb-3">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--text-secondary)" }}>면적 (㎡)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="최소"
                value={filters.areaMin}
                onChange={(e) => setFilter("areaMin", e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-2 w-0"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-primary)",
                }}
              />
              <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>~</span>
              <input
                type="number"
                placeholder="최대"
                value={filters.areaMax}
                onChange={(e) => setFilter("areaMax", e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-2 w-0"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* 기간 */}
          <div className="mb-4">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--text-secondary)" }}>계약일</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="20230101"
                value={filters.dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-2 w-0 font-mono"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-primary)",
                }}
              />
              <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>~</span>
              <input
                type="text"
                placeholder="20261231"
                value={filters.dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-2 w-0 font-mono"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="w-full text-xs py-2 rounded-lg transition-all"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--surface-border)",
              color: "var(--text-secondary)",
            }}
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}
