import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData } from "../types";
import { placeOf, regionCounts, shortRegion } from "../derive";
import south from "../map/south.json";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { Ico, Title } from "./kit";

const SIZE = 980; // cạnh khung bản đồ trên video

const Pin: React.FC<{ x: number; y: number; label: string; count: number; i: number; side: number; dy: number }> = ({ x, y, label, count, i, side, dy }) => {
  const frame = useCurrentFrame();
  const delay = 30 + i * 8;
  const drop = useSpring(delay, 10, 180);
  const pulse = ((frame - delay) % 40) / 40;
  const k = SIZE / south.w;
  return (
    <div style={{ position: "absolute", left: x * k, top: y * k }}>
      <div style={{ position: "absolute", left: -40, top: -40, width: 80, height: 80, borderRadius: "50%", border: `4px solid ${C.orange}`, opacity: frame > delay ? 1 - pulse : 0, scale: String(0.3 + pulse) }} />
      <div style={{ position: "absolute", left: -32, top: -64, translate: `0px ${(1 - drop) * -260}px`, opacity: drop }}>
        <Ico name="pin" size={64} color={C.orange} stroke={2.6} />
      </div>
      <div
        style={{
          position: "absolute",
          top: -54 + dy,
          [side > 0 ? "left" : "right"]: 38,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          color: C.ink,
          borderRadius: 18,
          padding: "8px 16px",
          fontSize: 30,
          fontWeight: 800,
          boxShadow: "0 10px 30px rgba(0,0,0,.3)",
          opacity: ease(frame, delay + 8, delay + 16, [0, 1]),
          scale: String(ease(frame, delay + 8, delay + 18, [0.6, 1])),
        }}
      >
        {label}
        <span style={{ background: C.orange, color: "#fff", borderRadius: 999, padding: "2px 14px", fontSize: 28 }}>{count}</span>
      </div>
    </div>
  );
};

// Bản đồ miền Nam: viền vẽ dần, ghim rơi xuống từng khu vực kèm số việc.
export const MapScene: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const pins = regionCounts(data)
    .map((r) => ({ ...r, xy: placeOf(r.name) }))
    .filter((r): r is typeof r & { xy: [number, number] } => r.xy !== null);
  const draw = ease(frame, 0, 40, [1, 0]);
  // Đặt nhãn tránh chồng nhau: thử bên phải, rồi bên trái, rồi đẩy xuống dưới.
  const k = SIZE / south.w;
  const boxes: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const placed = pins.map((p) => {
    const w = shortRegion(p.name).length * 18 + 110;
    const px = p.xy[0] * k;
    const py = p.xy[1] * k;
    const hit = (b: { x0: number; x1: number; y0: number; y1: number }) => boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    for (let dy = 0; dy < 400; dy += 30) {
      for (const side of px > SIZE * 0.6 ? [-1, 1] : [1, -1]) {
        const x0 = side > 0 ? px + 38 : px - 38 - w;
        const b = { x0, x1: x0 + w, y0: py - 54 + dy, y1: py - 54 + dy + 54 };
        if (x0 >= 0 && b.x1 <= SIZE && !hit(b)) {
          boxes.push(b, { x0: px - 30, x1: px + 30, y0: py - 64, y1: py });
          return { ...p, side, dy };
        }
      }
    }
    return { ...p, side: 1, dy: 0 };
  });
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Bản đồ việc làm" title="Việc làm ở đâu hôm nay?" />
      <div style={{ position: "absolute", top: 520, left: (1080 - SIZE) / 2, width: SIZE, height: SIZE, scale: String(ease(frame, 0, 150, [1, 1.06])) }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${south.w} ${south.h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={south.kh} fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.25)" strokeWidth={2} />
          <path d={south.vn} fill={`rgba(255,255,255,${ease(frame, 15, 45, [0, 0.2])})`} stroke="#fff" strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={draw} />
        </svg>
        <div style={{ position: "absolute", left: 40, top: 40, color: "rgba(255,255,255,.45)", fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>CAMPUCHIA</div>
        <div style={{ position: "absolute", right: 30, bottom: 120, color: "rgba(255,255,255,.35)", fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>BIỂN ĐÔNG</div>
        {placed.map((p, i) => (
          <Pin key={p.name} x={p.xy[0]} y={p.xy[1]} label={shortRegion(p.name)} count={p.count} i={i} side={p.side} dy={p.dy} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
