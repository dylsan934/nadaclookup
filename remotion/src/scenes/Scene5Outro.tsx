import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Logo } from "../components/BrowserChrome";

export const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const urlIn = spring({ frame: frame - 16, fps, config: { damping: 20, stiffness: 160 } });
  const tagIn = spring({ frame: frame - 32, fps, config: { damping: 22, stiffness: 160 } });
  const drift = Math.sin(frame / 28) * 8;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 600px at 50% 40%, #1456b5 0%, ${theme.bgDeep} 70%, #06122a 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", top: 100, left: 200, opacity: 0.15, transform: `translateY(${drift}px) rotate(-12deg)` }}>
        <div style={{ width: 220, height: 84, borderRadius: 999, background: theme.white }} />
      </div>
      <div style={{ position: "absolute", bottom: 120, right: 180, opacity: 0.12, transform: `translateY(${-drift}px) rotate(18deg)` }}>
        <div style={{ width: 280, height: 100, borderRadius: 999, background: theme.primary }} />
      </div>

      <div
        style={{
          opacity: logoIn,
          transform: `scale(${interpolate(logoIn, [0, 1], [0.85, 1])})`,
        }}
      >
        <Logo size={64} dark />
      </div>

      <div
        style={{
          marginTop: 48,
          fontSize: 64,
          fontWeight: 800,
          color: theme.white,
          letterSpacing: -1.5,
          opacity: urlIn,
          transform: `translateY(${interpolate(urlIn, [0, 1], [16, 0])}px)`,
        }}
      >
        nadaclookup.com
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 30,
          color: "rgba(255,255,255,0.75)",
          fontWeight: 500,
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [16, 0])}px)`,
        }}
      >
        Free to search. Built for pharmacists.
      </div>
    </AbsoluteFill>
  );
};
