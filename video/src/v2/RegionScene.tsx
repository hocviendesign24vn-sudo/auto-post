import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, THEME } from "../brand";
import type { JobList } from "../types";
import { industryOf, salaryMax } from "../derive";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { Ico, IconBadge } from "./kit";

// Mỗi khu vực: một việc nổi bật (lương cao nhất) phóng to, sau đó các việc còn lại trượt vào.
export const RegionScene: React.FC<{ list: JobList; dur: number }> = ({ list, dur }) => {
  const frame = useCurrentFrame();
  const th = THEME[list.theme] ?? THEME.blue;
  const sorted = [...list.jobs].sort((a, b) => (salaryMax(b.sal) ?? 0) - (salaryMax(a.sal) ?? 0));
  const star = sorted[0];
  const rest = list.jobs.filter((j) => j !== star).slice(0, 5);
  const ind = industryOf(star);
  const card = useSpring(10, 13, 150);
  const restAt = Math.min(70, Math.max(50, dur * 0.35));
  const wipe = ease(frame, 0, 18, [100, 0]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <div style={{ position: "absolute", top: 200, left: 60, right: 60, display: "flex", alignItems: "center", gap: 22, clipPath: `inset(0 ${wipe}% 0 0)` }}>
        <div style={{ width: 96, height: 96, borderRadius: 28, background: `linear-gradient(135deg, ${th.from}, ${th.to})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 14px 34px ${th.from}66` }}>
          <Ico name="pin" size={56} />
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.85 }}>{list.sub}</div>
          <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{list.name}</div>
        </div>
      </div>

      {/* Việc nổi bật */}
      <div style={{ position: "absolute", top: 380, left: 60, right: 60, background: "#fff", color: C.ink, borderRadius: 36, padding: "36px 40px", boxShadow: "0 30px 70px rgba(3,10,60,.45)", scale: String(0.9 + 0.1 * card), opacity: card, translate: `0px ${(1 - card) * 120}px` }}>
        <div style={{ position: "absolute", top: -22, left: 40, display: "flex", alignItems: "center", gap: 10, background: C.orange, color: "#fff", borderRadius: 999, padding: "8px 22px", fontSize: 28, fontWeight: 800 }}>
          <Ico name="sparkles" size={28} /> VIỆC NỔI BẬT
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 10 }}>
          <IconBadge name={ind.icon} size={150} color={ind.color} delay={20} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.1 }}>{star.pos}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 32, color: C.muted, marginTop: 8 }}>
              <Ico name="building" size={32} color={C.muted} />
              {star.co}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 28 }}>
          <div style={{ flex: 1.3, background: "rgba(255,127,20,.12)", borderRadius: 24, padding: "18px 24px" }}>
            <div style={{ fontSize: 26, color: C.muted, fontWeight: 700 }}>Mức lương</div>
            <div style={{ fontSize: 50, fontWeight: 900, color: C.orange }}>{star.sal}</div>
          </div>
          {star.dl && (
            <div style={{ flex: 1, background: "#EEF4FF", borderRadius: 24, padding: "18px 24px" }}>
              <div style={{ fontSize: 26, color: C.muted, fontWeight: 700 }}>Hạn nộp</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 50, fontWeight: 900, color: C.navy }}>
                <Ico name="calendar" size={44} color={C.navy} />
                {star.dl}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 20, background: `${ind.color}1A`, color: ind.color, borderRadius: 999, padding: "8px 20px", fontSize: 28, fontWeight: 800 }}>
          <Ico name={ind.icon} size={28} color={ind.color} />
          {ind.label}
        </div>
      </div>

      {/* Các việc còn lại */}
      <div style={{ position: "absolute", top: 930, left: 60, right: 60 }}>
        <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 14, opacity: ease(frame, restAt - 6, restAt + 4, [0, 1]) }}>Và {rest.length} vị trí khác</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rest.map((j, i) => {
            const d = restAt + i * 6;
            const ji = industryOf(j);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  background: "rgba(255,255,255,.95)",
                  color: C.ink,
                  borderRadius: 22,
                  padding: "12px 20px",
                  opacity: ease(frame, d, d + 8, [0, 1]),
                  translate: `${ease(frame, d, d + 16, [500, 0])}px 0px`,
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: ji.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico name={ji.icon} size={32} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.pos}</div>
                  <div style={{ fontSize: 24, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.co}</div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: C.orange, whiteSpace: "nowrap" }}>{j.sal}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
