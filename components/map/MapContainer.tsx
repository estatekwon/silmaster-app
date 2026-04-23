"use client";

import { useEffect, useState } from "react";
import MapInner from "./MapInner";

export default function MapContainer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#0D0F14",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid #C9A96E",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ fontSize: 13, color: "#8A8F9E" }}>지도 로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <MapInner />
    </div>
  );
}
