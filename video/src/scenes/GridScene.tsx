import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { Cell } from "../types";
import { BrandBackground, ease, Icon, TopBar, useSpring } from "../ui";

const CellCard: React.FC<{ cell: Cell; i: number }> = ({ cell, i }) => {
  const frame = useCurrentFrame();
  const delay = 22 + i * 8;
  const s = useSpring(delay, 11, 150);
  const bounce = Math.max(0, Math.sin(((frame - delay - 10) / 30) * Math.PI * 2)) * (frame > delay + 10 && frame < delay + 40 ? 14 : 0);
  return (
    <div style={{ background: "#fff", borderRadius: 30, padding: "30px 30px 26px", borderTop: `10px solid ${cell.color}`, boxShadow: "0 18px 44px rgba(3,10,60,.28)", scale: String(s), opacity: ease(frame, delay, delay + 8, [0, 1]) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: cell.color, fontSize: 48, fontWeight: 900 }}>
        <div style={{ translate: `0px ${-bounce}px` }}>
          <Icon name="pin" size={48} color={cell.color} />
        </div>
        {cell.province}
      </div>
      {cell.jobs.slice(0, 2).map((j, k) => (
        <div key={k} style={{ marginTop: 18 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>{j.pos}</div>
          <div style={{ fontSize: 28, color: C.muted, marginTop: 2 }}>{j.co}</div>
          <div style={{ fontSize: 32, color: C.orange, fontWeight: 800, marginTop: 4 }}>{j.sal}</div>
        </div>
      ))}
    </div>
  );
};

export const GridScene: React.FC<{ grid: { name: string; sub: string; cells: Cell[] }; notes: string[] }> = ({ grid, notes }) => {
  const frame = useCurrentFrame();
  const wipe = ease(frame, 4, 24, [100, 0]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BrandBackground />
      <TopBar />
      <div style={{ position: "absolute", top: 200, left: 60, right: 60, borderRadius: 32, padding: "34px 44px", background: "linear-gradient(100deg, #1F7A34, #4CAF50)", color: "#fff", boxShadow: "0 20px 50px rgba(31,122,52,.45)", clipPath: `inset(0 ${wipe}% 0 0 round 32px)` }}>
        <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.95 }}>MIỀN TÂY</div>
        <div style={{ fontSize: 74, fontWeight: 900, letterSpacing: -2, lineHeight: 1.08, marginTop: 6 }}>{grid.name}</div>
        <div style={{ fontSize: 36, fontWeight: 600, marginTop: 10 }}>{grid.sub}</div>
      </div>
      <div style={{ position: "absolute", top: 600, left: 60, right: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        {grid.cells.slice(0, 4).map((c, i) => (
          <CellCard key={i} cell={c} i={i} />
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 150, left: 60, right: 60, background: "rgba(255,255,255,.12)", border: "2px solid rgba(255,255,255,.22)", borderRadius: 28, padding: "26px 34px", color: "#fff", opacity: ease(frame, 60, 75, [0, 1]), translate: `0px ${ease(frame, 60, 80, [50, 0])}px` }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.orange, marginBottom: 8 }}>Ghi chú</div>
        {notes.map((n, i) => (
          <div key={i} style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.45 }}>• {n}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
