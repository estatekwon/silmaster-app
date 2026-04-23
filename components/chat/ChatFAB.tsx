"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronRight } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

export default function ChatFAB() {
  const { messages, isOpen, isStreaming, usageCount, maxFreeUsage,
    openChat, closeChat, addMessage, appendToLastAssistant, setStreaming, incrementUsage } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const remaining = maxFreeUsage - usageCount;
  const exhausted = remaining <= 0;

  async function handleSend() {
    if (!input.trim() || isStreaming || exhausted) return;
    const userMsg = input.trim();
    setInput("");
    incrementUsage();

    addMessage({ role: "user", content: userMsg, timestamp: Date.now() });
    addMessage({ role: "assistant", content: "", timestamp: Date.now() });
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          messages: messages.slice(-6),
        }),
      });

      if (!res.ok || !res.body) {
        appendToLastAssistant("죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
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
            const { content } = JSON.parse(data);
            if (content) appendToLastAssistant(content);
          } catch {}
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
      {/* FAB Button */}
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

      {/* Chat Drawer */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 flex flex-col rounded-2xl overflow-hidden fade-in"
          style={{
            width: 360,
            height: 520,
            background: "var(--surface-1)",
            border: "1px solid var(--surface-border)",
            boxShadow: "0 16px 64px rgba(0,0,0,0.8)",
            zIndex: 1000,
          }}
        >
          {/* Header */}
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
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>실거래마스터 AI</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>경기도 산업용 부동산 전문</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: remaining <= 1 ? "#F87171" : "var(--text-muted)" }}>
                {remaining}/{maxFreeUsage}
              </span>
              <button onClick={closeChat} style={{ color: "var(--text-muted)" }} className="hover:text-text-primary transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 chat-scroll space-y-3">
            {messages.length === 0 && (
              <div className="text-center pt-8">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-primary)30" }}>
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
                  "경기도 토지 싼 지역 어디야?",
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
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "var(--accent-muted)", color: "var(--accent-primary)", borderBottomRightRadius: 6 }
                      : { background: "var(--surface-2)", color: "var(--text-primary)", borderBottomLeftRadius: 6 }
                  }
                >
                  {msg.content || (msg.role === "assistant" && isStreaming ? (
                    <span className="inline-flex gap-1">
                      {[0, 1, 2].map((j) => (
                        <span
                          key={j}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: "var(--text-muted)", animationDelay: `${j * 0.15}s` }}
                        />
                      ))}
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}

            {exhausted && (
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
              >
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
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="p-3 flex-shrink-0"
            style={{ borderTop: "1px solid var(--surface-border)", background: "var(--surface-2)" }}
          >
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
                placeholder={exhausted ? "Pro 업그레이드 후 이용 가능합니다" : "경기도 공장·토지 시세 질문..."}
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
                style={{
                  background: "linear-gradient(135deg, #C9A96E, #E0C285)",
                  alignSelf: "flex-end",
                }}
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
