import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData } from "../types";
import { industryOf, shortRegion, topSalaries } from "../derive";
import { BrandBackground, ease, TopBar } from "../ui";
import { Ico, Title } from "./kit";

// Bảng xếp hạng lương: thanh ngang mọc dần, số tiền đếm lên.
export const SalaryScene: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const top = topSalaries(data, 5);
  const max = top[0]?.max ?? 1;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Top lương" title="Lương cao nhất hôm nay" />
      <div style={{ position: "absolute", top: 520, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 30 }}>
        {top.map((j, i) => {
          const d = 14 + i * 8;
          const p = ease(frame, d, d + 30, [0, 1]);
          const ind = industryOf(j);
          return (
            <div key={i} style={{ opacity: ease(frame, d, d + 8, [0, 1]) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: i === 0 ? C.orange : "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 38, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.pos}</div>
                  <div style={{ fontSize: 26, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {j.co} • {shortRegion(j.region)}
                  </div>
                </div>
              </div>
              <div style={{ position: "relative", height: 62, borderRadius: 16, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${(j.max / max) * 100 * p}%`,
                    borderRadius: 16,
                    background: i === 0 ? `linear-gradient(90deg, ${C.orange}, ${C.orange2})` : `linear-gradient(90deg, ${ind.color}, ${C.blue2})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 18,
                    gap: 10,
                    fontSize: 32,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Ico name={ind.icon} size={30} />
                  {j.sal.replace(/\d+(?=\s*triệu)/, (m) => String(Math.round(Number(m) * p)))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
