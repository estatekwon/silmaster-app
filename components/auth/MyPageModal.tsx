"use client";

import { signOut } from "next-auth/react";

interface Props {
  name: string;
  email: string;
  image?: string | null;
  onClose: () => void;
}

export default function MyPageModal({ name, email, image, onClose }: Props) {
  const initial = name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal fade-in"
        style={{ width: 440, maxHeight: "80vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="modal-head">
          <div className="modal-title">마이페이지</div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 프로필 섹션 */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: "var(--surface-3)", borderRadius: 14, border: "1px solid var(--surface-border)" }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--accent-primary)" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-muted)", border: "2px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "var(--accent-primary)", flexShrink: 0 }}>
                {initial}
              </div>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{email}</div>
            </div>
          </div>

          {/* 구독 플랜 */}
          <Section title="구독 플랜">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "var(--surface-3)", borderRadius: 12, border: "1px solid var(--surface-border)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6B7280" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Free 플랜</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>AI 질문 하루 5회 · 매물/고객/일정 관리 제한</div>
              </div>
              <button
                className="btn-sm btn-gold"
                style={{ fontSize: 12, whiteSpace: "nowrap" }}
              >
                Pro 업그레이드
              </button>
            </div>
            <ProCard />
          </Section>

          {/* AI 사용량 */}
          <Section title="오늘 AI 사용량">
            <div style={{ padding: "14px 16px", background: "var(--surface-3)", borderRadius: 12, border: "1px solid var(--surface-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>무료 질문</span>
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 12, color: "var(--text-muted)" }}>5회 / 5회</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--surface-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "0%", background: "var(--accent-primary)", borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>매일 00:00 KST 초기화됩니다.</p>
            </div>
          </Section>

          {/* 계정 정보 */}
          <Section title="계정 정보">
            <InfoRow label="이름" value={name} />
            <InfoRow label="이메일" value={email} />
            <InfoRow label="가입일" value={new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} />
          </Section>

          {/* 로그아웃 */}
          <button
            onClick={() => signOut()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "12px 16px",
              background: "none", border: "1px solid #374151",
              borderRadius: 10, cursor: "pointer",
              fontSize: 13, color: "#F87171",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-3)", borderRadius: 10, border: "1px solid var(--surface-border)" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

function ProCard() {
  return (
    <div style={{ padding: "16px", background: "linear-gradient(135deg, rgba(201,169,110,0.12), rgba(224,194,133,0.06))", borderRadius: 12, border: "1px solid rgba(201,169,110,0.25)", marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-primary)" }}>Pro 플랜 혜택</span>
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 0, listStyle: "none", margin: 0 }}>
        {[
          "AI 질문 무제한",
          "매물 · 고객 · 일정 관리 전체 기능",
          "시세 리포트 PDF 다운로드",
          "알림 구독 (시세 변동 알림)",
        ].map((item) => (
          <li key={item} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)", flexShrink: 0 }} />
            {item}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "var(--accent-primary)" }}>월 9.9만원 / 연 99만원</div>
    </div>
  );
}
