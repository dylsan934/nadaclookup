import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

export const AlertScene2Save: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const cardIn = spring({ frame: frame - 12, fps, config: { damping: 20 } });
  // cursor moves to heart and clicks
  const cursorMoveStart = 50;
  const cursorProgress = interpolate(frame, [cursorMoveStart, cursorMoveStart + 22], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cursorX = interpolate(cursorProgress, [0, 1], [780, 1280]);
  const cursorY = interpolate(cursorProgress, [0, 1], [420, 320]);
  const clickAt = cursorMoveStart + 22;
  const filled = frame >= clickAt;
  const heartPulse = spring({ frame: frame - clickAt, fps, config: { damping: 8, stiffness: 220 } });
  const toastIn = spring({ frame: frame - clickAt - 6, fps, config: { damping: 18, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrowserChrome url="nadaclookup.com/drug/lipitor">
        <div style={{ padding: "50px 60px", background: theme.white, height: "100%" }}>
          <Logo size={28} />
          <div style={{ marginTop: 24, opacity: headerIn }}>
            <div style={{ fontSize: 18, color: theme.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Current NADAC price
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: theme.ink, marginTop: 4, letterSpacing: -1 }}>
              Lipitor <span style={{ color: theme.muted, fontWeight: 500 }}>(atorvastatin)</span>
            </div>
          </div>

          {/* Card with heart save button */}
          <div
            style={{
              marginTop: 28,
              background: theme.white,
              borderRadius: 20,
              border: `1px solid ${theme.divider}`,
              boxShadow: "0 12px 40px rgba(11,31,61,0.08)",
              padding: "28px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: cardIn,
              transform: `translateY(${interpolate(cardIn, [0, 1], [16, 0])}px)`,
            }}
          >
            <div>
              <div style={{ fontSize: 24, color: theme.muted, fontWeight: 600 }}>Per unit</div>
              <div style={{ fontSize: 96, fontWeight: 800, color: theme.primary, letterSpacing: -3, lineHeight: 1 }}>$0.184</div>
            </div>
            <button
              style={{
                position: "relative",
                width: 96,
                height: 96,
                borderRadius: 999,
                border: `2px solid ${filled ? "#E11D48" : theme.divider}`,
                background: filled ? "#FEE7EE" : theme.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 + (filled ? heartPulse * 0.18 - 0.18 : 0) + (heartPulse > 0 ? (1 - Math.abs(1 - heartPulse)) * 0.18 : 0)})`,
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill={filled ? "#E11D48" : "none"} stroke={filled ? "#E11D48" : theme.muted} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* Toast confirmation */}
          {frame > clickAt + 4 && (
            <div
              style={{
                marginTop: 22,
                opacity: toastIn,
                transform: `translateY(${interpolate(toastIn, [0, 1], [12, 0])}px)`,
                background: theme.accent,
                color: theme.white,
                borderRadius: 14,
                padding: "16px 22px",
                fontSize: 22,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              ✓ Saved to your drugs — alerts enabled
            </div>
          )}
        </div>

        {/* Cursor */}
        <div style={{ position: "absolute", left: cursorX, top: cursorY, pointerEvents: "none" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill={theme.ink} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}>
            <path d="M3 3l7 18 2-8 8-2z" stroke="#fff" strokeWidth="1.5" />
          </svg>
        </div>
      </BrowserChrome>
      <Caption text="1. Tap the heart to save a drug" delay={6} />
    </AbsoluteFill>
  );
};
