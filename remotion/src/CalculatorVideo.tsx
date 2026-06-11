import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CalcScene1Hook } from "./scenes/CalcScene1Hook";
import { CalcScene2Inputs } from "./scenes/CalcScene2Inputs";
import { CalcScene3Payer } from "./scenes/CalcScene3Payer";
import { CalcScene4Result } from "./scenes/CalcScene4Result";
import { CalcScene5Outro } from "./scenes/CalcScene5Outro";
import { theme } from "./theme";

export const CalculatorVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: "Inter, sans-serif" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={105}><CalcScene1Hook /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={135}><CalcScene2Inputs /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={120}><CalcScene3Payer /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={150}><CalcScene4Result /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence durationInFrames={108}><CalcScene5Outro /></TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
