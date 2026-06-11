import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Caption } from "../components/Caption";

export const AlertScene4Notify: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone mockup floating in
  const phoneIn = spring({ frame, fps, config: { damping: 18, stiffness: 130 } });
  const notifIn = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 160 } });
  const badgeIn = spring({ frame: frame - 70, fps, config: { damping: 12, stiffness: 180 } });
  const float = Math.sin(frame / 22) * 6;

  const phoneW = 560;
  const phoneH = 1000;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #EAF1FB 0%, #F4F7FB 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: phoneW,
          height: phoneH,
          background: "#0A1F3D",
          borderRadius: 56,
          padding: 14,
          boxShadow: "0 60px 120px rgba(11,31,61,0.25), 0 0 0 4px #0a1f3d",
          opacity: phoneIn,
          transform: `translateY(${interpolate(phoneIn, [0, 1], [40, float])}px) scale(${interpolate(phoneIn, [0, 1], [0.95, 1])})`,
        }}
      >
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #1456b5 0%, #0A1F3D 60%)", borderRadius: 44, position: "relative", overflow: "hidden" }}>
          {/* notch */}
          <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 140, height: 28, background: "#000", borderRadius: 999 }} />
          {/* status bar */}
          <div style={{ position: "absolute", top: 22, left: 32, color: "white", fontSize: 18, fontWeight: 600 }}>9:41</div>
          <div style={{ position: "absolute", top: 22, right: 32, color: "white", fontSize: 18, fontWeight: 600 }}>●●●●</div>

          {/* Notification card */}
          <div
            style={{
              position: "absolute",
              top: 110,
              left: 20,
              right: 20,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: 24,
              padding: "20px 22px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              opacity: notifIn,
              transform: `translateY(${interpolate(notifIn, [0, 1], [-40, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: theme.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 22, height: 10, borderRadius: 999, background: "white" }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.ink }}>NADAC LOOKUP</div>
              <div style={{ marginLeft: "auto", fontSize: 14, color: theme.muted }}>now</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: theme.ink, marginBottom: 6 }}>Lipitor price dropped</div>
            <div style={{ fontSize: 18, color: theme.inkSoft, lineHeight: 1.4 }}>
              NADAC fell <span style={{ color: theme.accent, fontWeight: 700 }}>↓ 6.2%</span> this week — now $0.173/unit.
            </div>
          </div>

          {/* Big delta badge below */}
          {frame > 70 && (
            <div
              style={{
                position: "absolute",
                bottom: 80,
                left: "50%",
                transform: `translateX(-50%) scale(${badgeIn})`,
                background: theme.accent,
                color: "white",
                padding: "20px 36px",
                borderRadius: 999,
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: -1,
                boxShadow: "0 16px 40px rgba(34,197,94,0.4)",
              }}
            >
              ↓ 6.2% this week
            </div>
          )}
        </div>
      </div>
      <Caption text="3. Get notified the moment prices change" delay={20} />
    </AbsoluteFill>
  );
};
