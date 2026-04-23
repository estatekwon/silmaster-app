"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMapStore } from "@/stores/mapStore";
import type { MarkerData, LayerType } from "@/types";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

const LAYER_COLORS: Record<LayerType, string> = {
  factory_register: "#A78BFA",
  factory_tx: "#60A5FA",
  land_tx: "#F59E0B",
};

// ── 측정 유틸 ────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalDist(pts: kakao.maps.LatLng[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    d += haversine(pts[i - 1].getLat(), pts[i - 1].getLng(), pts[i].getLat(), pts[i].getLng());
  }
  return d;
}

function polygonAreaM2(pts: kakao.maps.LatLng[]): number {
  if (pts.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const φ1 = (pts[i].getLat() * Math.PI) / 180;
    const φ2 = (pts[j].getLat() * Math.PI) / 180;
    const Δλ = ((pts[j].getLng() - pts[i].getLng()) * Math.PI) / 180;
    area += Δλ * (2 + Math.sin(φ1) + Math.sin(φ2));
  }
  return Math.abs((area * R * R) / 2);
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(2)}km`;
}

function fmtArea(m2: number) {
  const py = Math.round(m2 / 3.3058);
  if (m2 < 10000) return `${Math.round(m2).toLocaleString()}㎡ · ${py.toLocaleString()}평`;
  return `${(m2 / 10000).toFixed(2)}만㎡ · ${py.toLocaleString()}평`;
}

function measureLabel(text: string) {
  return `<div style="background:rgba(13,15,20,0.92);border:1px solid #C9A96E;border-radius:7px;padding:5px 10px;font-size:12px;font-weight:700;color:#C9A96E;font-family:monospace;white-space:nowrap;pointer-events:none;">${text}</div>`;
}

// ── 팝업 HTML ────────────────────────────────────────────
function buildPopupHtml(marker: MarkerData): string {
  if (marker.layer === "factory_register") {
    return `
      <div style="padding:14px 16px;font-family:-apple-system,sans-serif;min-width:260px;max-width:300px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#A78BFA;flex-shrink:0"></span>
          <span style="font-size:11px;color:#A78BFA;font-weight:600;letter-spacing:0.05em">등록공장</span>
        </div>
        <div style="font-size:14px;font-weight:700;color:#F0F2F5;margin-bottom:4px;line-height:1.3">${marker.compny_grp_nm || "이름 없음"}</div>
        <div style="font-size:11px;color:#8A8F9E;margin-bottom:12px">${marker.administ_inst_nm}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#1E2128;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#8A8F9E;margin-bottom:2px">용지면적</div>
            <div style="font-size:12px;color:#F0F2F5;font-family:monospace">${marker.lot_ar ? parseFloat(marker.lot_ar).toLocaleString() + "㎡" : "-"}</div>
          </div>
          <div style="background:#1E2128;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#8A8F9E;margin-bottom:2px">종업원 수</div>
            <div style="font-size:12px;color:#F0F2F5;font-family:monospace">${marker.emply_cnt || "-"}명</div>
          </div>
        </div>
        <div style="font-size:11px;color:#C9A96E;background:#3D3020;border-radius:4px;padding:5px 8px">${marker.indutype_desc_dtcont || "업종 미상"}</div>
      </div>`;
  }

  if (marker.layer === "factory_tx") {
    const amt = parseInt(String(marker.delng_amt).replace(/[^0-9]/g, ""), 10);
    const amtStr = amt >= 10000
      ? `${Math.floor(amt / 10000)}억 ${amt % 10000 ? (amt % 10000).toLocaleString() + "만" : ""}원`
      : `${amt.toLocaleString()}만원`;
    const ar = parseFloat(String(marker.prvtuse_ar));
    const perM2 = ar ? Math.round(amt / ar).toLocaleString() : "-";
    const pyeong = ar ? Math.round(ar / 3.3058).toLocaleString() : "-";
    const d = marker.contract_day;
    const dateStr = d?.length >= 8 ? `${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6,8)}` : "-";
    return `
      <div style="padding:14px 16px;font-family:-apple-system,sans-serif;min-width:260px;max-width:300px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#60A5FA;flex-shrink:0"></span>
          <span style="font-size:11px;color:#60A5FA;font-weight:600;letter-spacing:0.05em">공장·창고 실거래</span>
        </div>
        <div style="font-size:14px;font-weight:700;color:#F0F2F5;margin-bottom:4px">${marker.signgu_nm}</div>
        <div style="font-size:11px;color:#8A8F9E;margin-bottom:12px">${marker.emd_li_nm}</div>
        <div style="background:#1E2128;border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:#8A8F9E;margin-bottom:4px">거래금액</div>
          <div style="font-size:22px;font-weight:700;color:#C9A96E;font-family:monospace">${amtStr}</div>
          <div style="font-size:11px;color:#8A8F9E;margin-top:2px">평단가 ${perM2}만원/㎡</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#1E2128;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#8A8F9E;margin-bottom:2px">전용면적</div>
            <div style="font-size:12px;color:#F0F2F5;font-family:monospace">${ar.toLocaleString()}㎡ (${pyeong}평)</div>
          </div>
          <div style="background:#1E2128;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#8A8F9E;margin-bottom:2px">계약일</div>
            <div style="font-size:12px;color:#F0F2F5">${dateStr}</div>
          </div>
        </div>
        ${marker.buldng_wk_purpos_nm ? `<div style="margin-top:8px;font-size:11px;color:#60A5FA;background:#1e2a3a;border-radius:4px;padding:5px 8px">${marker.buldng_wk_purpos_nm}</div>` : ""}
      </div>`;
  }

  if (marker.layer === "land_tx") {
    const amt = parseInt(String(marker.delng_amt).replace(/[^0-9]/g, ""), 10);
    const amtStr = amt >= 10000
      ? `${Math.floor(amt / 10000)}억 ${amt % 10000 ? (amt % 10000).toLocaleString() + "만" : ""}원`
      : `${amt.toLocaleString()}만원`;
    const ar = parseFloat(String(marker.land_delng_ar).replace(/[^0-9.]/g, ""));
    const perM2 = ar ? Math.round(amt / ar).toLocaleString() : "-";
    const d = marker.contract_day;
    const dateStr = d?.length >= 8 ? `${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6,8)}` : "-";
    return `
      <div style="padding:14px 16px;font-family:-apple-system,sans-serif;min-width:260px;max-width:300px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F59E0B;flex-shrink:0"></span>
          <span style="font-size:11px;color:#F59E0B;font-weight:600;letter-spacing:0.05em">토지 실거래</span>
        </div>
        <div style="font-size:14px;font-weight:700;color:#F0F2F5;margin-bottom:4px">${marker.signgu_nm}</div>
        <div style="font-size:11px;color:#8A8F9E;margin-bottom:12px">${marker.emd_li_nm}</div>
        <div style="background:#1E2128;border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:#8A8F9E;margin-bottom:4px">거래금액</div>
          <div style="font-size:22px;font-weight:700;color:#C9A96E;font-family:monospace">${amtStr}</div>
          <div style="font-size:11px;color:#8A8F9E;margin-top:2px">평단가 ${perM2}만원/㎡</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#1E2128;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#8A8F9E;margin-bottom:2px">토지면적</div>
            <div style="font-size:12px;color:#F0F2F5;font-family:monospace">${ar ? ar.toLocaleString() + "㎡" : "-"}</div>
          </div>
          <div style="background:#1E2128;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#8A8F9E;margin-bottom:2px">계약일</div>
            <div style="font-size:12px;color:#F0F2F5">${dateStr}</div>
          </div>
        </div>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          ${marker.purpos_region_nm ? `<span style="font-size:10px;color:#F59E0B;background:#2a1f08;border-radius:4px;padding:3px 7px">${marker.purpos_region_nm}</span>` : ""}
          ${marker.landcgr_nm ? `<span style="font-size:10px;color:#8A8F9E;background:#1E2128;border-radius:4px;padding:3px 7px">${marker.landcgr_nm}</span>` : ""}
        </div>
      </div>`;
  }

  return "";
}

function fmtPrice(rawAmt: string | number): string {
  const amt = parseInt(String(rawAmt).replace(/[^0-9]/g, ""), 10);
  if (!amt) return "";
  if (amt >= 100000) return `${Math.floor(amt / 10000)}억`;
  if (amt >= 10000) {
    const eok = Math.floor(amt / 10000);
    const man = Math.round((amt % 10000) / 1000);
    return man > 0 ? `${eok}억${man}천` : `${eok}억`;
  }
  return `${Math.round(amt / 1000)}천만`;
}

function createMarkerContent(marker: MarkerData, color: string): string {
  let priceText = "";
  if (marker.layer === "factory_tx") priceText = fmtPrice(marker.delng_amt);
  else if (marker.layer === "land_tx") priceText = fmtPrice(marker.delng_amt);

  if (priceText) {
    return `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;gap:0;">
      <div style="background:${color};color:#0D0F14;font-size:10px;font-weight:800;padding:2px 7px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-family:'IBM Plex Mono',monospace;letter-spacing:-0.02em;">${priceText}</div>
      <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${color};margin-top:-1px;"></div>
    </div>`;
  }
  // 등록공장: 컬러 링 도트
  return `<div style="cursor:pointer;width:10px;height:10px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 0 2px ${color}66,0 2px 8px rgba(0,0,0,0.5);"></div>`;
}

// ── SDK 로더 ─────────────────────────────────────────────
function isKakaoScriptInjected(): boolean {
  return !!document.querySelector('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
}

function loadKakaoSDK(appKey: string, callback: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    window.kakao.maps.load(() => { if (!cancelled) callback(); });
  };

  if (isKakaoScriptInjected()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).kakao?.maps?.load === "function") {
      run();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
      );
      existing?.addEventListener("load", () => { if (!cancelled) run(); }, { once: true });
    }
    return () => { cancelled = true; };
  }

  const script = document.createElement("script");
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer&autoload=false`;
  script.async = true;
  script.onload = run;
  script.onerror = () => {
    console.error("[실거래마스터] 카카오맵 SDK 로드 실패 — appkey 또는 네트워크를 확인하세요");
  };
  document.head.appendChild(script);
  return () => { cancelled = true; };
}

