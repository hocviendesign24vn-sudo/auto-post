import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData, Job } from "../types";
import { industryOf } from "../derive";
import { BrandBackground, ease, TopBar } from "../ui";
import { CoLogo, Ico, Title } from "./kit";

const key = (dl: string) => {
  const [d, m] = dl.split("/").map(Number);
  return m * 100 + d;
};

export const soonJobs = (d: BangTinData, n = 4) => {
  const all: (Job & { region: string })[] = [
    ...d.lists.flatMap((l) => l.jobs.map((j) => ({ ...j, region: l.name }))),
    ...(d.grid?.cells ?? []).flatMap((c) => c.jobs.map((j) => ({ ...j, region: c.province }))),
  ];
  return all.filter((j) => j.dl).sort((a, b) => key(a.dl!) - key(b.dl!)).slice(0, n);
};

// Các việc sắp hết hạn nộp: lịch ngày to bên trái, thông tin việc bên phải.
export const DeadlineScene: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const jobs = soonJobs(data);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Đừng bỏ lỡ" title="Sắp hết hạn nộp" color="#E53935" />
      <div style={{ position: "absolute", top: 450, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 24 }}>
        {jobs.map((j, i) => {
          const d = 12 + i * 10;
          const ind = industryOf(j);
          const [day, mon] = j.dl!.split("/");
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, background: "#fff", color: C.ink, borderRadius: 28, padding: 20, boxShadow: "0 16px 40px rgba(0,0,0,.3)", opacity: ease(frame, d, d + 10, [0, 1]), translate: `${ease(frame, d, d + 18, [600, 0])}px 0px` }}>
              <div style={{ width: 130, flex: "none", borderRadius: 20, overflow: "hidden", textAlign: "center", border: "3px solid #E53935" }}>
                <div style={{ background: "#E53935", color: "#fff", fontSize: 24, fontWeight: 800, padding: "4px 0" }}>THÁNG {Number(mon)}</div>
                <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.2, color: "#E53935" }}>{day}</div>
              </div>
              <CoLogo src={j.logo} size={96} icon={ind.icon} color={ind.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1 }}>{j.pos}</div>
                <div style={{ fontSize: 25, color: C.muted, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.co}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 26, fontWeight: 800 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.blue1 }}><Ico name="pin" size={26} color={C.blue1} />{j.region}</span>
                  <span style={{ color: C.orange }}>{j.sal}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
