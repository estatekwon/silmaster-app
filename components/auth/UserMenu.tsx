"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

interface Props {
  name: string;
  email: string;
  image?: string | null;
  onMyPage: () => void;
}

export default function UserMenu({ name, email, image, onMyPage }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = name?.[0]?.toUpperCase() ?? "U";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 36, height: 36, borderRadius: "50%", border: "none",
          padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--accent-muted)",
          outline: open ? "2px solid var(--accent-primary)" : "none",
          outlineOffset: 2,
          transition: "outline 0.15s",
        }}
        title={name}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-primary)" }}>{initial}</span>
        )}
      </button>

      {open && (
        <div
          className="fade-in"
          style={{
            position: "absolute",
            left: 44,
            bottom: 0,
            width: 220,
            background: "var(--surface-2)",
            border: "1px solid var(--surface-border)",
            borderRadius: 14,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            overflow: "hidden",
            zIndex: 2000,
          }}
        >
          {/* 유저 정보 */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--surface-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--accent-primary)" }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-muted)", border: "1.5px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--accent-primary)", flexShrink: 0 }}>
                  {initial}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, padding: "5px 10px", borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--surface-border)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B7280" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--ff-mono)" }}>Free 플랜</span>
            </div>
          </div>

          {/* 메뉴 항목 */}
          <div style={{ padding: "6px 0" }}>
            <MenuItem icon={<UserIcon />} label="마이페이지" onClick={() => { setOpen(false); onMyPage(); }} />
            <MenuItem icon={<ZapIcon />} label="Pro로 업그레이드" onClick={() => setOpen(false)} accent />
            <div style={{ height: 1, background: "var(--surface-border)", margin: "6px 0" }} />
            <MenuItem icon={<LogoutIcon />} label="로그아웃" onClick={() => { setOpen(false); signOut(); }} danger />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, accent, danger }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean; danger?: boolean }) {
  const color = danger ? "#F87171" : accent ? "var(--accent-primary)" : "var(--text-secondary)";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "9px 16px",
        background: "none", border: "none", cursor: "pointer",
        fontSize: 13, color, textAlign: "left",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
    >
      {icon}
      {label}
    </button>
  );
}

function UserIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function ZapIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
