import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";

export const Caption: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 180 } });
  const y = interpolate(s, [0, 1], [30, 0]);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: s,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(10, 31, 61, 0.92)",
          color: theme.white,
          padding: "18px 36px",
          borderRadius: 999,
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: -0.3,
          boxShadow: "0 20px 60px rgba(11,95,204,0.25)",
        }}
      >
        {text}
      </div>
    </div>
  );
};
