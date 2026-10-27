import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import type { BangTinData } from "../types";
import { BrandBackground, ease, Icon, Logo, Reveal, useSpring } from "../ui";

export const Intro: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const logo = useSpring(0, 11, 160);
  const tag = useSpring(30, 10, 170);
  const bar = ease(frame, 22, 46, [0, 1]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <div style={{ position: "absolute", top: 220, left: 80, scale: String(logo), rotate: `${(1 - logo) * -14}deg` }}>
        <Logo width={230} pad={22} />
      </div>
      <div style={{ position: "absolute", top: 250, right: 70, rotate: "-8deg", scale: String(tag), textAlign: "center", fontStyle: "italic", fontWeight: 800, fontSize: 40, lineHeight: 1.25 }}>
        Nhiều cơ hội<br />tốt hơn tương lai<br />của bạn!
        <div style={{ height: 6, background: C.orange, borderRadius: 6, marginTop: 10 }} />
      </div>

      <div style={{ position: "absolute", top: 640, left: 80, right: 60 }}>
        <Reveal delay={2} style={{ fontSize: 132, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>BẢNG TIN</Reveal>
        <Reveal delay={7} style={{ fontSize: 120, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05 }}>TUYỂN DỤNG</Reveal>
        <div style={{ position: "relative", display: "inline-block", marginTop: 12 }}>
          <div style={{ position: "absolute", left: -16, right: -16, top: 20, bottom: 6, background: "rgba(255,127,20,.18)", borderRadius: 18, scale: `${bar} 1`, transformOrigin: "left" }} />
          <Reveal delay={13} style={{ fontSize: 150, fontWeight: 900, letterSpacing: -4, lineHeight: 1.05, color: C.orange, textShadow: "0 10px 40px rgba(255,127,20,.45)" }}>
            TỔNG HỢP
          </Reveal>
        </div>
        <div style={{ height: 10, width: 260 * bar, background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})`, borderRadius: 10, marginTop: 20 }} />
      </div>

      <div style={{ position: "absolute", top: 1270, left: 80, display: "flex", alignItems: "center", gap: 16, fontSize: 46, fontWeight: 700, opacity: ease(frame, 28, 42, [0, 1]), translate: `${ease(frame, 28, 48, [-60, 0])}px 0px` }}>
        <Icon name="calendar" size={48} color={C.orange} />
        Ngày {data.date}
      </div>

      <div style={{ position: "absolute", top: 1400, left: 80, right: 80, display: "flex", flexWrap: "wrap", gap: 18 }}>
        {data.regionsLine.map((r, i) => (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
              color: C.navy,
              fontWeight: 800,
              fontSize: 36,
              padding: "16px 30px",
              borderRadius: 999,
              boxShadow: "0 12px 30px rgba(0,0,0,.2)",
              opacity: ease(frame, 40 + i * 6, 54 + i * 6, [0, 1]),
              scale: String(ease(frame, 40 + i * 6, 58 + i * 6, [0.6, 1])),
            }}
          >
            <Icon name="pin" size={36} color={C.orange} />
            {r}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, textAlign: "center", fontSize: 38, fontWeight: 600, opacity: ease(frame, 60, 75, [0, 0.9]) }}>
        Cập nhật mỗi ngày
      </div>
    </AbsoluteFill>
  );
};
