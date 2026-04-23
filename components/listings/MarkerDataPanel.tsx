"use client";

import { useMapStore } from "@/stores/mapStore";
import type { MarkerData, FactoryTransaction, LandTransaction, FactoryRegister } from "@/types";

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

function FactoryRegisterCard({ m }: { m: FactoryRegister }) {
  const meta = LAYER_META.factory_register;
  return (
    <div className="listing-card">
      <div className="lc-top">
        <span className="lc-type" style={{ background: meta.color + "22", color: meta.color, borderColor: meta.color + "44" }}>{meta.label}</span>
        <span className="lc-date" style={{ fontFamily: "var(--ff-mono)" }}>{m.factry_scale_div_nm || "-"}</span>
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

function FactoryTxCard({ m }: { m: FactoryTransaction }) {
  const meta = LAYER_META.factory_tx;
  const ar = parseFloat(String(m.prvtuse_ar));
  const amt = parseInt(String(m.delng_amt).replace(/[^0-9]/g, ""), 10);
  const perM2 = ar && amt ? `${Math.round(amt / ar).toLocaleString()}만/㎡` : null;
  return (
    <div className="listing-card">
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

function LandTxCard({ m }: { m: LandTransaction }) {
  const meta = LAYER_META.land_tx;
  const ar = parseFloat(String(m.land_delng_ar).replace(/[^0-9.]/g, ""));
  const amt = parseInt(String(m.delng_amt).replace(/[^0-9]/g, ""), 10);
  const perM2 = ar && amt ? `${Math.round(amt / ar).toLocaleString()}만/㎡` : null;
  return (
    <div className="listing-card">
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

function MarkerCard({ marker }: { marker: MarkerData }) {
  if (marker.layer === "factory_register") return <FactoryRegisterCard m={marker} />;
  if (marker.layer === "factory_tx") return <FactoryTxCard m={marker} />;
  if (marker.layer === "land_tx") return <LandTxCard m={marker} />;
  return null;
}

export default function MarkerDataPanel() {
  const { markers, loading, layers } = useMapStore();

  const activeLayer = layers.factory_tx
    ? "factory_tx"
    : layers.land_tx
    ? "land_tx"
    : "factory_register";

  const visible = markers.filter((m) => m.layer === activeLayer);
  const meta = LAYER_META[activeLayer];

  return (
    <div className="left-panel">
      <div className="left-panel-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, display: "inline-block", boxShadow: `0 0 6px ${meta.color}` }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
          </div>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            {loading ? "로딩 중..." : `${visible.length.toLocaleString()}건`}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          우측 레이어 버튼으로 데이터 전환
        </div>
      </div>

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
            우측의 레이어 버튼을 눌러<br />데이터를 불러오세요.
          </div>
        )}
        {!loading && visible.slice(0, 200).map((m, i) => (
          <MarkerCard key={i} marker={m} />
        ))}
        {!loading && visible.length > 200 && (
          <div style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
            상위 200건 표시 중 · 지도를 확대하여 범위 축소
          </div>
        )}
      </div>
    </div>
  );
}
