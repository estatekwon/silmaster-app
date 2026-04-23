"use client";

import { useMapStore } from "@/stores/mapStore";
import type { MeasureMode } from "@/types";

function RulerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/>
      <path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/><path d="m4.5 13.5 2 2"/>
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 19.5 7 19.5 17 12 22 4.5 17 4.5 7"/>
    </svg>
  );
}

export default function MeasureToolbar() {
  const { measureMode, setMeasureMode } = useMapStore();

  const toggle = (mode: MeasureMode) => {
    setMeasureMode(measureMode === mode ? "none" : mode);
  };

  const btn = (mode: MeasureMode, icon: React.ReactNode, label: string, activeColor: string) => {
    const active = measureMode === mode;
    return (
      <button
        key={mode}
        onClick={() => toggle(mode)}
        title={label}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          background: active ? `${activeColor}18` : "transparent",
          border: `1px solid ${active ? `${activeColor}55` : "transparent"}`,
          color: active ? activeColor : "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
        }}
        onMouseLeave={(e) => {
          if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        {icon}
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.02em" }}>{label}</span>
      </button>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 5,
        background: "var(--surface-1)",
        border: "1px solid var(--surface-border)",
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {btn("distance", <RulerIcon />, "거리", "#C9A96E")}
      {btn("area", <AreaIcon />, "면적", "#A78BFA")}
      {measureMode !== "none" && (
        <button
          onClick={() => setMeasureMode("none")}
          style={{
            width: 44,
            height: 24,
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 700,
            background: "rgba(239,68,68,0.15)",
            color: "#F87171",
            border: "1px solid rgba(239,68,68,0.3)",
            cursor: "pointer",
          }}
        >
          초기화
        </button>
      )}
    </div>
  );
}
