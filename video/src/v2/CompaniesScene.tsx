import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData } from "../types";
import { allJobs, industryOf, regionCounts, shortRegion } from "../derive";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { CoLogo, Ico, Title } from "./kit";

const Tile: React.FC<{ logo?: string; co: string; icon: string; color: string; i: number }> = ({ logo, co, icon, color, i }) => {
  const frame = useCurrentFrame();
  const d = 26 + i * 4;
  const s = useSpring(d, 11, 170);
  return (
    <div style={{ background: "#fff", borderRadius: 26, padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: "0 14px 36px rgba(3,10,60,.28)", scale: String(s), opacity: ease(frame, d, d + 6, [0, 1]) }}>
      <CoLogo src={logo} size={110} icon={icon} color={color} />
      <div style={{ color: C.ink, fontSize: 22, fontWeight: 800, textAlign: "center", lineHeight: 1.15, height: 52, overflow: "hidden" }}>{co}</div>
    </div>
  );
};

// Thay cảnh bản đồ: tường logo các nhà tuyển dụng (lấy từ tin gốc) và số vị trí theo khu vực.
export const CompaniesScene: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const seen = new Set<string>();
  const cos = allJobs(data)
    .sort((a, b) => Number(!!b.logo) - Number(!!a.logo))
    .filter((j) => (seen.has(j.co) ? false : (seen.add(j.co), true)))
    .slice(0, 12);
  const regions = regionCounts(data);
  const west = regions.slice(data.lists.length).reduce((a, r) => a + r.count, 0);
  const chip = (l: { name: string; jobs: unknown[] }) => ({ name: shortRegion(l.name), count: l.jobs.length });
  const ct = data.lists.filter((l) => /cần thơ/i.test(l.name));
  const chips = [...ct.map(chip), ...(west ? [{ name: "Miền Tây", count: west }] : []), ...data.lists.filter((l) => !ct.includes(l)).map(chip)];
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Đang tuyển hôm nay" title="Nhà tuyển dụng" />
      <div style={{ position: "absolute", top: 500, left: 50, right: 50, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22 }}>
        {cos.map((j, i) => {
          const ind = industryOf(j);
          return <Tile key={j.co} logo={j.logo} co={j.co} icon={ind.icon} color={ind.color} i={i} />;
        })}
      </div>
      <div style={{ position: "absolute", top: 400, left: 50, right: 50, display: "flex", justifyContent: "center", gap: 18 }}>
        {chips.map((c, i) => {
          const d = 8 + i * 6;
          return (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, background: C.orange, borderRadius: 999, padding: "12px 26px", fontSize: 32, fontWeight: 900, opacity: ease(frame, d, d + 8, [0, 1]), translate: `0px ${ease(frame, d, d + 14, [40, 0])}px` }}>
              <Ico name="pin" size={34} />
              {c.name}: {c.count}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
