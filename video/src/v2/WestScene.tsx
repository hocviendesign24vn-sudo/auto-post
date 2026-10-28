import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { Cell } from "../types";
import { industryOf } from "../derive";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { CoLogo, Ico, Title } from "./kit";

const CellCard: React.FC<{ cell: Cell; i: number }> = ({ cell, i }) => {
  const frame = useCurrentFrame();
  const d = 20 + i * 8;
  const s = useSpring(d, 12, 160);
  return (
    <div style={{ background: "#fff", color: C.ink, borderRadius: 26, padding: "24px 24px", borderTop: `10px solid ${cell.color}`, boxShadow: "0 16px 40px rgba(3,10,60,.3)", scale: String(s), opacity: ease(frame, d, d + 6, [0, 1]) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: cell.color, fontSize: 40, fontWeight: 900 }}>
        <Ico name="pin" size={40} color={cell.color} />
        {cell.province}
      </div>
      {cell.jobs.slice(0, 2).map((j, k) => {
        const ind = industryOf(j);
        return (
          <div key={k} style={{ marginTop: 18, paddingTop: k ? 18 : 0, borderTop: k ? "2px solid #E6E9F2" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CoLogo src={j.logo} size={56} icon={ind.icon} color={ind.color} />
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>{j.pos}</div>
            </div>
            <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>{j.co}</div>
            <div style={{ fontSize: 30, color: C.orange, fontWeight: 900, marginTop: 4 }}>{j.sal}</div>
          </div>
        );
      })}
    </div>
  );
};

// Miền Tây: mỗi tỉnh một thẻ, liệt kê việc nổi bật (không dùng bản đồ để tránh sai lệch địa giới).
export const WestScene: React.FC<{ grid: { name: string; sub: string; cells: Cell[] } }> = ({ grid }) => (
  <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
    <BrandBackground />
    <TopBar />
    <Title kicker="Miền Tây" title={grid.name} color="#2E8B3E" />
    <div style={{ position: "absolute", top: 480, left: 60, right: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {grid.cells.slice(0, 4).map((c, i) => (
        <CellCard key={i} cell={c} i={i} />
      ))}
    </div>
  </AbsoluteFill>
);
