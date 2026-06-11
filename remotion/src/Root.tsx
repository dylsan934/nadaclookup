import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { CalculatorVideo } from "./CalculatorVideo";
import { AlertsVideo } from "./AlertsVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="main" component={MainVideo} durationInFrames={600} fps={30} width={1920} height={1080} />
      <Composition id="calculator" component={CalculatorVideo} durationInFrames={600} fps={30} width={1920} height={1080} />
      <Composition id="alerts" component={AlertsVideo} durationInFrames={600} fps={30} width={1920} height={1080} />
    </>
  );
};
