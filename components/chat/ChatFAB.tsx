"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, ChevronRight, Zap } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

// ─── 경량 마크다운 렌더러 ─────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    // 볼드
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // 이탤릭
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // 인라인 코드
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>')
    // 번호 리스트
    .replace(/^\d+\.\s(.+)$/gm, "<li style='margin-left:1rem;list-style-type:decimal'>$1</li>")
    // 글머리 리스트
    .replace(/^[-•]\s(.+)$/gm, "<li style='margin-left:1rem;list-style-type:disc'>$1</li>")
    // 헤더 h3
    .replace(/^###\s(.+)$/gm, "<strong style='font-size:0.9em;display:block;margin-top:6px'>$1</strong>")
    // 헤더 h2
    .replace(/^##\s(.+)$/gm, "<strong style='display:block;margin-top:8px'>$1</strong>")
    // 줄바꿈
    .replace(/\n/g, "<br />");
}

// ─── 사용량 경고 토스트 ──────────────────────────────────────────────────────

function UsageToast({ remaining, onClose }: { remaining: number; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-24 right-6 px-4 py-2.5 rounded-xl text-xs font-medium fade-in"
      style={{
        background: remaining === 1 ? "#7F1D1D" : "#78350F",
        border: `1px solid ${remaining === 1 ? "#F87171" : "#FBBF24"}`,
        color: remaining === 1 ? "#FCA5A5" : "#FDE68A",
        zIndex: 1100,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {remaining === 1
        ? "⚠ 마지막 1회 남았습니다. Pro로 업그레이드하세요."
        : `💡 오늘 ${remaining}회 남았습니다.`}
    </div>
  );
}

// ─── ChatFAB ────────────────────────────────────────────────────────────────

export default function ChatFAB() {
  const {
    messages, isOpen, isStreaming, usageCount, maxFreeUsage, ragCount,
    openChat, closeChat, addMessage, appendToLastAssistant, setStreaming, incrementUsage,
    setRemaining, setRagCount,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [dataLabel, setDataLabel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/data-status")
      .then((r) => r.json())
      .then((d: { label?: string }) => { if (d.label) setDataLabel(d.label); })
      .catch(() => null);
  }, []);

  const remaining = maxFreeUsage - usageCount;
  const exhausted = remaining <= 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // 3회, 4회 사용 시 토스트 표시
  useEffect(() => {
    if (usageCount === 2 || usageCount === 3) {
      setShowToast(true);
    }
  }, [usageCount]);

  const hideToast = useCallback(() => setShowToast(false), []);

  async function handleSend() {
    if (!input.trim() || isStreaming || exhausted) return;

    const userMsg = input.trim();
    setInput("");
    incrementUsage();

    addMessage({ role: "user", content: userMsg, timestamp: Date.now() });
    addMessage({ role: "assistant", content: "", timestamp: Date.now() });
    setStreaming(true);
    setRagCount(0);

    const ERROR_MESSAGES: Record<string, string> = {
      upstream_error: "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
      invalid_input: "질문을 다시 입력해 주세요.",
      rate_limit: "오늘 무료 이용(5회)을 모두 사용했습니다.",
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, messages: messages.slice(-6) }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
        const errorKey = data.error ?? "";
        appendToLastAssistant(data.message ?? ERROR_MESSAGES[errorKey] ?? "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { content?: string; remaining?: number; rag_count?: number };
            if (parsed.remaining != null) setRemaining(parsed.remaining);
            if (parsed.rag_count != null) setRagCount(parsed.rag_count);
            if (parsed.content) appendToLastAssistant(parsed.content);
          } catch {
            // 무시
          }
        }
      }
    } catch {
      appendToLastAssistant("네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      {/* 사용량 경고 토스트 */}
      {showToast && !isOpen && remaining > 0 && (
        <UsageToast remaining={remaining} onClose={hideToast} />
      )}

      {/* FAB 버튼 */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fab-pulse fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #C9A96E, #E0C285)",
            boxShadow: "0 4px 24px rgba(201,169,110,0.4)",
            zIndex: 1000,
          }}
        >
          <MessageCircle size={22} color="#0D0F14" strokeWidth={2.5} />
          {usageCount > 0 && remaining > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: "#F87171", color: "#fff" }}
            >
              {remaining}
            </span>
          )}
        </button>
      )}

      {/* 채팅 드로어 */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 flex flex-col rounded-2xl overflow-hidden fade-in"
          style={{
            width: 360,
            height: 540,
            background: "var(--surface-1)",
            border: "1px solid var(--surface-border)",
            boxShadow: "0 16px 64px rgba(0,0,0,0.8)",
            zIndex: 1000,
          }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--surface-2)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #C9A96E, #E0C285)" }}
              >
                <MessageCircle size={14} color="#0D0F14" />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  실거래마스터 AI
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {dataLabel ? `DB 기준: ${dataLabel}` : "경기도 산업용 부동산 전문"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 사용량 표시 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: maxFreeUsage }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i < usageCount ? "#6B7280" : "var(--accent-primary)" }}
                  />
                ))}
              </div>
              <span
                className="text-xs font-mono"
                style={{ color: remaining <= 1 ? "#F87171" : "var(--text-muted)" }}
              >
                {remaining}/{maxFreeUsage}
              </span>
              <button
                onClick={closeChat}
                style={{ color: "var(--text-muted)" }}
                className="hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 chat-scroll space-y-3">
            {messages.length === 0 && (
              <div className="text-center pt-6">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)30" }}
                >
                  <MessageCircle size={20} style={{ color: "var(--accent-primary)" }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  경기도 산업용 부동산 시세를
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  바로 물어보세요.
                </p>
                {[
                  "수원시 300평 공장 최근 시세",
                  "화성시 물류창고 평단가",
                  "경기도 공장 토지 싼 지역은?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg mb-1.5 text-xs transition-all hover:bg-surface-2"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--surface-border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <ChevronRight size={12} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "var(--accent-muted)", color: "var(--accent-primary)", borderBottomRightRadius: 6 }
                      : { background: "var(--surface-2)", color: "var(--text-primary)", borderBottomLeftRadius: 6 }
                  }
                >
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <span
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      />
                    ) : isStreaming ? (
                      <span className="inline-flex gap-1">
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: "var(--text-muted)", animationDelay: `${j * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ) : null
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* RAG 뱃지 */}
            {!isStreaming && ragCount > 0 && (
              <div className="flex justify-start">
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(201,169,110,0.12)",
                    border: "1px solid rgba(201,169,110,0.3)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem" }}>🔍</span>
                  실거래 {ragCount}건 참고
                </span>
              </div>
            )}

            {/* 소진 카드 */}
            {exhausted && (
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
              >
                <div className="flex justify-center mb-2">
                  <Zap size={20} style={{ color: "var(--accent-primary)" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  무료 이용권을 모두 사용했습니다.
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                  Pro로 업그레이드하면 무제한 이용 가능합니다.
                </p>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #C9A96E, #E0C285)", color: "#0D0F14" }}
                >
                  Pro 시작하기 — 월 9.9만원
                </button>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  내일 00:00 KST에 자동 초기화됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 입력창 */}
          <div
            className="p-3 flex-shrink-0"
            style={{ borderTop: "1px solid var(--surface-border)", background: "var(--surface-2)" }}
          >
            {/* 3회 남았을 때 인라인 경고 */}
            {remaining === 2 && !exhausted && (
              <p className="text-xs mb-2 text-center" style={{ color: "#FBBF24" }}>
                💡 오늘 {remaining}회 남았습니다.
              </p>
            )}
            {remaining === 1 && !exhausted && (
              <p className="text-xs mb-2 text-center" style={{ color: "#F87171" }}>
                ⚠ 마지막 1회입니다. Pro로 업그레이드하면 무제한 이용 가능합니다.
              </p>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={exhausted ? "Pro 업그레이드 후 이용 가능합니다" : "경기도 공장·토지 시세 질문... (Enter 전송)"}
                disabled={exhausted || isStreaming}
                rows={1}
                className="flex-1 resize-none text-sm rounded-xl px-3 py-2.5 outline-none"
                style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || exhausted}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #C9A96E, #E0C285)", alignSelf: "flex-end" }}
              >
                <Send size={16} color="#0D0F14" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
