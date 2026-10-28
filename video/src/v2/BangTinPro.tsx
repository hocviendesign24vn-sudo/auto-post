import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, springTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { C } from "../brand";
import type { BangTinData } from "../types";
import { Outro } from "../scenes/Outro";
import { Hook } from "./Hook";
import { MapScene } from "./MapScene";
import { IndustryScene } from "./IndustryScene";
import { SalaryScene } from "./SalaryScene";
import { RegionScene } from "./RegionScene";
import { WestScene } from "./WestScene";
import { StepsScene } from "./StepsScene";
import { Subtitles } from "./Subtitles";

export const FPS = 30;
const T = 18;
const VOICE_DELAY = 8;

export type Scene = { key: string; dur: number; el: (dur: number) => React.ReactNode; subs?: boolean };

// Thứ tự cảnh phải khớp với thứ tự lời đọc trong render/voice.py (script_pro)
export const proScenes = (d: BangTinData): Scene[] => {
  const s: Scene[] = [
    { key: "hook", dur: 110, el: () => <Hook data={d} /> },
    { key: "map", dur: 150, el: () => <MapScene data={d} /> },
    { key: "industry", dur: 140, el: () => <IndustryScene data={d} /> },
    { key: "salary", dur: 150, el: () => <SalaryScene data={d} /> },
    ...d.lists.map((l) => ({ key: `list-${l.name}`, dur: 200, el: (dur: number) => <RegionScene list={l} dur={dur} /> })),
  ];
  if (d.grid?.cells.length) s.push({ key: "west", dur: 160, el: () => <WestScene grid={d.grid!} /> });
  s.push({ key: "steps", dur: 150, el: () => <StepsScene /> });
  s.push({ key: "outro", dur: 170, el: () => <Outro data={d} />, subs: false });
  return fitVoice(d, s);
};

const TRANSITIONS: (() => TransitionPresentation<any>)[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
  () => pushCut({ flashColor: "#ffffff", flashOpacity: 0.6 }),
  () => wipe({ direction: "from-bottom-right" }),
  () => slide({ direction: "from-right" }),
  () => pushCut({ flashColor: C.orange, flashOpacity: 0.35 }),
  () => slide({ direction: "from-bottom" }),
  () => wipe({ direction: "from-top-left" }),
  () => slide({ direction: "from-right" }),
  () => fade(),
];

// Kéo dài mỗi cảnh cho vừa lời đọc của cảnh đó
export const fitVoice = (d: BangTinData, s: Scene[]) =>
  s.map((x, i) => {
    const v = d.voice?.[i];
    return v ? { ...x, dur: Math.max(x.dur, VOICE_DELAY + Math.ceil(v.dur * FPS) + T + 14) } : x;
  });

export const seriesFrames = (s: Scene[]) => s.reduce((a, x) => a + x.dur, 0) - (s.length - 1) * T;

export const proTotalFrames = (d: BangTinData) => seriesFrames(proScenes(d));

export const BangTinPro: React.FC<BangTinData> = (data) => <VoicedSeries data={data} scenes={proScenes(data)} />;

// Chuỗi cảnh có chuyển cảnh, nhạc nền (tự nhỏ lại khi có giọng), tiếng whoosh, giọng đọc và phụ đề
export const VoicedSeries: React.FC<{ data: BangTinData; scenes: Scene[] }> = ({ data, scenes: s }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const starts: number[] = [];
  let at = 0;
  s.forEach((x, i) => {
    starts.push(i > 0 ? at - T : 0);
    at += x.dur - (i > 0 ? T : 0);
  });
  const spans = (data.voice ?? []).slice(0, s.length).map((v, i) => [starts[i] + VOICE_DELAY, starts[i] + VOICE_DELAY + Math.ceil(v.dur * FPS)]);
  const duck = (f: number) =>
    spans.reduce((m, [a, b]) => Math.min(m, interpolate(f, [a - 8, a, b, b + 12], [1, 0.28, 0.28, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 1);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <TransitionSeries>
        {s.map((x, i) => (
          <React.Fragment key={x.key}>
            {i > 0 && (
              <TransitionSeries.Transition
                presentation={TRANSITIONS[(i - 1) % TRANSITIONS.length]()}
                timing={i % 2 ? linearTiming({ durationInFrames: T }) : springTiming({ config: { damping: 200 }, durationInFrames: T })}
              />
            )}
            <TransitionSeries.Sequence name={x.key} durationInFrames={x.dur}>
              {x.el(x.dur)}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})`, width: `${(frame / durationInFrames) * 100}%` }} />
      <Audio
        src={staticFile("music.wav")}
        volume={(f) => interpolate(f, [0, 15, durationInFrames - 45, durationInFrames], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * duck(f)}
      />
      {starts.slice(1).map((c, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, c - 4)} durationInFrames={24} layout="none">
          <Audio src={staticFile("whoosh.wav")} volume={0.4} />
        </Sequence>
      ))}
      {(data.voice ?? []).slice(0, s.length).map((v, i) => (
        <Sequence key={`v${i}`} from={starts[i] + VOICE_DELAY} durationInFrames={Math.ceil(v.dur * FPS) + 10}>
          <Audio src={staticFile(v.src)} volume={1} />
          {s[i].subs !== false && v.text && <Subtitles text={v.text} dur={v.dur} />}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
