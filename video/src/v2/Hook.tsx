import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData } from "../types";
import { allJobs, salaryMax } from "../derive";
import { BrandBackground, ease, Logo, useSpring } from "../ui";
import { Ico } from "./kit";

// Mở đầu: con số lớn đếm lên, lương cao nhất bật ra kèm đồng xu bay toả.
export const Hook: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const total = allJobs(data).length;
  const top = Math.max(...allJobs(data).map((j) => salaryMax(j.sal) ?? 0));
  const logo = useSpring(0, 12, 160);
  const num = ease(frame, 10, 40, [0, 1]);
  const punch = useSpring(40, 8, 220);
  const pill = useSpring(52, 10, 170);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}>
        <Logo width={200} pad={20} />
      </div>
      <div style={{ position: "absolute", top: 345, left: 0, right: 0, textAlign: "center", fontSize: 32, fontWeight: 700, opacity: ease(frame, 8, 20, [0, 0.85]) }}>
        Bảng tin tuyển dụng • {data.date}
      </div>
      <div style={{ position: "absolute", top: 430, left: 0, right: 0, textAlign: "center", fontSize: 56, fontWeight: 700, opacity: ease(frame, 4, 16, [0, 1]), translate: `0px ${ease(frame, 4, 20, [40, 0])}px` }}>
        Bạn đang tìm việc?
      </div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 430, fontWeight: 900, letterSpacing: -20, lineHeight: 1, color: "#fff", textShadow: "0 30px 80px rgba(0,0,0,.35)", scale: String(0.85 + 0.15 * punch) }}>
          {Math.round(total * num)}
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2, marginTop: -10, opacity: ease(frame, 30, 42, [0, 1]) }}>
          VIỆC LÀM <span style={{ color: C.orange }}>MỚI</span>
        </div>
      </div>
      {/* Đồng xu bay toả quanh nhãn lương */}
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const p = ease(frame, 54, 84, [0, 1]);
        return (
          <div key={i} style={{ position: "absolute", left: 540 - 36 + Math.cos(a) * 380 * p, top: 1260 + Math.sin(a) * 260 * p, opacity: (1 - p) * 1.4, rotate: `${p * 360}deg` }}>
            <Ico name="money" size={72} color="#FFC94A" />
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 1200, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(pill) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})`, borderRadius: 999, padding: "28px 50px", fontSize: 58, fontWeight: 900, boxShadow: "0 20px 60px rgba(255,127,20,.55)" }}>
          <Ico name="money" size={66} />
          Lương đến {top} triệu
        </div>
      </div>
      <div style={{ position: "absolute", top: 1420, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {data.regionsLine.map((r, i) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.14)", border: "2px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "12px 26px", fontSize: 34, fontWeight: 700, opacity: ease(frame, 66 + i * 5, 78 + i * 5, [0, 1]) }}>
            <Ico name="pin" size={34} color={C.orange} />
            {r}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
