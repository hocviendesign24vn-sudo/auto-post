import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, CONTACT, FONT } from "../brand";
import type { BangTinData } from "../types";
import { BrandBackground, ease, Icon, Logo, Reveal, useSpring } from "../ui";

const ITEMS = [
  { icon: "phone", label: "Hotline", value: CONTACT.hotline },
  { icon: "chat", label: "Zalo", value: CONTACT.zalo },
  { icon: "globe", label: "Website", value: CONTACT.website },
  { icon: "mail", label: "Email", value: CONTACT.email },
];

export const Outro: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const logo = useSpring(0, 10, 150);
  const pulse = 1 + Math.sin(frame / 5) * 0.03 * (frame > 40 ? 1 : 0);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <div style={{ position: "absolute", top: 130, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}>
        <Logo width={260} pad={24} />
      </div>
      <div style={{ position: "absolute", top: 470, left: 60, right: 60, textAlign: "center" }}>
        <Reveal delay={8} style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>Ứng tuyển</Reveal>
        <Reveal delay={13} style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, color: C.orange }}>thế nào?</Reveal>
      </div>
      <div style={{ position: "absolute", top: 790, left: 80, right: 80, display: "flex", justifyContent: "center", opacity: ease(frame, 22, 34, [0, 1]) }}>
        <div style={{ scale: String(pulse), background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})`, borderRadius: 999, padding: "30px 44px", fontSize: 40, fontWeight: 800, textAlign: "center", boxShadow: `0 0 ${30 + Math.sin(frame / 5) * 14}px rgba(255,127,20,.7)`, display: "flex", alignItems: "center", gap: 18 }}>
          <Icon name="send" size={42} color="#fff" />
          {data.cta}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1010, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 20 }}>
        {ITEMS.map((it, i) => (
          <div
            key={it.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              background: "rgba(255,255,255,.12)",
              border: "2px solid rgba(255,255,255,.22)",
              borderRadius: 26,
              padding: "22px 30px",
              opacity: ease(frame, 34 + i * 6, 46 + i * 6, [0, 1]),
              translate: `${ease(frame, 34 + i * 6, 52 + i * 6, [-120, 0])}px 0px`,
            }}
          >
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon name={it.icon} size={42} color={C.blue1} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 28, opacity: 0.8, fontWeight: 600 }}>{it.label}</div>
              <div style={{ fontSize: it.value.length > 24 ? 36 : 42, fontWeight: 800, whiteSpace: "nowrap" }}>{it.value}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 150, left: 70, right: 70, display: "flex", alignItems: "center", gap: 20, background: "#fff", color: C.ink, borderRadius: 26, padding: "24px 30px", opacity: ease(frame, 64, 78, [0, 1]), translate: `0px ${ease(frame, 64, 82, [60, 0])}px` }}>
        <Icon name="shield" size={60} color={C.orange} />
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.25 }}>
          Nhà tuyển dụng thật <span style={{ color: C.orange }}>không bao giờ thu phí</span> ứng viên
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", fontSize: 30, fontWeight: 600, opacity: ease(frame, 76, 90, [0, 0.85]) }}>
        {CONTACT.home} • Việc làm mới cập nhật liên tục
      </div>
    </AbsoluteFill>
  );
};
