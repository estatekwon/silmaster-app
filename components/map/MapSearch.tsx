"use client";

import { useState, useRef, useEffect } from "react";
import { useMapStore } from "@/stores/mapStore";

interface Result {
  address_name: string;
  x: string;
  y: string;
  place_name?: string;
}

export default function MapSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const { setSearchTarget } = useMapStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(query), 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  function runSearch(q: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakaoMaps = (window as any).kakao?.maps;
    if (!kakaoMaps?.services?.Geocoder) return;
    setSearching(true);
    const ps = new kakaoMaps.services.Places();
    ps.keywordSearch(q, (data: Result[], status: string) => {
      setSearching(false);
      if (status === kakaoMaps.services.Status.OK) {
        setResults(data.slice(0, 6));
        setOpen(true);
      } else {
        // fallback: geocoder
        const gc = new kakaoMaps.services.Geocoder();
        gc.addressSearch(q, (addrData: Result[], addrStatus: string) => {
          if (addrStatus === kakaoMaps.services.Status.OK) {
            setResults(addrData.slice(0, 6));
            setOpen(true);
          } else {
            setResults([]);
            setOpen(false);
          }
        });
      }
    }, { location: new kakaoMaps.LatLng(37.4138, 127.5183), radius: 80000, size: 6 });
  }

  function select(r: Result) {
    const lat = parseFloat(r.y);
    const lng = parseFloat(r.x);
    setSearchTarget({ lat, lng, name: r.place_name || r.address_name, level: 6 });
    setQuery(r.place_name || r.address_name);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div style={{ position: "relative", width: 300 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface-1)", border: "1px solid var(--surface-border)",
        borderRadius: 10, padding: "8px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); } }}
          placeholder="주소 · 지역명 검색..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 13, color: "var(--text-primary)", fontFamily: "inherit",
          }}
        />
        {searching && (
          <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #C9A96E", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        )}
        {query && !searching && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, lineHeight: 1 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--surface-1)", border: "1px solid var(--surface-border)",
          borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 100,
        }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => select(r)} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              width: "100%", padding: "10px 14px", textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: i < results.length - 1 ? "1px solid var(--surface-border)" : "none",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                  {r.place_name || r.address_name}
                </div>
                {r.place_name && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.address_name}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
