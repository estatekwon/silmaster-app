"use client";

import { useState } from "react";
import MapContainer from "@/components/map/MapContainer";
import MapTypeBar from "@/components/map/MapTypeBar";
import MeasureToolbar from "@/components/map/MeasureToolbar";
import LayerToggle from "@/components/map/LayerToggle";
import FilterPanel from "@/components/sidebar/FilterPanel";
import ChatFAB from "@/components/chat/ChatFAB";
import ListingPanel, { LISTINGS } from "@/components/listings/ListingPanel";
import ListingDetail from "@/components/listings/ListingDetail";
import MarkerDataPanel from "@/components/listings/MarkerDataPanel";
import CustomerMgmt from "@/components/customers/CustomerMgmt";
import ScheduleMgmt from "@/components/schedule/ScheduleMgmt";
import { useMapStore } from "@/stores/mapStore";
import type { Listing } from "@/components/listings/ListingPanel";

type Page = "map" | "listings" | "customers" | "schedule";

const PAGE_META: Record<Page, { title: string; sub: string }> = {
  map:       { title: "지도 · 매물 목록", sub: "경기도 산업용 부동산 인텔리전스" },
  listings:  { title: "매물관리", sub: "계약가능 · 거래완료 매물 관리" },
  customers: { title: "고객관리", sub: "매수 · 임차 고객 관리" },
  schedule:  { title: "일정관리", sub: "일별 · 월별 일정 · 메모 공유" },
};

function MapIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;
}
function ListIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg>;
}
function PeopleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function CalIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function GearIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
}

const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "map",       label: "지도",    icon: <MapIcon /> },
  { id: "listings",  label: "매물관리", icon: <ListIcon /> },
  { id: "customers", label: "고객관리", icon: <PeopleIcon /> },
  { id: "schedule",  label: "일정관리", icon: <CalIcon /> },
];

function StatBadge({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
      <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

export default function HomePage() {
  const [page, setPage] = useState<Page>("map");
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const { markers, loading } = useMapStore();

  const meta = PAGE_META[page];

  const handleListingSelect = (listing: Listing | null) => {
    setSelectedListingId(listing?.id ?? null);
  };

  return (
    <div className="shell">
      {/* ── 사이드바 ── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0F14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/>
          </svg>
        </div>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`sidebar-btn ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}
            title={n.label}
          >
            {n.icon}
          </button>
        ))}
        <div className="sidebar-spacer" />
        <button className="sidebar-btn" title="설정" style={{ color: "var(--text-muted)" }}>
          <GearIcon />
        </button>
      </nav>

      {/* ── 메인 영역 ── */}
      <div className="main-area">
        {/* 상단 바 */}
        <div className="topbar2">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div className="topbar2-title">{meta.title}</div>
              <div className="topbar2-sub">{meta.sub}</div>
            </div>
          </div>
          <div className="topbar2-right">
            <StatBadge dot="#A78BFA" label="등록공장" value="78,552" />
            <StatBadge dot="#60A5FA" label="공장거래" value="79,387" />
            <StatBadge dot="#F59E0B" label="토지거래" value="52,946" />
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #C9A96E", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-muted)" }}>로딩 중...</span>
              </div>
            )}
            {!loading && markers.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-up)" }} />
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--status-up)" }}>{markers.length.toLocaleString()}건</span>
              </div>
            )}
            <button className="btn-sm btn-gold" style={{ fontSize: 12 }}>Pro 시작하기</button>
          </div>
        </div>

        {/* ── 콘텐츠 ── */}
        {(page === "map" || page === "listings") && (
          <div className="content-split">
            {/* 좌측 패널: 지도=실거래 데이터, 매물관리=매물 목록 */}
            {page === "map"
              ? <MarkerDataPanel />
              : <ListingPanel onSelect={handleListingSelect} selected={selectedListingId} />
            }

            {/* 지도 */}
            <div className="map-area">
              <MapContainer />

              {/* 지도 위 컨트롤 */}
              {/* 우측 상단: 레이어 토글 */}
              <div style={{ position: "absolute", right: 12, top: 12, zIndex: 10 }}>
                <LayerToggle />
              </div>

              {/* 우측 중간: 측정 툴바 */}
              <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 10 }}>
                <MeasureToolbar />
              </div>

              {/* 하단 좌측: 필터 */}
              <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 10 }}>
                <FilterPanel />
              </div>

              {/* 하단 중앙: 지도 타입 */}
              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
                <MapTypeBar />
              </div>

              {/* 선택된 매물 미니 카드 */}
              {selectedListingId && (() => {
                const l = LISTINGS.find((x) => x.id === selectedListingId);
                if (!l) return null;
                const COLOR: Record<string, string> = { 공장: "#60A5FA", 창고: "#34D399", 토지: "#F59E0B" };
                const color = COLOR[l.kind];
                return (
                  <div className="fade-in" style={{ position: "absolute", bottom: 64, left: 12, right: 12, background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: 12, padding: 14, boxShadow: "var(--shadow-4)", zIndex: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color }}>{l.type} · {l.kind}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{l.addr}</div>
                      </div>
                      <button onClick={() => setSelectedListingId(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <div style={{ background: "var(--surface-3)", borderRadius: 8, padding: "8px 12px", flex: 1 }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>거래금액</div>
                        <div style={{ fontFamily: "var(--ff-mono)", fontSize: 15, fontWeight: 700, color: "var(--accent-primary)" }}>{l.price}</div>
                      </div>
                      <div style={{ background: "var(--surface-3)", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>면적</div>
                        <div style={{ fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 600 }}>{l.area}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button className="btn-sm btn-gold" onClick={() => setDetailListing(l)}>상세보기</button>
                      <button className="btn-sm">지도에서 보기</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {page === "customers" && <CustomerMgmt />}
        {page === "schedule" && <ScheduleMgmt />}
      </div>

      {/* AI 챗봇 FAB */}
      <ChatFAB />

      {/* 매물 상세 모달 */}
      {detailListing && <ListingDetail listing={detailListing} onClose={() => setDetailListing(null)} />}
    </div>
  );
}
