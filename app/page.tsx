"use client";

import MapContainer from "@/components/map/MapContainer";
import LayerToggle from "@/components/map/LayerToggle";
import FilterPanel from "@/components/sidebar/FilterPanel";
import ChatFAB from "@/components/chat/ChatFAB";
import { useMapStore } from "@/stores/mapStore";
import { Building2, TrendingUp, MapPin, Database } from "lucide-react";

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

export default function HomePage() {
  const { markers, loading } = useMapStore();

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "var(--map-bg-base)" }}>
      {/* Map fills everything */}
      <div className="absolute inset-0">
        <MapContainer />
      </div>

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10"
        style={{
          background: "linear-gradient(to bottom, rgba(13,15,20,0.95) 0%, rgba(13,15,20,0) 100%)",
          pointerEvents: "none",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5" style={{ pointerEvents: "auto" }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C9A96E, #E0C285)" }}
          >
            <Building2 size={16} color="#0D0F14" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              실거래마스터
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>경기도 산업용 부동산 인텔리전스</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
          <StatBadge label="등록공장" value="78,552" color="#A78BFA" />
          <StatBadge label="공장거래" value="79,387" color="#60A5FA" />
          <StatBadge label="토지거래" value="52,946" color="#F59E0B" />
          {loading && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}>
              <div className="w-3 h-3 border border-accent-gold border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>로딩 중...</span>
            </div>
          )}
          {!loading && markers.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}>
              <Database size={11} style={{ color: "var(--status-up)" }} />
              <span className="text-xs font-mono" style={{ color: "var(--status-up)" }}>{markers.length.toLocaleString()}건 표시</span>
            </div>
          )}
        </div>

        {/* Pro CTA */}
        <div style={{ pointerEvents: "auto" }}>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #C9A96E, #E0C285)",
              color: "#0D0F14",
              boxShadow: "0 4px 16px rgba(201,169,110,0.3)",
            }}
          >
            <TrendingUp size={13} />
            Pro 시작하기
          </button>
        </div>
      </div>

      {/* Left controls: Layer toggle */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        <LayerToggle />
      </div>

      {/* Bottom left: Filter */}
      <div className="absolute bottom-6 left-4 z-10 flex items-center gap-2">
        <FilterPanel />
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--surface-border)",
            color: "var(--text-muted)",
          }}
        >
          <MapPin size={12} />
          경기도 전체
        </div>
      </div>

      {/* Investment score teaser */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 fade-in"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--surface-border)",
          borderRadius: 12,
          padding: "10px 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>투자 매력도 스코어</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>지역 선택 후 확인 가능</div>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black font-mono"
          style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)40" }}
        >
          PRO
        </div>
        <button
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
          style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)60" }}
        >
          업그레이드
        </button>
      </div>

      {/* Chat FAB */}
      <ChatFAB />
    </div>
  );
}
