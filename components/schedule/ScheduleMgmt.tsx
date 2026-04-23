"use client";

import { useState } from "react";

const SCHEDULE_DATA = [
  { id:1, date:"2026-04-23", time:"10:00", title:"화성 팔탄면 현장 투어", sub:"박ㅇㅇ 대표 · 300평 공장", color:"var(--marker-factory)", type:"현장" },
  { id:2, date:"2026-04-23", time:"14:00", title:"안산 원시동 매물 사진촬영", sub:"창고 1,320㎡ · 내외부 촬영", color:"var(--marker-warehouse)", type:"촬영" },
  { id:3, date:"2026-04-24", time:"14:00", title:"안산 원시동 창고 실측", sub:"임대 매물 정보 업데이트", color:"var(--marker-warehouse)", type:"실측" },
  { id:4, date:"2026-04-25", time:"11:00", title:"이천 부발읍 계약 조율", sub:"최ㅇㅇ 팀장 · CJ대한통운", color:"var(--accent-primary)", type:"계약" },
  { id:5, date:"2026-04-25", time:"15:00", title:"평택 청북읍 신규매물 사진촬영", sub:"소형공장 660㎡", color:"var(--marker-factory)", type:"촬영" },
  { id:6, date:"2026-04-28", time:"09:00", title:"주간 매물현황 미팅", sub:"중개업소 내 전체 직원", color:"var(--text-muted)", type:"회의" },
  { id:7, date:"2026-04-28", time:"13:00", title:"용인 원삼면 토지 답사", sub:"정ㅇㅇ 대표 동행", color:"var(--marker-land)", type:"현장" },
  { id:8, date:"2026-04-30", time:"10:00", title:"수원 권선구 공장 최종 계약", sub:"한ㅇㅇ 사장 · 매매 49.8억", color:"var(--accent-primary)", type:"계약" },
];

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ScheduleMgmt() {
  const [selectedDate, setSelectedDate] = useState("2026-04-23");
  const today = "2026-04-23";
  const year = 2026, month = 4;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevDays = new Date(year, month - 1, 0).getDate();

  const cells: { day: number; other?: boolean; date?: string }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: `2026-04-${String(d).padStart(2, "0")}` });
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let i = 1; i <= rem; i++) cells.push({ day: i, other: true });

  const dayEvents = SCHEDULE_DATA.filter((s) => s.date === selectedDate);
  const selDay = new Date(selectedDate);
  const dateLabel = `${selDay.getMonth() + 1}월 ${selDay.getDate()}일 (${DAYS[selDay.getDay()]})`;

  return (
    <div className="full-panel" style={{ flexDirection: "row" }}>
      {/* 캘린더 */}
      <div style={{ width: 400, flexShrink: 0, borderRight: "1px solid var(--surface-border)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>2026년 4월</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn-sm" style={{ padding: "4px 8px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button className="btn-sm" style={{ padding: "4px 8px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
        <div style={{ padding: "8px 12px", flex: 1 }}>
          <div className="cal-grid">
            {DAYS.map((d) => <div key={d} className="cal-head">{d}</div>)}
            {cells.map((c, i) => {
              const events = c.date ? SCHEDULE_DATA.filter((s) => s.date === c.date) : [];
              const isToday = c.date === today;
              const isSel = c.date === selectedDate;
              return (
                <div
                  key={i}
                  className={`cal-cell ${c.other ? "other" : ""} ${isToday ? "today" : ""}`}
                  style={{
                    background: isSel && !isToday ? "var(--surface-2)" : undefined,
                    border: isSel ? "1px solid var(--accent-primary)" : "1px solid transparent",
                    borderRadius: 6,
                  }}
                  onClick={() => c.date && setSelectedDate(c.date)}
                >
                  <span className="cal-num">{c.day}</span>
                  <div style={{ display: "flex", gap: 2, marginTop: 2, flexWrap: "wrap", justifyContent: "center" }}>
                    {events.slice(0, 3).map((e, ei) => (
                      <span key={ei} className="cal-event" style={{ background: e.color }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 일별 뷰 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{dateLabel}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{dayEvents.length}건</span>
          </div>
          <button className="btn-sm btn-gold">일정 추가</button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {dayEvents.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>등록된 일정이 없습니다.</div>
          ) : (
            dayEvents.map((ev) => (
              <div key={ev.id} className="sched-item">
                <div className="sched-time">{ev.time}</div>
                <div className="sched-bar" style={{ background: ev.color }} />
                <div className="sched-content">
                  <div className="sched-content-title">{ev.title}</div>
                  <div className="sched-content-sub">{ev.sub}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "var(--surface-3)", color: "var(--text-muted)", alignSelf: "center" }}>
                  {ev.type}
                </span>
              </div>
            ))
          )}
        </div>

        {/* 공유 메모 */}
        <div style={{ borderTop: "1px solid var(--surface-border)", padding: 12, background: "var(--surface-2)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.04em" }}>공유 메모</div>
          <div style={{ background: "var(--surface-3)", borderRadius: 8, padding: 10, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, minHeight: 40 }}>
            박ㅇㅇ 대표 현장 투어 시 주차공간 확인 필요. 오후 사진촬영 시 드론 배터리 충전 확인.
          </div>
        </div>
      </div>
    </div>
  );
}
