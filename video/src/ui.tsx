import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { C } from "./brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Hệ số 0→1 có độ nảy, bắt đầu sau `delay` khung.
export const useSpring = (delay = 0, damping = 14, stiffness = 140) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.8 } });
};

export const ease = (frame: number, from: number, to: number, out: [number, number]) =>
  interpolate(frame, [from, to], out, { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });

const PATHS: Record<string, string> = {
  briefcase: "M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4zm2 0h2V5h-2v1z",
  pin: "M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  calendar: "M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2zM5 9v11h14V9H5z",
  phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
  chat: "M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 6v2h2V9H7zm4 0v2h2V9h-2zm4 0v2h2V9h-2z",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4a14 14 0 0 1 1.9 4h-3.8A14 14 0 0 1 12 4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3zm.8 2h2.9a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6A15.7 15.7 0 0 0 8 8zm4 12a14 14 0 0 1-1.9-4h3.8A14 14 0 0 1 12 20zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6a15.7 15.7 0 0 0 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zM16.3 14a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 7L4 6v2l8 5 8-5V6l-8 5z",
  shield: "M12 2l8 3v6c0 5-3.5 9.7-8 11-4.5-1.3-8-6-8-11V5l8-3zm-1 13l6-6-1.4-1.4L11 12.2 8.4 9.6 7 11l4 4z",
  coin: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm1 4h-2v1.1A3 3 0 0 0 11.5 14h1a1 1 0 0 1 0 2H9v2h2v1h2v-1.1a3 3 0 0 0-.5-5.9h-1a1 1 0 0 1 0-2H15V8h-2V7z",
  clock: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z",
  send: "M2 11l19-8-8 19-2-8-9-3z",
};

export const Icon: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flex: "none" }}>
    <path d={PATHS[name] ?? PATHS.briefcase} />
  </svg>
);

export const Logo: React.FC<{ width: number; pad?: number }> = ({ width, pad = 18 }) => (
  <div style={{ background: "#fff", borderRadius: width * 0.14, padding: pad, boxShadow: "0 18px 50px rgba(0,0,0,.28)", display: "inline-flex" }}>
    <Img src={staticFile("logo-d24.png")} style={{ width, display: "block" }} />
  </div>
);

// Nền gradient thương hiệu, các khối sáng trôi chậm, lưới chấm và vệt sáng quét chéo.
// Cảnh quay thật làm nền cho cảnh hiện tại (BangTinPro gán theo từng cảnh); null thì dùng nền màu thương hiệu
export const BgVideoContext = React.createContext<{ src: string; rate: number } | null>(null);

// Nền cảnh quay: video phủ kín khung, phóng chậm, phủ lớp màu thương hiệu để chữ vẫn dễ đọc
const FootageBackground: React.FC<{ src: string; rate: number }> = ({ src, rate }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.deep, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(1.08 + frame * 0.0006) }}>
        <Video src={/^https?:/.test(src) ? src : staticFile(src)} muted loop playbackRate={rate} style={{ position: "absolute", top: 0, left: "50%", height: "100%", width: (16 / 9) * 1920, maxWidth: "none", translate: "-50% 0" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.deep}D9 0%, ${C.navy}99 26%, ${C.navy}73 55%, ${C.deep}D9 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.45) 100%)" }} />
    </AbsoluteFill>
  );
};

export const BrandBackground: React.FC<{ light?: boolean }> = ({ light }) => {
  const bg = React.useContext(BgVideoContext);
  if (bg && !light) return <FootageBackground src={bg.src} rate={bg.rate} />;
  return <ColorBackground light={light} />;
};

const ColorBackground: React.FC<{ light?: boolean }> = ({ light }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const orb = (x: number, y: number, r: number, color: string, speed: number, phase: number) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(t * speed + phase) * 60,
        top: y + Math.cos(t * speed * 0.8 + phase) * 80,
        width: r,
        height: r,
        borderRadius: "50%",
        background: color,
        filter: "blur(70px)",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: light ? "#EEF4FF" : `linear-gradient(160deg, ${C.deep} 0%, ${C.navy} 30%, ${C.blue1} 65%, ${C.blue2} 100%)`, overflow: "hidden" }}>
      {orb(-200, -150, 700, light ? "rgba(11,134,232,.18)" : "rgba(11,134,232,.55)", 0.5, 0)}
      {orb(600, 1300, 800, light ? "rgba(255,127,20,.14)" : "rgba(255,127,20,.32)", 0.4, 2)}
      {orb(700, 300, 420, light ? "rgba(8,19,223,.10)" : "rgba(255,255,255,.10)", 0.7, 4)}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${light ? "rgba(10,42,140,.10)" : "rgba(255,255,255,.12)"} 2px, transparent 2px)`,
          backgroundSize: "44px 44px",
          backgroundPosition: `0px ${-(frame * 0.6) % 44}px`,
          maskImage: "linear-gradient(180deg, rgba(0,0,0,.9), rgba(0,0,0,.2))",
        }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,.14) 50%, transparent 60%)",
          translate: `${((frame * 18) % 3200) - 1600}px 0px`,
        }}
      />
    </AbsoluteFill>
  );
};

// Thanh trên cùng của các cảnh danh sách: logo nhỏ và website.
export const TopBar: React.FC = () => {
  const p = useSpring(0, 18);
  return (
    <div style={{ position: "absolute", top: 70, left: 60, right: 60, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: p, translate: `0px ${(1 - p) * -40}px` }}>
      <Logo width={120} pad={12} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#fff", fontSize: 34, fontWeight: 700, background: "rgba(255,255,255,.14)", border: "2px solid rgba(255,255,255,.25)", padding: "14px 28px", borderRadius: 999 }}>
        <Icon name="globe" size={34} color="#fff" />
        timviecso.vn
      </div>
    </div>
  );
};

// Chữ trượt lên từ sau mặt nạ.
export const Reveal: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ overflow: "hidden", paddingBottom: 8 }}>
      <div style={{ translate: `0px ${ease(frame, delay, delay + 18, [110, 0])}%`, opacity: ease(frame, delay, delay + 10, [0, 1]), ...style }}>{children}</div>
    </div>
  );
};
