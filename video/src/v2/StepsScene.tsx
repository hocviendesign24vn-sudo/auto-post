import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { Ico, Title } from "./kit";

const STEPS = [
  { icon: "search", t: "Chọn việc làm phù hợp", s: "Xem kỹ yêu cầu, mức lương, hạn nộp, địa điểm" },
  { icon: "phone", t: "Liên hệ nhà tuyển dụng", s: "Ứng tuyển trực tiếp với công ty" },
  { icon: "globe", t: "Nhanh hơn: timviecso.vn", s: "Hoặc tải app Tìm Việc Số trên CH Play, App Store" },
];

const QRS = [
  { src: "qr/website.png", label: "Website", value: "timviecso.vn" },
  { src: "qr/chplay.png", label: "App trên CH Play", value: "Tìm Việc Số" },
];

// 3 bước ứng tuyển nối bằng đường kẻ, sau đó 2 mã QR (website, app CH Play).
export const StepsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const qr = useSpring(52, 12, 160);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Hướng dẫn" title="Ứng tuyển chỉ 3 bước" />
      <div style={{ position: "absolute", top: 440, left: 70, right: 70 }}>
        <div style={{ position: "absolute", left: 58, top: 60, width: 6, height: 400 * ease(frame, 10, 60, [0, 1]), background: `linear-gradient(${C.orange}, ${C.blue2})`, borderRadius: 6 }} />
        {STEPS.map((s, i) => {
          const d = 10 + i * 14;
          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 30, height: 180, opacity: ease(frame, d, d + 10, [0, 1]), translate: `${ease(frame, d, d + 18, [80, 0])}px 0px` }}>
              <div style={{ width: 122, height: 122, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 34px rgba(0,0,0,.25)", flex: "none" }}>
                <Ico name={s.icon} size={60} color={C.blue1} />
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.orange }}>BƯỚC {i + 1}</div>
                <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1 }}>{s.t}</div>
                <div style={{ fontSize: 30, opacity: 0.85, marginTop: 6 }}>{s.s}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1050, left: 70, right: 70, display: "flex", justifyContent: "center", gap: 50 }}>
        {QRS.map((q, i) => (
          <div key={q.src} style={{ width: 400, background: "#fff", color: C.ink, borderRadius: 30, padding: "26px 26px 20px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,.3)", opacity: qr, scale: String(0.8 + 0.2 * qr), translate: `0px ${(1 - qr) * (60 + i * 30)}px` }}>
            <Img src={staticFile(q.src)} style={{ width: 300, height: 300, imageRendering: "pixelated" }} />
            <div style={{ fontSize: 28, fontWeight: 700, color: C.blue1, marginTop: 10 }}>{q.label}</div>
            <div style={{ fontSize: 38, fontWeight: 900 }}>{q.value}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 1500, left: 0, right: 0, textAlign: "center", fontSize: 34, fontWeight: 800, opacity: ease(frame, 70, 80, [0, 1]) }}>
        Quét mã để tìm việc nhanh hơn
      </div>
    </AbsoluteFill>
  );
};
