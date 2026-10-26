import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { Cell } from "../types";
import { industryOf, placeOf } from "../derive";
import south from "../map/south.json";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { Ico, Title } from "./kit";

const MAP_W = 960;
const MAP_H = 450;
const ZOOM = 1.1;
const FOCUS: [number, number] = [470, 500]; // tâm vùng ĐBSCL trên bản đồ gốc (toạ độ south.json)

const CellCard: React.FC<{ cell: Cell; i: number }> = ({ cell, i }) => {
  const frame = useCurrentFrame();
  const d = 40 + i * 8;
  const s = useSpring(d, 12, 160);
  const j = cell.jobs[0];
  const ind = industryOf(j);
  return (
    <div style={{ background: "#fff", color: C.ink, borderRadius: 26, padding: "20px 22px", borderTop: `8px solid ${cell.color}`, boxShadow: "0 16px 40px rgba(3,10,60,.3)", scale: String(s), opacity: ease(frame, d, d + 6, [0, 1]) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: cell.color, fontSize: 36, fontWeight: 900 }}>
        <Ico name="pin" size={36} color={cell.color} />
        {cell.province}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: ind.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Ico name={ind.icon} size={28} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>{j.pos}</div>
      </div>
      <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>{j.co}</div>
      <div style={{ fontSize: 30, color: C.orange, fontWeight: 900, marginTop: 4 }}>{j.sal}</div>
      {cell.jobs.length > 1 && <div style={{ fontSize: 24, color: C.navy, fontWeight: 700, marginTop: 6 }}>+{cell.jobs.length - 1} vị trí khác</div>}
    </div>
  );
};

// Miền Tây: bản đồ phóng vào vùng ĐBSCL, ghim từng tỉnh, thẻ việc bật lên bên dưới.
export const WestScene: React.FC<{ grid: { name: string; sub: string; cells: Cell[] } }> = ({ grid }) => {
  const frame = useCurrentFrame();
  const z = ease(frame, 0, 45, [0.8, ZOOM]);
  const k = MAP_W / south.w;
  const tx = MAP_W / 2 - FOCUS[0] * k * z;
  const ty = MAP_H / 2 - FOCUS[1] * k * z;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Miền Tây" title={grid.name} color="#2E8B3E" />
      <div style={{ position: "absolute", top: 470, left: 60, width: MAP_W, height: MAP_H, borderRadius: 30, overflow: "hidden", background: "rgba(0,0,0,.12)", border: "2px solid rgba(255,255,255,.2)" }}>
        <div style={{ position: "absolute", left: tx, top: ty, width: south.w * k * z, height: south.h * k * z }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${south.w} ${south.h}`}>
            <path d={south.kh} fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.2)" strokeWidth={2 / z} />
            <path d={south.vn} fill="rgba(255,255,255,.2)" stroke="#fff" strokeWidth={3 / z} />
          </svg>
          {grid.cells.map((c, i) => {
            const xy = placeOf(c.province);
            if (!xy) return null;
            const d = 30 + i * 8;
            return (
              <div key={i} style={{ position: "absolute", left: xy[0] * k * z - 34, top: xy[1] * k * z - 68, opacity: ease(frame, d, d + 6, [0, 1]), translate: `0px ${ease(frame, d, d + 14, [-120, 0])}px` }}>
                <Ico name="pin" size={68} color={c.color} stroke={2.8} />
                <div style={{ position: "absolute", top: 66, left: 34, translate: "-50% 0", whiteSpace: "nowrap", background: c.color, color: "#fff", borderRadius: 10, padding: "2px 10px", fontSize: 24, fontWeight: 800 }}>{c.province}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", top: 950, left: 60, right: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {grid.cells.slice(0, 4).map((c, i) => (
          <CellCard key={i} cell={c} i={i} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
