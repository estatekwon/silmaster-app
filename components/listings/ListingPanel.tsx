"use client";

import { useState } from "react";

export interface Listing {
  id: number;
  type: "매매" | "임대";
  kind: "공장" | "창고" | "토지";
  title: string;
  addr: string;
  price: string;
  area: string;
  buildArea: string;
  floor: string;
  power: string;
  hoist: string;
  road: string;
  yard: string;
  structure: string;
  approved: string;
  status: "계약가능" | "거래완료";
  cat: string;
}

export const LISTINGS: Listing[] = [
  { id:1, type:"매매", kind:"공장", title:"화성시 팔탄면 공장", addr:"경기도 화성시 팔탄면 구장리 123-4", price:"23억 4,000만원", area:"991㎡ (300평)", buildArea:"660㎡ (200평)", floor:"층고 8.5m", power:"150kW", hoist:"5톤", road:"8m", yard:"단독 마당", structure:"일반철골구조", approved:"2019.06.15", status:"계약가능", cat:"계획관리" },
  { id:2, type:"임대", kind:"창고", title:"안산시 단원구 물류창고", addr:"경기도 안산시 단원구 원시동 456-7", price:"보증금 5,000만원 / 월 350만원", area:"1,320㎡ (400평)", buildArea:"990㎡ (300평)", floor:"층고 10m", power:"200kW", hoist:"무", road:"11m", yard:"공동 마당", structure:"일반철골구조", approved:"2021.03.20", status:"계약가능", cat:"자연녹지" },
  { id:3, type:"매매", kind:"토지", title:"용인시 처인구 토지", addr:"경기도 용인시 처인구 원삼면 234-5", price:"6억 2,000만원", area:"1,340㎡ (405평)", buildArea:"-", floor:"-", power:"-", hoist:"-", road:"6m", yard:"-", structure:"-", approved:"-", status:"계약가능", cat:"자연녹지" },
  { id:4, type:"매매", kind:"공장", title:"수원시 권선구 공장", addr:"경기도 수원시 권선구 세류동 789-1", price:"49억 8,000만원", area:"2,310㎡ (699평)", buildArea:"1,650㎡ (499평)", floor:"층고 9m", power:"300kW", hoist:"2.8톤", road:"12m", yard:"단독 마당", structure:"일반철골구조", approved:"2017.11.08", status:"거래완료", cat:"계획관리" },
  { id:5, type:"임대", kind:"공장", title:"평택시 청북읍 소형공장", addr:"경기도 평택시 청북읍 현곡리 567-2", price:"보증금 3,000만원 / 월 250만원", area:"660㎡ (200평)", buildArea:"495㎡ (150평)", floor:"층고 6m", power:"75kW", hoist:"무", road:"6m", yard:"공동 마당", structure:"조적구조", approved:"2008.04.10", status:"계약가능", cat:"계획관리" },
  { id:6, type:"매매", kind:"창고", title:"이천시 부발읍 대형창고", addr:"경기도 이천시 부발읍 신하리 891-3", price:"27억 6,000만원", area:"1,190㎡ (360평)", buildArea:"950㎡ (287평)", floor:"층고 12m", power:"250kW", hoist:"5톤", road:"15m", yard:"단독 마당", structure:"일반철골구조", approved:"2022.01.15", status:"거래완료", cat:"계획관리" },
];

const TYPE_COLORS: Record<string, string> = {
  공장: "#60A5FA",
  창고: "#34D399",
  토지: "#F59E0B",
};

interface Props {
  onSelect: (listing: Listing | null) => void;
  selected: number | null;
}

export default function ListingPanel({ onSelect, selected }: Props) {
  const [tab, setTab] = useState<"계약가능" | "거래완료">("계약가능");

  const filtered = LISTINGS.filter((l) => l.status === tab);

  return (
    <div className="left-panel">
      <div className="left-panel-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>매물 목록</span>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            {filtered.length}건
          </span>
        </div>
        <div className="tab-bar" style={{ borderBottom: "none", gap: 0 }}>
          {(["계약가능", "거래완료"] as const).map((t) => (
            <button key={t} className={`tab-item ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t}
              <span className="tab-count">{LISTINGS.filter((l) => l.status === t).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="left-panel-body">
        {filtered.map((l) => {
          const color = TYPE_COLORS[l.kind];
          const isSel = selected === l.id;
          return (
            <div
              key={l.id}
              className={`listing-card ${isSel ? "selected" : ""}`}
              onClick={() => onSelect(isSel ? null : l)}
            >
              <div className="lc-top">
                <span className={`lc-type ${l.type === "매매" ? "sell" : "rent"} ${l.status === "거래완료" ? "done" : ""}`}>
                  {l.type} · {l.kind}
                </span>
                <span className="lc-date">{l.cat}</span>
              </div>
              <div className="lc-title">{l.title}</div>
              <div className="lc-sub">{l.addr}</div>
              <div className="lc-price" style={{ color }}>{l.price}</div>
              <div className="lc-specs">
                <span className="lc-spec">{l.area}</span>
                {l.floor !== "-" && <span className="lc-spec">{l.floor}</span>}
                {l.power !== "-" && <span className="lc-spec">{l.power}</span>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            해당 조건의 매물이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
