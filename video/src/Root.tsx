import { Composition } from "remotion";
import { BangTin, FPS, totalFrames } from "./BangTin";
import type { BangTinData } from "./types";
import sample from "../../examples/bangtin-mau.json";

// Dựng: npx remotion render BangTin out.mp4 --props=<file.json>
export const RemotionRoot: React.FC = () => (
  <Composition
    id="BangTin"
    component={BangTin}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={totalFrames(sample as BangTinData)}
    defaultProps={sample as BangTinData}
    calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(props) })}
  />
);
