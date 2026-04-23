"use client";

import MapContainer from "@/components/map/MapContainer";
import LayerToggle from "@/components/map/LayerToggle";
import MapTypeBar from "@/components/map/MapTypeBar";
import MeasureToolbar from "@/components/map/MeasureToolbar";
import FilterPanel from "@/components/sidebar/FilterPanel";
import ChatFAB from "@/components/chat/ChatFAB";
import { useMapStore } from "@/stores/mapStore";
import { Building2, TrendingUp, Database } from "lucide-react";

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 8,
        background: "var(--surface-1)",
        border: "1px solid var(--surface-border)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

export default function HomePage() {
  const { markers, loading } = useMapStore();

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--map-bg-base)" }}>
      {/* 지도 */}
      <div style={{ position: "absolute", inset: 0 }}>
        <MapContainer />
      </div>

      {/* 상단 바 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "linear-gradient(to bottom, rgba(13,15,20,0.96) 0%, rgba(13,15,20,0) 100%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #C9A96E, #E0C285)",
            }}
          >
            <Building2 size={17} color="#0D0F14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              실거래마스터
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>경기도 산업용 부동산 인텔리전스</div>
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
          <StatBadge label="등록공장" value="78,552" color="#A78BFA" />
          <StatBadge label="공장거래" value="79,387" color="#60A5FA" />
          <StatBadge label="토지거래" value="52,946" color="#F59E0B" />
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 8,
                background: "var(--surface-1)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  border: "2px solid #C9A96E",
                  borderTopColor: "transparent",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>로딩 중...</span>
            </div>
          )}
          {!loading && markers.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 8,
                background: "var(--surface-1)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <Database size={10} style={{ color: "var(--status-up)" }} />
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--status-up)" }}>
                {markers.length.toLocaleString()}건 표시
              </span>
            </div>
          )}
        </div>

        {/* Pro CTA */}
        <div style={{ pointerEvents: "auto" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              background: "linear-gradient(135deg, #C9A96E, #E0C285)",
              color: "#0D0F14",
              boxShadow: "0 4px 16px rgba(201,169,110,0.3)",
              cursor: "pointer",
              border: "none",
              transition: "transform 0.15s",
            }}
          >
            <TrendingUp size={13} />
            Pro 시작하기
          </button>
        </div>
      </div>

      {/* 좌측: 레이어 토글 */}
      <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10 }}>
        <LayerToggle />
      </div>

      {/* 우측: 측정 툴바 */}
      <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10 }}>
        <MeasureToolbar />
      </div>

      {/* 하단 좌측: 필터 */}
      <div style={{ position: "absolute", bottom: 24, left: 16, zIndex: 10 }}>
        <FilterPanel />
      </div>

      {/* 하단 중앙: 지도 타입 바 */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        <MapTypeBar />
      </div>

      {/* AI 챗봇 FAB */}
      <ChatFAB />
    </div>
  );
}