// ── 컴포넌트 ─────────────────────────────────────────────
export default function MapInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<Map<string, kakao.maps.CustomOverlay[]>>(new Map());
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const loadedLayersRef = useRef<Set<LayerType>>(new Set());

  // 측정 관련 refs
  const measurePointsRef = useRef<kakao.maps.LatLng[]>([]);
  const measurePolyRef = useRef<kakao.maps.Polyline | null>(null);
  const measurePolyFillRef = useRef<kakao.maps.Polygon | null>(null);
  const measureDotOverlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const measureLabelRef = useRef<kakao.maps.CustomOverlay | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const measureClickListenerRef = useRef<any>(null);

  const { layers, filters, mapType, useDistrict, measureMode, selectMarker, setZoom, setMarkers, setLoading } = useMapStore();

  // ── 측정 초기화 ──────────────────────────────────────
  const clearMeasure = useCallback(() => {
    measurePolyRef.current?.setMap(null);
    measurePolyRef.current = null;
    measurePolyFillRef.current?.setMap(null);
    measurePolyFillRef.current = null;
    measureDotOverlaysRef.current.forEach((o) => o.setMap(null));
    measureDotOverlaysRef.current = [];
    measureLabelRef.current?.setMap(null);
    measureLabelRef.current = null;
    measurePointsRef.current = [];
    if (measureClickListenerRef.current && mapRef.current) {
      window.kakao.maps.event.removeListener(mapRef.current, "click", measureClickListenerRef.current);
      measureClickListenerRef.current = null;
    }
    mapRef.current?.setCursor?.("");
  }, []);

  const updateMeasureVisuals = useCallback((pts: kakao.maps.LatLng[], mode: "distance" | "area") => {
    if (!mapRef.current) return;

    // polyline
    if (!measurePolyRef.current) {
      measurePolyRef.current = new window.kakao.maps.Polyline({
        strokeWeight: 3,
        strokeColor: "#C9A96E",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
        map: mapRef.current,
      });
    }
    measurePolyRef.current.setPath(pts);

    // polygon fill (area mode)
    if (mode === "area" && pts.length >= 3) {
      if (!measurePolyFillRef.current) {
        measurePolyFillRef.current = new window.kakao.maps.Polygon({
          strokeWeight: 0,
          fillColor: "#A78BFA",
          fillOpacity: 0.15,
          map: mapRef.current,
        });
      }
      measurePolyFillRef.current.setPath(pts);
    }

    // label at last point
    const last = pts[pts.length - 1];
    const text =
      mode === "distance"
        ? fmtDist(totalDist(pts))
        : pts.length >= 3
        ? fmtArea(polygonAreaM2(pts))
        : "점 3개 이상 찍어주세요";

    if (measureLabelRef.current) {
      measureLabelRef.current.setMap(null);
    }
    measureLabelRef.current = new window.kakao.maps.CustomOverlay({
      position: last,
      content: measureLabel(text),
      map: mapRef.current,
      yAnchor: 2.2,
    });
  }, []);

  // ── 레이어 로드 ──────────────────────────────────────
  const loadLayer = useCallback(
    async (layer: LayerType) => {
      if (loadedLayersRef.current.has(layer) || !mapRef.current) return;
      loadedLayersRef.current.add(layer);
      setLoading(true);

      try {
        const params = new URLSearchParams({ layer });
        if (filters.sigungu) params.set("sigungu", filters.sigungu);
        const res = await fetch(`/api/markers?${params}`);
        const { markers } = await res.json();

        const color = LAYER_COLORS[layer];
        const overlays: kakao.maps.CustomOverlay[] = [];

        markers.forEach((m: MarkerData) => {
          const position = new window.kakao.maps.LatLng(m.lat, m.lng);
          const dotEl = document.createElement("div");
          dotEl.innerHTML = createMarkerContent(m, color);

          const overlay = new window.kakao.maps.CustomOverlay({
            position,
            content: dotEl,
            map: mapRef.current!,
            yAnchor: 0.5,
          });

          dotEl.addEventListener("click", () => {
            infoWindowRef.current?.close();
            const iw = new window.kakao.maps.InfoWindow({
              content: `<div style="background:#111318;border:1px solid #2A2D35;border-radius:12px;overflow:hidden">${buildPopupHtml(m)}</div>`,
              removable: true,
            });
            const tmpMarker = new window.kakao.maps.Marker({ position, map: mapRef.current! });
            iw.open(mapRef.current!, tmpMarker);
            tmpMarker.setMap(null);
            infoWindowRef.current = iw;
            selectMarker(m);
          });

          overlays.push(overlay);
        });

        overlaysRef.current.set(layer, overlays);
        setMarkers(markers);
      } finally {
        setLoading(false);
      }
    },
    [filters.sigungu, selectMarker, setMarkers, setLoading]
  );

  // ── 초기화 ───────────────────────────────────────────
  useEffect(() => {
    if (!KAKAO_KEY || !containerRef.current || mapRef.current) return;

    const cancel = loadKakaoSDK(KAKAO_KEY, () => {
      if (!containerRef.current || mapRef.current) return;

      const center = new window.kakao.maps.LatLng(37.4138, 127.5183);
      const map = new window.kakao.maps.Map(containerRef.current, { center, level: 9 });

      window.kakao.maps.event.addListener(map, "zoom_changed", () => {
        setZoom(map.getLevel());
      });

      mapRef.current = map;
      (Object.keys(layers) as LayerType[]).forEach((l) => {
        if (layers[l]) loadLayer(l);
      });
    });

    return () => {
      cancel();
      clearMeasure();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 지도 타입 ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const typeMap: Record<string, number> = {
      ROADMAP: 1, HYBRID: 3, TERRAIN: 5,
    };
    const id = typeMap[mapType] ?? 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapRef.current as any).setMapTypeId(id);
  }, [mapType]);

  // ── 지적도 오버레이 ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    // kakao.maps.MapTypeId.USE_DISTRICT 상수 사용 (하드코딩 방지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakaoMaps = (window as any).kakao?.maps;
    if (!kakaoMaps) return;
    const typeId = kakaoMaps.MapTypeId?.USE_DISTRICT;
    if (typeId == null) return;
    if (useDistrict) {
      mapRef.current.addOverlayMapTypeId(typeId);
    } else {
      mapRef.current.removeOverlayMapTypeId(typeId);
    }
  }, [useDistrict]);

  // ── 측정 모드 ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    clearMeasure();
    if (measureMode === "none") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      const latlng: kakao.maps.LatLng = e.latLng;
      measurePointsRef.current = [...measurePointsRef.current, latlng];

      // dot at point
      const dot = new window.kakao.maps.CustomOverlay({
        position: latlng,
        content: `<div style="width:8px;height:8px;border-radius:50%;background:#C9A96E;border:1.5px solid #fff;box-shadow:0 0 6px #C9A96E88;"></div>`,
        map: mapRef.current!,
        yAnchor: 0.5,
      });
      measureDotOverlaysRef.current.push(dot);

      updateMeasureVisuals(measurePointsRef.current, measureMode);
    };

    window.kakao.maps.event.addListener(mapRef.current, "click", handler);
    measureClickListenerRef.current = handler;

    return clearMeasure;
  }, [measureMode, clearMeasure, updateMeasureVisuals]);

  // ── 레이어 토글 ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    (Object.keys(layers) as LayerType[]).forEach((layer) => {
      if (layers[layer]) {
        loadLayer(layer);
        overlaysRef.current.get(layer)?.forEach((o) => o.setMap(mapRef.current!));
      } else {
        overlaysRef.current.get(layer)?.forEach((o) => o.setMap(null));
      }
    });
  }, [layers, loadLayer]);

  if (!KAKAO_KEY) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#0D0F14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#C9A96E" }}>카카오맵 API 키가 필요합니다</p>
        <p style={{ fontSize: 12, color: "#8A8F9E" }}>.env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 설정해 주세요.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
    />
  );
}
