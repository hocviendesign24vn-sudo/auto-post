import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData } from "../types";
import { allJobs, industryCounts } from "../derive";
import { BrandBackground, ease, TopBar } from "../ui";
import { Glass, Ico, Title } from "./kit";

const R = 190;
const CIRC = 2 * Math.PI * R;

// Biểu đồ vòng theo ngành nghề, các cung lần lượt quét ra.
export const IndustryScene: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const items = industryCounts(data);
  const total = allJobs(data).length;
  let acc = 0;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Ngành nghề" title="Đang tuyển nhiều nhất" />
      <div style={{ position: "absolute", top: 500, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 2 * R + 80, height: 2 * R + 80 }}>
          <svg width={2 * R + 80} height={2 * R + 80} style={{ rotate: "-90deg" }}>
            <circle cx={R + 40} cy={R + 40} r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={70} />
            {items.map((it, i) => {
              const frac = it.count / total;
              const start = acc;
              acc += frac;
              const p = ease(frame, 10 + i * 6, 40 + i * 6, [0, 1]);
              return (
                <circle
                  key={it.ind.key}
                  cx={R + 40}
                  cy={R + 40}
                  r={R}
                  fill="none"
                  stroke={it.ind.color}
                  strokeWidth={70}
                  strokeDasharray={`${Math.max(0, frac * CIRC * p - 6)} ${CIRC}`}
                  strokeDashoffset={-start * CIRC}
                />
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 130, fontWeight: 900, lineHeight: 1 }}>{Math.round(total * ease(frame, 10, 45, [0, 1]))}</div>
            <div style={{ fontSize: 34, fontWeight: 700, opacity: 0.85 }}>vị trí</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1010, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((it, i) => (
          <Glass
            key={it.ind.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "16px 24px",
              opacity: ease(frame, 30 + i * 6, 42 + i * 6, [0, 1]),
              translate: `${ease(frame, 30 + i * 6, 48 + i * 6, [80, 0])}px 0px`,
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 18, background: it.ind.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico name={it.ind.icon} size={38} />
            </div>
            <div style={{ flex: 1, fontSize: 36, fontWeight: 700 }}>{it.ind.label}</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: i === 0 ? C.orange : "#fff" }}>{it.count}</div>
          </Glass>
        ))}
      </div>
    </AbsoluteFill>
  );
};
