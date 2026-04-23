"use client";

import { useMapStore } from "@/stores/mapStore";
import type { MapType } from "@/types";

const BASE_TYPES: { key: MapType; label: string }[] = [
  { key: "ROADMAP", label: "일반" },
  { key: "SKYVIEW", label: "위성" },
  { key: "TERRAIN", label: "지형" },
  { key: "HYBRID", label: "위성+레이블" },
];

export default function MapTypeBar() {
  const { mapType, setMapType, useDistrict, toggleDistrict } = useMapStore();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "4px 6px",
        background: "var(--surface-1)",
        border: "1px solid var(--surface-border)",
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {BASE_TYPES.map(({ key, label }) => {
        const active = mapType === key;
        return (
          <button
            key={key}
            onClick={() => setMapType(key)}
            style={{
              padding: "5px 11px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: active ? 700 : 400,
              background: active ? "rgba(201,169,110,0.15)" : "transparent",
              color: active ? "var(--accent-primary)" : "var(--text-secondary)",
              border: `1px solid ${active ? "rgba(201,169,110,0.4)" : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        );
      })}
      <div
        style={{
          width: 1,
          height: 18,
          background: "var(--surface-border)",
          margin: "0 3px",
          flexShrink: 0,
        }}
      />
      <button
        onClick={toggleDistrict}
        style={{
          padding: "5px 11px",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: useDistrict ? 700 : 400,
          background: useDistrict ? "rgba(96,165,250,0.15)" : "transparent",
          color: useDistrict ? "#60A5FA" : "var(--text-secondary)",
          border: `1px solid ${useDistrict ? "rgba(96,165,250,0.4)" : "transparent"}`,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        지적도
      </button>
    </div>
  );
}
