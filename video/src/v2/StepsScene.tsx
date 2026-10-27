import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { Ico, Title } from "./kit";

const STEPS = [
  { icon: "search", t: "Chọn việc làm phù hợp", s: "Xem kỹ yêu cầu, mức lương, hạn nộp, địa điểm" },
  { icon: "phone", t: "Liên hệ nhà tuyển dụng", s: "Ứng tuyển trực tiếp với công ty" },
  { icon: "globe", t: "Nhanh hơn: timviecso.vn", s: "Hoặc tải app Tìm Việc Số trên CH Play, App Store" },
];

// 3 bước ứng tuyển nối bằng đường kẻ, sau đó con dấu "không thu phí".
export const StepsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stamp = useSpring(70, 9, 200);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Hướng dẫn" title="Ứng tuyển chỉ 3 bước" />
      <div style={{ position: "absolute", top: 520, left: 70, right: 70 }}>
        <div style={{ position: "absolute", left: 58, top: 60, width: 6, height: 560 * ease(frame, 10, 60, [0, 1]), background: `linear-gradient(${C.orange}, ${C.blue2})`, borderRadius: 6 }} />
        {STEPS.map((s, i) => {
          const d = 10 + i * 14;
          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 30, height: 200, opacity: ease(frame, d, d + 10, [0, 1]), translate: `${ease(frame, d, d + 18, [80, 0])}px 0px` }}>
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
      <div style={{ position: "absolute", top: 1190, left: 70, right: 70, display: "flex", alignItems: "center", gap: 28, background: "#fff", color: C.ink, borderRadius: 30, padding: "28px 34px", boxShadow: "0 20px 50px rgba(0,0,0,.3)", opacity: ease(frame, 60, 70, [0, 1]) }}>
        <div style={{ position: "relative", flex: "none" }}>
          <Ico name="alert" size={110} color="#E53935" stroke={2} />
        </div>
        <div>
          <div style={{ fontSize: 44, fontWeight: 900, color: "#E53935" }}>Cảnh giác lừa đảo!</div>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.3 }}>Không nộp phí, không đặt cọc, không chuyển khoản để được nhận việc.</div>
        </div>
        <div style={{ position: "absolute", right: -10, top: -50, rotate: `${-14 + (1 - stamp) * 30}deg`, scale: String(2 - stamp), opacity: stamp, border: "6px solid #E53935", color: "#E53935", borderRadius: 16, padding: "6px 18px", fontSize: 34, fontWeight: 900, background: "rgba(255,255,255,.92)" }}>
          KHÔNG THU PHÍ
        </div>
      </div>
    </AbsoluteFill>
  );
};
