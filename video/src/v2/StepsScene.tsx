import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../brand";
import { BrandBackground, ease, TopBar, useSpring } from "../ui";
import { Ico, Title } from "./kit";

const WAYS = [
  { icon: "phone", k: "CÁCH 1", t: "Liên hệ trực tiếp nhà tuyển dụng", s: "Gọi điện, gửi hồ sơ theo thông tin trong tin tuyển dụng" },
  { icon: "globe", k: "CÁCH 2 • NHANH HƠN", t: "timviecso.vn hoặc app Tìm Việc Số", s: "Tải trên CH Play" },
];

// Bước 1 chọn việc, sau đó 2 cách ứng tuyển độc lập (HOẶC), cuối cùng cảnh báo lừa đảo.
export const StepsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pick = useSpring(10, 13, 150);
  const or = useSpring(62, 9, 220);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <TopBar />
      <Title kicker="Hướng dẫn" title="Ứng tuyển thế nào?" />
      <div style={{ position: "absolute", top: 440, left: 70, right: 70, display: "flex", alignItems: "center", gap: 30, background: "rgba(255,255,255,.12)", border: "2px solid rgba(255,255,255,.25)", borderRadius: 32, padding: "26px 30px", opacity: pick, translate: `0px ${(1 - pick) * 80}px` }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Ico name="search" size={60} color={C.blue1} />
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.orange }}>TRƯỚC HẾT</div>
          <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1 }}>Chọn việc làm phù hợp</div>
          <div style={{ fontSize: 30, opacity: 0.85, marginTop: 6 }}>Xem kỹ yêu cầu, mức lương, hạn nộp, địa điểm</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 710, left: 0, right: 0, textAlign: "center", fontSize: 36, fontWeight: 800, opacity: ease(frame, 30, 40, [0, 1]) }}>
        Rồi ứng tuyển theo <span style={{ color: C.orange }}>một trong hai cách</span>
      </div>
      <div style={{ position: "absolute", top: 790, left: 70, right: 70, display: "flex", gap: 96 }}>
        {WAYS.map((w, i) => {
          const d = 36 + i * 14;
          return (
            <div key={i} style={{ flex: 1, background: "#fff", color: C.ink, borderRadius: 30, padding: "30px 26px", boxShadow: "0 20px 50px rgba(0,0,0,.3)", opacity: ease(frame, d, d + 10, [0, 1]), translate: `${ease(frame, d, d + 18, [i ? 200 : -200, 0])}px 0px` }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: i ? C.orange : C.blue1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico name={w.icon} size={50} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: i ? C.orange : C.blue1, marginTop: 18 }}>{w.k}</div>
              <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, marginTop: 4 }}>{w.t}</div>
              <div style={{ fontSize: 27, color: C.muted, marginTop: 10, lineHeight: 1.3 }}>{w.s}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: "50%", top: 40, translate: "-50% 0", scale: String(or), width: 88, height: 88, borderRadius: "50%", background: C.orange, border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
          HOẶC
        </div>
      </div>
      <div style={{ position: "absolute", top: 1330, left: 70, right: 70, display: "flex", alignItems: "center", gap: 24, background: "rgba(229,57,53,.92)", borderRadius: 26, padding: "20px 28px", opacity: ease(frame, 80, 92, [0, 1]) }}>
        <Ico name="alert" size={64} />
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.25 }}>Không nộp phí, không đặt cọc, không chuyển khoản để được nhận việc.</div>
      </div>
    </AbsoluteFill>
  );
};
