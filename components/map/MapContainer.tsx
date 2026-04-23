"use client";

import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#0D0F14" }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-secondary text-sm">지도 로딩 중...</p>
      </div>
    </div>
  ),
});

export default function MapContainer() {
  return <MapInner />;
}
