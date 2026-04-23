"use client";

import { useState } from "react";

interface Customer {
  id: number;
  name: string;
  company: string;
  industry: string;
  phone: string;
  type: string;
  region: string;
  budget: string;
  status: string;
  source: string;
  lastContact: string;
  memo: string;
}

const CUSTOMERS: Customer[] = [
  { id:1, name:"박ㅇㅇ 대표", company:"(주)스마트로직스", industry:"이커머스 (생활용품)", phone:"010-1234-5678", type:"창고 임대", region:"화성 팔탄면", budget:"보증금 1억 / 월 500만원", status:"상담 진행 중", source:"유튜브", lastContact:"2026.04.21", memo:"층고 10m 필수, 트레일러 진입 필요" },
  { id:2, name:"김ㅇㅇ 이사", company:"금성메탈(주)", industry:"제조업 (금속가공)", phone:"010-2345-6789", type:"공장 매매", region:"안산 단원구", budget:"실투자금 15억", status:"현장 투어 완료", source:"네이버 검색", lastContact:"2026.04.20", memo:"150kW 이상 전력 필요, 호이스트 필수" },
  { id:3, name:"이ㅇㅇ 대표", company:"대한식품(주)", industry:"식품 제조", phone:"010-3456-7890", type:"공장 임대", region:"평택 청북읍", budget:"보증금 5,000만 / 월 300만", status:"신규 문의", source:"지인 소개", lastContact:"2026.04.22", memo:"식품위생 허가 가능한 시설 필요" },
  { id:4, name:"최ㅇㅇ 팀장", company:"CJ대한통운", industry:"물류", phone:"010-4567-8901", type:"창고 임대", region:"이천 부발읍", budget:"월 800만원 이내", status:"계약 조율 중", source:"기존 고객", lastContact:"2026.04.19", memo:"12m 층고, 대형 트레일러 회차 공간" },
  { id:5, name:"정ㅇㅇ 대표", company:"(주)테크원", industry:"전자부품 제조", phone:"010-5678-9012", type:"공장 매매", region:"수원 권선구", budget:"실투자금 30억", status:"보류", source:"인스타그램 DM", lastContact:"2026.04.15", memo:"법인 전환 고려 중, 절세 방안 문의" },
  { id:6, name:"한ㅇㅇ 사장", company:"한일운수", industry:"운송업", phone:"010-6789-0123", type:"토지 매입", region:"화성 남양읍", budget:"실투자금 8억", status:"계약 완료", source:"유튜브", lastContact:"2026.04.10", memo:"개발용 토지, 물류센터 신축 예정" },
];

const STATUS_CLASS: Record<string, string> = {
  "신규 문의": "hot", "상담 진행 중": "warm", "현장 투어 완료": "warm",
  "계약 조율 중": "cool", "보류": "cool", "계약 완료": "done",
};

export default function CustomerMgmt() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = CUSTOMERS.filter(
    (c) => !search || c.name.includes(search) || c.company.includes(search) || c.industry.includes(search) || c.region.includes(search)
  );

  const selected = CUSTOMERS.find((c) => c.id === selectedId);

  return (
    <div className="full-panel">
      <div className="panel-toolbar">
        <div className="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input placeholder="고객명, 업체명, 지역 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-sm btn-gold">신규 고객 등록</button>
          <button className="btn-sm">내보내기</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>고객명</th><th>업체명 / 업종</th><th>문의유형</th>
              <th>희망지역</th><th>예산</th><th>진행상태</th><th>최근연락</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => setSelectedId(c.id)} style={{ cursor: "pointer" }}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>
                  <div style={{ fontSize: 12 }}>{c.company}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.industry}</div>
                </td>
                <td>{c.type}</td>
                <td>{c.region}</td>
                <td style={{ fontSize: 11, fontFamily: "var(--ff-mono)" }}>{c.budget}</td>
                <td><span className={`status-dot ${STATUS_CLASS[c.status] ?? ""}`}>{c.status}</span></td>
                <td className="mono" style={{ fontSize: 11 }}>{c.lastContact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelectedId(null)}>
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{selected.company} · {selected.industry}</div>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <div className="modal-section-title">기본 정보</div>
                <div className="modal-grid">
                  <div className="modal-field"><div className="modal-field-label">연락처</div><div className="modal-field-val mono">{selected.phone}</div></div>
                  <div className="modal-field"><div className="modal-field-label">유입경로</div><div className="modal-field-val">{selected.source}</div></div>
                  <div className="modal-field"><div className="modal-field-label">진행상태</div><div className="modal-field-val"><span className={`status-dot ${STATUS_CLASS[selected.status]}`}>{selected.status}</span></div></div>
                  <div className="modal-field"><div className="modal-field-label">최근연락</div><div className="modal-field-val mono">{selected.lastContact}</div></div>
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">수요 조건</div>
                <div className="modal-grid">
                  <div className="modal-field"><div className="modal-field-label">문의유형</div><div className="modal-field-val">{selected.type}</div></div>
                  <div className="modal-field"><div className="modal-field-label">희망지역</div><div className="modal-field-val">{selected.region}</div></div>
                  <div className="modal-field" style={{ gridColumn: "span 2" }}><div className="modal-field-label">가용예산</div><div className="modal-field-val mono">{selected.budget}</div></div>
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">메모</div>
                <div style={{ background: "var(--surface-3)", borderRadius: 8, padding: 10, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{selected.memo}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-sm btn-gold">매물 제안</button>
                <button className="btn-sm">상담 기록 추가</button>
                <button className="btn-sm">전화 걸기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
