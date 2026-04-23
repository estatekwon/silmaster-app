import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  usageCount: number;
  maxFreeUsage: number;
  ragCount: number;

  openChat: () => void;
  closeChat: () => void;
  addMessage: (msg: ChatMessage) => void;
  appendToLastAssistant: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  incrementUsage: () => void;
  setRemaining: (remaining: number) => void;
  setRagCount: (count: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isOpen: false,
  isStreaming: false,
  usageCount: 0,
  maxFreeUsage: 5,
  ragCount: 0,

  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendToLastAssistant: (chunk) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
      }
      return { messages: msgs };
    }),

  setStreaming: (v) => set({ isStreaming: v }),

  incrementUsage: () => set((s) => ({ usageCount: s.usageCount + 1 })),

  setRemaining: (remaining) =>
    set((s) => ({ usageCount: s.maxFreeUsage - remaining })),

  setRagCount: (count) => set({ ragCount: count }),
}));
