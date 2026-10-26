import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../brand";

// Chia lời đọc thành từng cụm ngắn, thời gian mỗi cụm tỉ lệ với số ký tự; tô sáng dần từng chữ.
const chunks = (text: string) => {
  const parts = text.split(/(?<=[,.!?:])\s+/);
  const out: string[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && (last + " " + p).length <= 42) out[out.length - 1] = last + " " + p;
    else out.push(p);
  }
  return out;
};

export const Subtitles: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cs = chunks(text);
  const total = cs.reduce((a, c) => a + c.length, 0);
  const t = frame / fps;
  let acc = 0;
  let idx = cs.length - 1;
  let local = 1;
  for (let i = 0; i < cs.length; i++) {
    const len = (cs[i].length / total) * dur;
    if (t < acc + len) {
      idx = i;
      local = (t - acc) / len;
      break;
    }
    acc += len;
  }
  if (t > dur + 0.3) return null;
  const words = cs[idx].split(" ");
  const lit = Math.ceil(words.length * Math.min(1, local * 1.15));
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom: 190, display: "flex", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ background: "rgba(6,20,80,.78)", borderRadius: 24, padding: "18px 30px", textAlign: "center", fontSize: 46, fontWeight: 800, lineHeight: 1.3, color: "rgba(255,255,255,.55)", boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: i < lit ? (i === lit - 1 ? C.orange2 : "#fff") : undefined }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};
