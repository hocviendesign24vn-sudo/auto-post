import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, CONTACT, FONT } from "../brand";
import type { BangTinData } from "../types";
import { allJobs, shortRegion, topSalaries } from "../derive";
import { BrandBackground, ease, Logo, useSpring } from "../ui";
import { Ico } from "./kit";
import { fitVoice, seriesFrames, VoicedSeries, type Scene } from "./BangTinPro";
import { MapScene } from "./MapScene";
import { SalaryScene } from "./SalaryScene";

// Bản ngắn khoảng 30-40 giây cho Reels, Shorts, TikTok: mở đầu bằng việc lương cao nhất,
// top lương, bản đồ, rồi mời bình luận. Thứ tự cảnh khớp với script_ngan trong render/voice.py.

// Mở đầu: ngay giây đầu đã thấy việc gì, lương bao nhiêu, ở đâu.
const HookTop: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const top = topSalaries(data, 1)[0];
  const rest = allJobs(data).length - 1;
  const pill = useSpring(0, 9, 200);
  const big = useSpring(4, 8, 220);
  const card = useSpring(14, 12, 170);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Logo width={150} pad={16} />
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(pill) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#E53935", borderRadius: 999, padding: "16px 36px", fontSize: 44, fontWeight: 900 }}>
          <Ico name="sparkles" size={44} />
          ĐANG TUYỂN GẤP
        </div>
      </div>
      <div style={{ position: "absolute", top: 470, left: 40, right: 40, textAlign: "center", scale: String(0.8 + 0.2 * big), opacity: big }}>
        <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>LƯƠNG ĐẾN</div>
        <div style={{ fontSize: 250, fontWeight: 900, letterSpacing: -10, lineHeight: 1, color: C.orange, textShadow: "0 24px 70px rgba(255,127,20,.5)" }}>
          {top?.max ?? ""}
          <span style={{ fontSize: 110, letterSpacing: -2 }}> TRIỆU</span>
        </div>
      </div>
      {top && (
        <div style={{ position: "absolute", top: 900, left: 70, right: 70, background: "#fff", color: C.ink, borderRadius: 34, padding: "34px 40px", boxShadow: "0 24px 60px rgba(0,0,0,.35)", translate: `0px ${(1 - card) * 200}px`, opacity: card }}>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1 }}>{top.pos}</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.muted, marginTop: 10 }}>{top.co}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 38, fontWeight: 800, color: C.blue1, marginTop: 14 }}>
            <Ico name="pin" size={40} color={C.orange} />
            {shortRegion(top.region)}
            {top.dl ? <span style={{ color: C.muted, fontWeight: 600 }}> • hạn {top.dl}</span> : null}
          </div>
        </div>
      )}
      <div style={{ position: "absolute", top: 1290, left: 0, right: 0, textAlign: "center", fontSize: 52, fontWeight: 800, opacity: ease(frame, 30, 42, [0, 1]) }}>
        + <span style={{ color: C.orange }}>{rest}</span> việc làm mới hôm nay
      </div>
      <div style={{ position: "absolute", top: 1380, left: 0, right: 0, textAlign: "center", fontSize: 34, fontWeight: 600, opacity: ease(frame, 38, 50, [0, 0.85]) }}>
        {data.regionsLine.join(" • ")}
      </div>
    </AbsoluteFill>
  );
};

// Kết: hỏi người xem ở đâu để họ bình luận, chỉ chỗ xem đủ danh sách, nhắc không thu phí.
const CommentCta: React.FC<{ data: BangTinData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const total = allJobs(data).length;
  const q = useSpring(0, 10, 180);
  const bounce = Math.abs(Math.sin(frame / 6)) * 18;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff" }}>
      <BrandBackground />
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Logo width={150} pad={16} />
      </div>
      <div style={{ position: "absolute", top: 330, left: 50, right: 50, textAlign: "center", scale: String(q) }}>
        <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>Bạn tìm việc</div>
        <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05, color: C.orange }}>ở tỉnh nào?</div>
      </div>
      <div style={{ position: "absolute", top: 640, left: 70, right: 70, display: "flex", alignItems: "center", gap: 24, background: "rgba(255,255,255,.14)", border: "2px solid rgba(255,255,255,.3)", borderRadius: 30, padding: "28px 34px", opacity: ease(frame, 14, 26, [0, 1]) }}>
        <Ico name="chat" size={80} color={C.orange} />
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.2 }}>Bình luận tên tỉnh, D24 gửi thêm việc phù hợp cho bạn</div>
      </div>
      <div style={{ position: "absolute", top: 860, left: 0, right: 0, display: "flex", justifyContent: "center", translate: `0px ${bounce}px`, opacity: ease(frame, 20, 30, [0, 1]), fontSize: 90 }}>
        👇
      </div>
      <div style={{ position: "absolute", top: 1010, left: 70, right: 70, display: "flex", justifyContent: "center", opacity: ease(frame, 30, 42, [0, 1]) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})`, borderRadius: 999, padding: "28px 44px", fontSize: 44, fontWeight: 900, boxShadow: "0 20px 60px rgba(255,127,20,.55)" }}>
          <Ico name="globe" size={48} />
          Xem đủ {total} việc: {CONTACT.website}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1190, left: 70, right: 70, display: "flex", alignItems: "center", gap: 20, background: "#fff", color: C.ink, borderRadius: 26, padding: "24px 30px", opacity: ease(frame, 44, 56, [0, 1]) }}>
        <Ico name="shield" size={60} color={C.orange} />
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.25 }}>
          Nhà tuyển dụng thật <span style={{ color: C.orange }}>không bao giờ thu phí</span> ứng viên
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const nganScenes = (d: BangTinData): Scene[] =>
  fitVoice(d, [
    { key: "hook", dur: 120, el: () => <HookTop data={d} /> },
    { key: "salary", dur: 150, el: () => <SalaryScene data={d} /> },
    { key: "map", dur: 150, el: () => <MapScene data={d} /> },
    { key: "cta", dur: 180, el: () => <CommentCta data={d} /> },
  ]);

export const nganTotalFrames = (d: BangTinData) => seriesFrames(nganScenes(d));

export const BangTinNgan: React.FC<BangTinData> = (data) => <VoicedSeries data={data} scenes={nganScenes(data)} />;
