"use client";

import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, background: "#0D0F14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ width: 32, height: 32, border: "2px solid #C9A96E", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#8A8F9E" }}>지도 로딩 중...</p>
    </div>
  ),
});

export default function MapContainer() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MapInner />
    </div>
  );
}
