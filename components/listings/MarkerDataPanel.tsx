"use client";

import { useMapStore } from "@/stores/mapStore";
import type { MarkerData, FactoryTransaction, LandTransaction, FactoryRegister } from "@/types";
import { useMemo, useState } from "react";

function fmtAmt(raw: string | number) {
  const amt = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
  if (!amt) return "-";
  if (amt >= 10000) {
    const e = Math.floor(amt / 10000);
    const m = Math.round((amt % 10000) / 1000);
    return m > 0 ? `${e}억 ${m}천만원` : `${e}억원`;
  }
  return `${amt.toLocaleString()}만원`;
}

function fmtDate(d: string) {
  if (!d || d.length < 8) return d || "-";
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
}

const LAYER_META: Record<string, { label: string; color: string }> = {
  factory_register: { label: "등록공장",  color: "#A78BFA" },
  factory_tx:       { label: "공장거래",  color: "#60A5FA" },
  land_tx:          { label: "토지거래",  color: "#F59E0B" },
};

// ── 시세 요약 ────────────────────────────────────────────
function SummaryCard({ markers, color }: { markers: MarkerData[]; color: string }) {
  const txMarkers = markers.filter(
    (m): m is FactoryTransaction | LandTransaction =>
      m.layer === "factory_tx" || m.layer === "land_tx"
  );
  if (txMarkers.length === 0) return null;

  const amounts = txMarkers
    .map((m) => parseInt(String(m.delng_amt).replace(/[^0-9]/g, ""), 10))
    .filter((a) => a > 0);

  if (amounts.length === 0) return null;
  const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
  const max = Math.max(...amounts);
  const min = Math.min(...amounts);

  return (
    <div style={{ margin: "10px 12px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--surface-border)", padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 10 }}>시세 요약</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "평균가", value: fmtAmt(avg) },
          { label: "최고가", value: fmtAmt(max) },
          { label: "최저가", value: fmtAmt(min) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface-3)", borderRadius: 7, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "var(--ff-mono)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 카드 컴포넌트 ────────────────────────────────────────
function FactoryRegisterCard({ m }: { m: FactoryRegister }) {
  const meta = LAYER_META.factory_register;
  return (
    <div className="listing-card">
      <div className="lc-top">
        <span className="lc-type" style={{ background: meta.color + "22", color: meta.color, borderColor: meta.color + "44" }}>{meta.label}</span>
        <span className="lc-date">{m.factry_scale_div_nm || "-"}</span>
      </div>
      <div className="lc-title">{m.compny_grp_nm || "이름 없음"}</div>
      <div className="lc-sub">{m.administ_inst_nm}</div>
      <div className="lc-price" style={{ color: meta.color, fontSize: 12 }}>{m.indutype_desc_dtcont || "업종 미상"}</div>
      <div className="lc-specs">
        {m.lot_ar && <span className="lc-spec">{parseFloat(m.lot_ar).toLocaleString()}㎡</span>}
        {m.emply_cnt && <span className="lc-spec">직원 {m.emply_cnt}명</span>}
      </div>
    </div>
  );
}

function FactoryTxCard({ m, onClick }: { m: FactoryTransaction; onClick: () => void }) {
  const meta = LAYER_META.factory_tx;
  const ar = parseFloat(String(m.prvtuse_ar));
  const amt = parseInt(String(m.delng_amt).replace(/[^0-9]/g, ""), 10);
  const perM2 = ar && amt ? `${Math.round(amt / ar).toLocaleString()}만/㎡` : null;
  return (
    <div className="listing-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="lc-top">
        <span className="lc-type" style={{ background: meta.color + "22", color: meta.color, borderColor: meta.color + "44" }}>{meta.label}</span>
        <span className="lc-date" style={{ fontFamily: "var(--ff-mono)" }}>{fmtDate(m.contract_day)}</span>
      </div>
      <div className="lc-title">{m.signgu_nm} {m.emd_li_nm}</div>
      <div className="lc-sub">{m.buldng_wk_purpos_nm || "-"}</div>
      <div className="lc-price" style={{ color: meta.color }}>{fmtAmt(m.delng_amt)}</div>
      <div className="lc-specs">
        {ar > 0 && <span className="lc-spec">{ar.toLocaleString()}㎡</span>}
        {perM2 && <span className="lc-spec">{perM2}</span>}
        {m.build_yy && <span className="lc-spec">{m.build_yy}년</span>}
      </div>
    </div>
  );
}

function LandTxCard({ m, onClick }: { m: LandTransaction; onClick: () => void }) {
  const meta = LAYER_META.land_tx;
  const ar = parseFloat(String(m.land_delng_ar).replace(/[^0-9.]/g, ""));
  const amt = parseInt(String(m.delng_amt).replace(/[^0-9]/g, ""), 10);
  const perM2 = ar && amt ? `${Math.round(amt / ar).toLocaleString()}만/㎡` : null;
  return (
    <div className="listing-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="lc-top">
        <span className="lc-type" style={{ background: meta.color + "22", color: meta.color, borderColor: meta.color + "44" }}>{meta.label}</span>
        <span className="lc-date" style={{ fontFamily: "var(--ff-mono)" }}>{fmtDate(m.contract_day)}</span>
      </div>
      <div className="lc-title">{m.signgu_nm} {m.emd_li_nm}</div>
      <div className="lc-sub">{m.purpos_region_nm || "-"} · {m.landcgr_nm || "-"}</div>
      <div className="lc-price" style={{ color: meta.color }}>{fmtAmt(m.delng_amt)}</div>
      <div className="lc-specs">
        {ar > 0 && <span className="lc-spec">{ar.toLocaleString()}㎡</span>}
        {perM2 && <span className="lc-spec">{perM2}</span>}
      </div>
    </div>
  );
}

// ── 실거래 히스토리 모달 ─────────────────────────────────
function HistoryModal({ marker, onClose }: { marker: FactoryTransaction | LandTransaction; onClose: () => void }) {
  const { allMarkers } = useMapStore();
  const isTx = marker.layer === "factory_tx";
  const area = isTx ? (marker as FactoryTransaction).signgu_nm : (marker as LandTransaction).signgu_nm;
  const dong = isTx ? (marker as FactoryTransaction).emd_li_nm : (marker as LandTransaction).emd_li_nm;
  const meta = LAYER_META[marker.layer];

  // 같은 읍면동 거래 이력
  const history = useMemo(() => {
    return allMarkers
      .filter((m): m is FactoryTransaction | LandTransaction =>
        m.layer === marker.layer &&
        (m as FactoryTransaction | LandTransaction).emd_li_nm === dong
      )
      .sort((a, b) => {
        const da = (a as FactoryTransaction).contract_day || "";
        const db = (b as FactoryTransaction).contract_day || "";
        return db.localeCompare(da);
      })
      .slice(0, 20);
  }, [allMarkers, marker.layer, dong]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{area} {dong} 거래 이력</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>동일 읍면동 최근 {history.length}건</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: 480, overflowY: "auto" }}>
          {history.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>동일 동 거래 이력이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {history.map((h, i) => {
                const amt = parseInt(String(h.delng_amt).replace(/[^0-9]/g, ""), 10);
                const date = (h as FactoryTransaction).contract_day || "";
                const ar = isTx
                  ? parseFloat(String((h as FactoryTransaction).prvtuse_ar))
                  : parseFloat(String((h as LandTransaction).land_delng_ar).replace(/[^0-9.]/g, ""));
                const isSelected = h === marker;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0", borderBottom: "1px solid var(--surface-border)",
                    background: isSelected ? meta.color + "11" : "none",
                    borderRadius: isSelected ? 6 : 0,
                    paddingLeft: isSelected ? 8 : 0,
                  }}>
                    {/* 타임라인 도트 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: isSelected ? meta.color : "var(--surface-border)", border: `2px solid ${meta.color}`, flexShrink: 0 }} />
                      {i < history.length - 1 && <div style={{ width: 1, height: 20, background: "var(--surface-border)", marginTop: 2 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(date)}</span>
                        {isSelected && <span style={{ fontSize: 9, color: meta.color, fontWeight: 700 }}>현재 선택</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, fontFamily: "var(--ff-mono)" }}>{fmtAmt(amt)}</span>
                        {ar > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{ar.toLocaleString()}㎡</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 패널 ────────────────────────────────────────────
export default function MarkerDataPanel() {
  const { markers, loading, layers, allMarkers } = useMapStore();
  const [historyMarker, setHistoryMarker] = useState<FactoryTransaction | LandTransaction | null>(null);

  const activeLayer = layers.factory_tx ? "factory_tx" : layers.land_tx ? "land_tx" : "factory_register";
  const visible = markers.filter((m) => m.layer === activeLayer);
  const meta = LAYER_META[activeLayer];

  return (
    <div className="left-panel">
      <div className="left-panel-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, display: "inline-block", boxShadow: `0 0 6px ${meta.color}` }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
          </div>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            {loading ? "로딩 중..." : `${visible.length.toLocaleString()}건`}
          </span>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>좌측 레이어 버튼으로 전환 · 카드 클릭 시 거래 이력</div>
      </div>

      {/* 시세 요약 카드 */}
      {!loading && activeLayer !== "factory_register" && (
        <SummaryCard markers={allMarkers.filter((m) => m.layer === activeLayer)} color={meta.color} />
      )}

      <div className="left-panel-body">
        {loading && (
          <div style={{ padding: "12px 16px" }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{ marginBottom: 8, borderRadius: 10, border: "1px solid var(--surface-border)", padding: 14, background: "var(--surface-1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ width: 60, height: 14, borderRadius: 4, background: "var(--surface-3)", animation: "pulse-gold 1.5s ease-in-out infinite" }} />
                  <div style={{ width: 80, height: 12, borderRadius: 4, background: "var(--surface-3)", animation: "pulse-gold 1.5s ease-in-out infinite" }} />
                </div>
                <div style={{ width: "75%", height: 16, borderRadius: 4, background: "var(--surface-3)", marginBottom: 6, animation: "pulse-gold 1.5s ease-in-out infinite" }} />
                <div style={{ width: "55%", height: 12, borderRadius: 4, background: "var(--surface-3)", marginBottom: 10, animation: "pulse-gold 1.5s ease-in-out infinite" }} />
                <div style={{ width: 90, height: 18, borderRadius: 4, background: "var(--surface-3)", animation: "pulse-gold 1.5s ease-in-out infinite" }} />
              </div>
            ))}
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>경기도 API 연결 중...</div>
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            좌측 레이어 버튼을 눌러<br />데이터를 불러오세요.
          </div>
        )}
        {!loading && visible.slice(0, 200).map((m, i) => {
          if (m.layer === "factory_register") return <FactoryRegisterCard key={i} m={m as FactoryRegister} />;
          if (m.layer === "factory_tx") return (
            <FactoryTxCard key={i} m={m as FactoryTransaction}
              onClick={() => setHistoryMarker(m as FactoryTransaction)} />
          );
          if (m.layer === "land_tx") return (
            <LandTxCard key={i} m={m as LandTransaction}
              onClick={() => setHistoryMarker(m as LandTransaction)} />
          );
          return null;
        })}
        {!loading && visible.length > 200 && (
          <div style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
            상위 200건 표시 · 지도 확대 또는 시군구 필터로 범위 축소
          </div>
        )}
      </div>

      {historyMarker && (
        <HistoryModal marker={historyMarker} onClose={() => setHistoryMarker(null)} />
      )}
    </div>
  );
}
