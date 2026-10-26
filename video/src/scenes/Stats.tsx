import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData } from "../types";
import { BrandBackground, ease, Icon, Reveal, TopBar, useSpring } from "../ui";

const COLORS = [C.blue1, C.orange, C.blue2];

// Đếm số từ 0 lên giá trị thật; giá trị không phải số (vd. 31/12) thì hiện nguyên.
const countUp = (value: string, p: number) => (/^\d+$/.test(value) ? String(Math.round(Number(value) * p)) : value);

const StatCard: React.FC<{ i: number; value: string; label: string; icon: string }> = ({ i, value, label, icon }) => {
  const frame = useCurrentFrame();
  const delay = 14 + i * 9;
  const s = useSpring(delay, 12, 150);
  const count = ease(frame, delay, delay + 30, [0, 1]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 40,
        background: "#fff",
        borderRadius: 36,
        padding: "44px 50px",
        boxShadow: "0 24px 60px rgba(3,10,60,.35)",
        translate: `${(1 - s) * (i % 2 ? 900 : -900)}px 0px`,
        rotate: `${(1 - s) * (i % 2 ? 6 : -6)}deg`,
      }}
    >
      <div style={{ width: 140, height: 140, borderRadius: "50%", background: `${COLORS[i]}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={76} color={COLORS[i]} />
      </div>
      <div style={{ fontSize: 150, fontWeight: 900, color: C.ink, letterSpacing: -4, lineHeight: 1, minWidth: 220 }}>{countUp(value, count)}</div>
      <div style={{ fontSize: 44, fontWeight: 700, color: C.muted, whiteSpace: "pre-line", lineHeight: 1.2 }}>{label}</div>
    </div>
  );
};

export const Stats: React.FC<{ data: BangTinData }> = ({ data }) => (
  <AbsoluteFill style={{ fontFamily: FONT }}>
    <BrandBackground />
    <TopBar />
    <div style={{ position: "absolute", top: 330, left: 70, right: 70, color: "#fff" }}>
      <Reveal delay={2} style={{ fontSize: 56, fontWeight: 700, opacity: 0.9 }}>Hôm nay có</Reveal>
      <Reveal delay={6} style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>
        <span style={{ color: C.orange }}>{data.stats[0]?.value}</span> cơ hội mới
      </Reveal>
    </div>
    <div style={{ position: "absolute", top: 680, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 56 }}>
      {data.stats.map((s, i) => (
        <React.Fragment key={i}>
          <StatCard i={i} {...s} />
          <Sequence from={14 + i * 9} durationInFrames={10} layout="none">
            <Audio src={staticFile("pop.wav")} volume={0.35} />
          </Sequence>
        </React.Fragment>
      ))}
    </div>
    <div style={{ position: "absolute", bottom: 190, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Hint />
    </div>
  </AbsoluteFill>
);

const Hint: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#fff", fontSize: 38, fontWeight: 700, opacity: ease(frame, 50, 62, [0, 1]), translate: `${Math.sin(frame / 4) * 10}px 0px` }}>
      Xem chi tiết từng khu vực
      <span style={{ color: C.orange, fontSize: 48 }}>→</span>
    </div>
  );
};
