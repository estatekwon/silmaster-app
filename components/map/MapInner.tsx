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

function createDotOverlayContent(color: string, selected = false): string {
  const size = selected ? 18 : 11;
  const glow = selected ? `box-shadow:0 0 0 4px ${color}44,0 0 14px ${color}99;` : `box-shadow:0 1px 4px rgba(0,0,0,0.5);`;
  return `<div style="
    width:${size}px;height:${size}px;
    border-radius:50%;
    background:${color};
    border:${selected ? "2px" : "1.5px"} solid rgba(255,255,255,0.85);
    ${glow}
    cursor:pointer;
    transition:all 0.15s ease;
  "></div>`;
}

export default function MapInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<Map<string, kakao.maps.CustomOverlay[]>>(new Map());
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const loadedLayersRef = useRef<Set<LayerType>>(new Set());

  const { layers, filters, selectMarker, setZoom, setMarkers, setLoading } = useMapStore();

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

          // dot overlay (marker)
          const dotEl = document.createElement("div");
          dotEl.innerHTML = createDotOverlayContent(color);

          const overlay = new window.kakao.maps.CustomOverlay({
            position,
            content: dotEl,
            map: mapRef.current!,
            yAnchor: 0.5,
          });

          // popup infowindow
          dotEl.addEventListener("click", () => {
            infoWindowRef.current?.close();
            const iw = new window.kakao.maps.InfoWindow({
              content: `<div style="background:#111318;border:1px solid #2A2D35;border-radius:12px;overflow:hidden">${buildPopupHtml(m)}</div>`,
              removable: true,
            });
            // CustomOverlay 위에 InfoWindow를 붙이기 위해 임시 마커 사용
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

  // Init Kakao Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!KAKAO_KEY) return;

    const initMap = () => {
      if (!containerRef.current) return;
      const center = new window.kakao.maps.LatLng(37.4138, 127.5183);
      const map = new window.kakao.maps.Map(containerRef.current, {
        center,
        level: 9,
      });
      window.kakao.maps.event.addListener(map, "zoom_changed", () => {
        setZoom(map.getLevel());
      });
      mapRef.current = map;
      (Object.keys(layers) as LayerType[]).forEach((l) => {
        if (layers[l]) loadLayer(l);
      });
    };

    const script = document.createElement("script");
    // autoload=false 제거 → SDK가 스스로 초기화 후 onload 시점에 window.kakao 준비 완료
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer`;
    script.async = true;
    script.onload = initMap;
    script.onerror = () => console.error("[실거래마스터] 카카오맵 SDK 로드 실패");
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle layer visibility
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
