"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const [loading, setLoading] = useState<"kakao" | "google" | null>(null);

  async function handleSignIn(provider: "kakao" | "google") {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" style={{ width: 360, maxHeight: "unset" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head" style={{ justifyContent: "center", flexDirection: "column", alignItems: "center", padding: "28px 24px 20px", gap: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent-muted)", border: "1px solid rgba(201,169,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/></svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>실거래마스터</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>경기도 산업용 부동산 인텔리전스</div>
        </div>

        <div className="modal-body" style={{ padding: "0 24px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 카카오 */}
          <button
            onClick={() => handleSignIn("kakao")}
            disabled={!!loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "13px 16px", borderRadius: 10,
              background: "#FEE500", border: "none", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 700, color: "#000",
              opacity: loading && loading !== "kakao" ? 0.5 : 1,
              transition: "all 0.15s",
            }}
          >
            {loading === "kakao" ? (
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #00000033", borderTopColor: "#000", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.76 1.62 5.2 4.1 6.72L5 21l4.18-2.18C10.04 19.27 11 19.4 12 19.4c5.52 0 10-3.58 10-8.4S17.52 3 12 3z"/></svg>
            )}
            카카오로 시작하기
          </button>

          {/* 구글 */}
          <button
            onClick={() => handleSignIn("google")}
            disabled={!!loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "13px 16px", borderRadius: 10,
              background: "var(--surface-2)", border: "1px solid var(--surface-border)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
              opacity: loading && loading !== "google" ? 0.5 : 1,
              transition: "all 0.15s",
            }}
          >
            {loading === "google" ? (
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--surface-border)", borderTopColor: "#C9A96E", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )}
            구글로 시작하기
          </button>

          <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginTop: 4 }}>
            로그인 시 <span style={{ color: "var(--accent-primary)" }}>서비스 이용약관</span> 및{" "}
            <span style={{ color: "var(--accent-primary)" }}>개인정보처리방침</span>에 동의합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
