import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, springTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { C } from "./brand";
import type { BangTinData } from "./types";
import { Intro } from "./scenes/Intro";
import { Stats } from "./scenes/Stats";
import { ListScene } from "./scenes/ListScene";
import { GridScene } from "./scenes/GridScene";
import { Outro } from "./scenes/Outro";

export const FPS = 30;
const T = 20; // độ dài mỗi chuyển cảnh (khung)

// Danh sách cảnh và hiệu ứng chuyển vào cảnh đó.
const scenes = (d: BangTinData) => {
  const s: { name: string; dur: number; el: React.ReactNode }[] = [
    { name: "Mở đầu", dur: 120, el: <Intro data={d} /> },
    { name: "Số liệu", dur: 95, el: <Stats data={d} /> },
    ...d.lists.map((l) => ({ name: l.name, dur: 175, el: <ListScene list={l} /> })),
  ];
  if (d.grid?.cells.length) s.push({ name: d.grid.name, dur: 160, el: <GridScene grid={d.grid} notes={d.notes} /> });
  s.push({ name: "Kết", dur: 190, el: <Outro data={d} /> });
  return s;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSITIONS: (() => TransitionPresentation<any>)[] = [
  () => pushCut({ flashColor: "#ffffff", flashOpacity: 0.5 }),
  () => slide({ direction: "from-right" }),
  () => wipe({ direction: "from-bottom-right" }),
  () => slide({ direction: "from-bottom" }),
  () => wipe({ direction: "from-top-left" }),
];

export const totalFrames = (d: BangTinData) => {
  const s = scenes(d);
  return s.reduce((a, x) => a + x.dur, 0) - (s.length - 1) * T;
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${(frame / durationInFrames) * 100}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.orange2})` }} />
  );
};

export const BangTin: React.FC<BangTinData> = (data) => {
  const { durationInFrames } = useVideoConfig();
  const s = scenes(data);
  let at = 0;
  const cuts: number[] = [];
  s.forEach((x, i) => {
    if (i > 0) cuts.push(at - T);
    at += x.dur - (i > 0 ? T : 0);
  });
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <TransitionSeries>
        {s.map((x, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <TransitionSeries.Transition
                presentation={TRANSITIONS[(i - 1) % TRANSITIONS.length]()}
                timing={i === 1 ? linearTiming({ durationInFrames: T }) : springTiming({ config: { damping: 200 }, durationInFrames: T })}
              />
            )}
            <TransitionSeries.Sequence name={x.name} durationInFrames={x.dur}>
              {x.el}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <ProgressBar />
      <Audio
        src={staticFile("music.wav")}
        volume={(f) =>
          interpolate(f, [0, 15, durationInFrames - 45, durationInFrames], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        }
      />
      {cuts.map((c, i) => (
        <Sequence key={i} from={Math.max(0, c - 4)} durationInFrames={24} layout="none">
          <Audio src={staticFile("whoosh.wav")} volume={0.45} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
