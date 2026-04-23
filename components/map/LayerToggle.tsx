"use client";

import { useMapStore } from "@/stores/mapStore";
import type { LayerType } from "@/types";

const LAYERS: { id: LayerType; label: string; color: string; sublabel: string }[] = [
  { id: "factory_register", label: "등록공장", color: "#A78BFA", sublabel: "78,552건" },
  { id: "factory_tx",       label: "공장거래", color: "#60A5FA", sublabel: "79,387건" },
  { id: "land_tx",          label: "토지거래", color: "#F59E0B", sublabel: "52,946건" },
];

export default function LayerToggle() {
  const { layers, toggleLayer } = useMapStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {LAYERS.map(({ id, label, color, sublabel }) => {
        const on = layers[id];
        return (
          <button
            key={id}
            onClick={() => toggleLayer(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: on ? 700 : 400,
              background: on ? color + "18" : "var(--surface-1)",
              border: "1px solid " + (on ? color + "66" : "var(--surface-border)"),
              color: on ? color : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: on ? color : "var(--surface-border)",
              flexShrink: 0,
              boxShadow: on ? ("0 0 6px " + color) : "none",
              transition: "all 0.15s",
            }} />
            <span>{label}</span>
            <span style={{ fontSize: 9, color: on ? color + "bb" : "var(--text-muted)", marginLeft: "auto", fontFamily: "var(--ff-mono)" }}>
              {sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
