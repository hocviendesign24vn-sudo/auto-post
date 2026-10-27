import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { Ico, Title } from "./kit";

const QRS = [
  { src: "qr/chplay.png", icon: "send", k: "QUÉT ĐỂ TẢI ỨNG DỤNG", t: "Tìm Việc Số", s: "trên CH Play" },
  { src: "qr/website.png", icon: "globe", k: "QUÉT ĐỂ TRUY CẬP WEBSITE", t: "timviecso.vn", s: "xem đủ tin, ứng tuyển nhanh" },
];

// 2 mã QR lớn: tải ứng dụng (CH Play) và truy cập website, có vệt quét chạy qua mã.
export const QRScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Quét mã QR" title="Tìm việc nhanh hơn" />
      <div style={{ position: "absolute", top: 450, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 40 }}>
        {QRS.map((q, i) => {
          const sp = useSpring(10 + i * 16, 12, 160); // eslint-disable-line react-hooks/rules-of-hooks
          const scan = ((frame - 20 - i * 16) % 50) / 50;
          return (
            <div key={q.src} style={{ display: "flex", alignItems: "center", gap: 34, background: "#fff", color: C.ink, borderRadius: 34, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,.35)", opacity: sp, translate: `${(1 - sp) * (i ? 300 : -300)}px 0px` }}>
              <div style={{ position: "relative", width: 380, height: 380, flex: "none", overflow: "hidden" }}>
                <Img src={staticFile(q.src)} style={{ width: 380, height: 380, imageRendering: "pixelated" }} />
                {frame > 20 + i * 16 && <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 8, background: C.orange, boxShadow: `0 0 24px ${C.orange}`, opacity: 0.8 }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: i ? C.orange : C.blue1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico name={q.icon} size={44} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: i ? C.orange : C.blue1, marginTop: 16, lineHeight: 1.2 }}>{q.k}</div>
                <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.1, marginTop: 6 }}>{q.t}</div>
                <div style={{ fontSize: 28, color: C.muted, marginTop: 6 }}>{q.s}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1360, left: 0, right: 0, textAlign: "center", fontSize: 34, fontWeight: 800, opacity: ease(frame, 50, 60, [0, 1]) }}>
        Mở camera điện thoại và quét mã
      </div>
    </AbsoluteFill>
  );
};
