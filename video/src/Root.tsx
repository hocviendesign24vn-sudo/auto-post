import { Composition, Folder } from "remotion";
import { BangTinPro, proTotalFrames } from "./v2/BangTinPro";
import { BangTin, FPS, totalFrames } from "./BangTin";
import type { BangTinData } from "./types";
import sample from "../../examples/bangtin-mau.json";

// Dựng: npx remotion render BangTin out.mp4 --props=<file.json>
export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="BangTinPro"
    component={BangTinPro}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={proTotalFrames(sample as BangTinData)}
    defaultProps={sample as BangTinData}
    calculateMetadata={({ props }) => ({ durationInFrames: proTotalFrames(props) })}
  />
  <Folder name="Mau-cu">
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
  </Folder>
  </>
);
