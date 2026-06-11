import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AlertScene1Hook } from "./scenes/AlertScene1Hook";
import { AlertScene2Save } from "./scenes/AlertScene2Save";
import { AlertScene3Threshold } from "./scenes/AlertScene3Threshold";
import { AlertScene4Notify } from "./scenes/AlertScene4Notify";
import { AlertScene5Outro } from "./scenes/AlertScene5Outro";
import { theme } from "./theme";

export const AlertsVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: "Inter, sans-serif" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={105}><AlertScene1Hook /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={135}><AlertScene2Save /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={120}><AlertScene3Threshold /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={150}><AlertScene4Notify /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={108}><AlertScene5Outro /></TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
