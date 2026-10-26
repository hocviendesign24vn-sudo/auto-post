import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, THEME } from "../brand";
import type { Job, JobList } from "../types";
import { BrandBackground, ease, Icon, TopBar, useSpring } from "../ui";

const Row: React.FC<{ job: Job; i: number; color: string }> = ({ job, i, color }) => {
  const frame = useCurrentFrame();
  const delay = 20 + i * 7;
  const s = useSpring(delay, 15, 170);
  // Vệt sáng lướt qua từng dòng sau khi tất cả đã vào.
  const shine = ease(frame, 80 + i * 5, 105 + i * 5, [-30, 130]);
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 30,
        background: "#fff",
        borderRadius: 28,
        padding: "20px 32px",
        boxShadow: "0 16px 40px rgba(3,10,60,.25)",
        opacity: s,
        translate: `${(1 - s) * 700}px 0px`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${shine - 15}%, rgba(255,127,20,.16) ${shine}%, transparent ${shine + 15}%)` }} />
      <div style={{ flex: "none", width: 84, height: 84, borderRadius: "50%", background: color, color: "#fff", fontSize: 44, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 20px ${color}66` }}>
        {i + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 46, fontWeight: 800, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.15 }}>{job.pos}</div>
        <div style={{ fontSize: 32, color: C.muted, fontWeight: 500, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.co}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,127,20,.12)", color: C.orange, fontWeight: 800, fontSize: 32, padding: "8px 18px", borderRadius: 999 }}>
            <Icon name="coin" size={32} color={C.orange} />
            {job.sal}
          </div>
          {job.dl && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#EEF4FF", color: C.navy, fontWeight: 700, fontSize: 30, padding: "8px 18px", borderRadius: 999 }}>
              <Icon name="clock" size={30} color={C.navy} />
              Hạn {job.dl}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ListScene: React.FC<{ list: JobList }> = ({ list }) => {
  const frame = useCurrentFrame();
  const th = THEME[list.theme] ?? THEME.blue;
  const wipe = ease(frame, 4, 24, [100, 0]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <BrandBackground />
      <TopBar />
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 60,
          right: 60,
          borderRadius: 32,
          padding: "28px 44px",
          background: `linear-gradient(100deg, ${th.from}, ${th.to})`,
          color: "#fff",
          boxShadow: `0 20px 50px ${th.from}66`,
          clipPath: `inset(0 ${wipe}% 0 0 round 32px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 700, opacity: 0.95 }}>
          <Icon name="pin" size={34} color="#fff" />
          BẢNG TIN TUYỂN DỤNG
        </div>
        <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginTop: 6 }}>{list.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <div style={{ fontSize: 36, fontWeight: 600 }}>{list.sub}</div>
          <div style={{ background: "#fff", color: th.num, fontWeight: 900, fontSize: 32, padding: "8px 22px", borderRadius: 999 }}>{list.jobs.length} vị trí</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 520, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 18 }}>
        {list.jobs.slice(0, 6).map((j, i) => (
          <Row key={i} job={j} i={i} color={th.num} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
