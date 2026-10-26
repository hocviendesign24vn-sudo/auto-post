import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  BadgeDollarSign, Briefcase, Building2, Calculator, CalendarClock, Factory, Globe, HardHat, Landmark, Mail,
  MapPin, MessageCircle, Phone, Search, Send, ShieldAlert, ShieldCheck, Sparkles, TrendingUp, Truck, Ban,
} from "lucide-react";
import { C } from "../brand";
import { ease } from "../ui";

const ICONS = {
  calculator: Calculator, hardhat: HardHat, trending: TrendingUp, factory: Factory, landmark: Landmark, truck: Truck,
  pin: MapPin, money: BadgeDollarSign, briefcase: Briefcase, building: Building2, calendar: CalendarClock, search: Search,
  chat: MessageCircle, send: Send, shield: ShieldCheck, alert: ShieldAlert, sparkles: Sparkles, phone: Phone, globe: Globe,
  mail: Mail, ban: Ban,
};
export type IconName = keyof typeof ICONS;

export const Ico: React.FC<{ name: string; size: number; color?: string; stroke?: number }> = ({ name, size, color = "#fff", stroke = 2.2 }) => {
  const Cmp = ICONS[name as IconName] ?? Briefcase;
  return <Cmp size={size} color={color} strokeWidth={stroke} style={{ flex: "none" }} />;
};

// Biểu tượng trong vòng tròn có vòng sáng lan ra
export const IconBadge: React.FC<{ name: string; size: number; color: string; delay?: number }> = ({ name, size, color, delay = 0 }) => {
  const frame = useCurrentFrame();
  const ring = ((frame - delay) % 45) / 45;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `4px solid ${color}`, opacity: frame > delay ? 1 - ring : 0, scale: String(1 + ring * 0.5) }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}CC)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 14px 34px ${color}66` }}>
        <Ico name={name} size={size * 0.5} />
      </div>
    </div>
  );
};

export const Glass: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: "rgba(255,255,255,.12)", border: "2px solid rgba(255,255,255,.22)", borderRadius: 30, backdropFilter: "blur(8px)", ...style }}>{children}</div>
);

export const Title: React.FC<{ kicker: string; title: string; delay?: number; color?: string }> = ({ kicker, title, delay = 0, color = C.orange }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 210, left: 70, right: 70, color: "#fff" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: color, borderRadius: 999, padding: "10px 24px", fontSize: 30, fontWeight: 800, opacity: ease(frame, delay, delay + 10, [0, 1]), translate: `${ease(frame, delay, delay + 16, [-40, 0])}px 0px` }}>
        <Ico name="sparkles" size={30} />
        {kicker}
      </div>
      <div style={{ overflow: "hidden", marginTop: 16 }}>
        <div style={{ fontSize: 82, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, translate: `0px ${ease(frame, delay + 4, delay + 22, [110, 0])}%` }}>{title}</div>
      </div>
    </div>
  );
};

export const countText = (target: number, p: number, decimals = 0) => (target * p).toFixed(decimals);

export const clampI = (f: number, a: number, b: number, x: number, y: number) =>
  interpolate(f, [a, b], [x, y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
