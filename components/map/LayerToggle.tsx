"use client";

import { useMapStore } from "@/stores/mapStore";
import type { LayerType } from "@/types";
import clsx from "clsx";

const LAYERS: { key: LayerType; label: string; sublabel: string; color: string }[] = [
  { key: "factory_register", label: "등록공장", sublabel: "78,552건", color: "#A78BFA" },
  { key: "factory_tx", label: "공장·창고 거래", sublabel: "79,387건", color: "#60A5FA" },
  { key: "land_tx", label: "토지 거래", sublabel: "52,946건", color: "#F59E0B" },
];

export default function LayerToggle() {
  const { layers, toggleLayer } = useMapStore();

  return (
    <div
      className="flex flex-col gap-1.5 p-3 rounded-xl"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--surface-border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        minWidth: 180,
      }}
    >
      <div className="text-xs font-semibold mb-1 px-1" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
        레이어
      </div>
      {LAYERS.map(({ key, label, sublabel, color }) => (
        <button
          key={key}
          onClick={() => toggleLayer(key)}
          className={clsx(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all",
            layers[key]
              ? "bg-opacity-20"
              : "hover:bg-surface-2 opacity-50"
          )}
          style={
            layers[key]
              ? { background: `${color}18`, border: `1px solid ${color}55` }
              : { border: "1px solid transparent" }
          }
        >
          <span
            className="flex-shrink-0 rounded-full"
            style={{
              width: 8,
              height: 8,
              background: layers[key] ? color : "var(--text-muted)",
              boxShadow: layers[key] ? `0 0 6px ${color}` : "none",
            }}
          />
          <div>
            <div
              className="text-xs font-semibold leading-tight"
              style={{ color: layers[key] ? color : "var(--text-secondary)" }}
            >
              {label}
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
              {sublabel}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
