import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Type } from "./scenes/Scene2Type";
import { Scene3Detail } from "./scenes/Scene3Detail";
import { Scene4Chart } from "./scenes/Scene4Chart";
import { Scene5Outro } from "./scenes/Scene5Outro";
import { theme } from "./theme";

loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: "Inter, sans-serif" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={105}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene2Type />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene3Detail />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene4Chart />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

        <TransitionSeries.Sequence durationInFrames={108}>
          <Scene5Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
