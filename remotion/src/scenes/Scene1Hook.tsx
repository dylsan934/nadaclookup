import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Logo } from "../components/BrowserChrome";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const lineIn = spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 160 } });
  const subIn = spring({ frame: frame - 36, fps, config: { damping: 22, stiffness: 160 } });
  const drift = Math.sin(frame / 30) * 6;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 30% 20%, #103a7a 0%, ${theme.bgDeep} 60%, #06122a 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingLeft: 160,
      }}
    >
      {/* floating capsule motifs */}
      <div style={{ position: "absolute", top: 120, right: 140, opacity: 0.18, transform: `translateY(${drift}px) rotate(-18deg)` }}>
        <div style={{ width: 260, height: 100, borderRadius: 999, background: theme.primary }} />
      </div>
      <div style={{ position: "absolute", bottom: 140, right: 320, opacity: 0.12, transform: `translateY(${-drift}px) rotate(22deg)` }}>
        <div style={{ width: 180, height: 70, borderRadius: 999, background: theme.white }} />
      </div>

      <div style={{ opacity: logoIn, transform: `translateY(${interpolate(logoIn, [0, 1], [20, 0])}px)` }}>
        <Logo size={42} dark />
      </div>

      <div
        style={{
          marginTop: 44,
          opacity: lineIn,
          transform: `translateY(${interpolate(lineIn, [0, 1], [30, 0])}px)`,
          color: theme.white,
          fontSize: 110,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: -2.5,
          maxWidth: 1400,
        }}
      >
        Look up any drug's<br />
        <span style={{ color: "#7DB4FF" }}>NADAC price</span> in seconds.
      </div>

      <div
        style={{
          marginTop: 28,
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [20, 0])}px)`,
          color: "rgba(255,255,255,0.7)",
          fontSize: 32,
          fontWeight: 500,
        }}
      >
        Pricing clarity, one search away.
      </div>
    </AbsoluteFill>
  );
};
