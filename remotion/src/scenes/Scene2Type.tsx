import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

const FULL_QUERY = "Lipitor";

export const Scene2Type: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typing animation: 1 char every 6 frames, starts at frame 15
  const charsTyped = Math.max(0, Math.min(FULL_QUERY.length, Math.floor((frame - 15) / 6)));
  const typed = FULL_QUERY.slice(0, charsTyped);
  const cursorBlink = Math.floor(frame / 12) % 2 === 0;

  // Dropdown appears after typing complete
  const dropdownStart = 15 + FULL_QUERY.length * 6 + 6;
  const dropdownIn = spring({ frame: frame - dropdownStart, fps, config: { damping: 22, stiffness: 180 } });

  // Cursor moves to result around frame 110
  const cursorMoveStart = 110;
  const cursorProgress = interpolate(frame, [cursorMoveStart, cursorMoveStart + 18], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cursorX = interpolate(cursorProgress, [0, 1], [780, 720]);
  const cursorY = interpolate(cursorProgress, [0, 1], [420, 540]);
  const clickPulse = frame >= cursorMoveStart + 18 && frame <= cursorMoveStart + 26 ? 1 : 0;

  const results = [
    { name: "Lipitor (atorvastatin calcium)", ndc: "00071-0155-23", price: "$0.18" },
    { name: "Lipitor 20 mg tablet", ndc: "00071-0156-23", price: "$0.22" },
    { name: "Lipitor 40 mg tablet", ndc: "00071-0157-23", price: "$0.31" },
  ];

  return (
    <AbsoluteFill style={{ background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrowserChrome url="nadaclookup.com">
        <div style={{ padding: "50px 60px", height: "100%", background: theme.white }}>
          <Logo size={28} />

          <div style={{ marginTop: 60, fontSize: 48, fontWeight: 700, color: theme.ink, letterSpacing: -1 }}>
            Search NADAC prices
          </div>
          <div style={{ marginTop: 10, fontSize: 22, color: theme.inkSoft }}>
            Drug name, NDC, or active ingredient
          </div>

          {/* Search bar */}
          <div
            style={{
              marginTop: 32,
              height: 78,
              borderRadius: 16,
              border: `2px solid ${theme.primary}`,
              background: theme.white,
              display: "flex",
              alignItems: "center",
              padding: "0 28px",
              gap: 18,
              boxShadow: "0 8px 32px rgba(11,95,204,0.12)",
              position: "relative",
            }}
          >
            <div style={{ fontSize: 32, color: theme.primary }}>🔍</div>
            <div style={{ fontSize: 30, color: theme.ink, fontWeight: 500, display: "flex", alignItems: "center" }}>
              {typed}
              {frame >= 15 && frame < dropdownStart + 6 && (
                <span style={{ width: 2, height: 36, background: theme.primary, marginLeft: 3, opacity: cursorBlink ? 1 : 0 }} />
              )}
            </div>
          </div>

          {/* Dropdown */}
          {dropdownIn > 0.01 && (
            <div
              style={{
                marginTop: 12,
                background: theme.white,
                borderRadius: 16,
                border: `1px solid ${theme.divider}`,
                boxShadow: "0 24px 60px rgba(11,31,61,0.12)",
                overflow: "hidden",
                opacity: dropdownIn,
                transform: `translateY(${interpolate(dropdownIn, [0, 1], [-10, 0])}px)`,
              }}
            >
              {results.map((r, i) => {
                const rowIn = spring({ frame: frame - dropdownStart - 4 - i * 5, fps, config: { damping: 22, stiffness: 200 } });
                const highlighted = i === 0 && frame >= cursorMoveStart + 12;
                return (
                  <div
                    key={r.ndc}
                    style={{
                      padding: "22px 28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: i < results.length - 1 ? `1px solid ${theme.divider}` : "none",
                      background: highlighted ? theme.primarySoft : theme.white,
                      opacity: rowIn,
                      transform: `translateX(${interpolate(rowIn, [0, 1], [-12, 0])}px)`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: theme.ink }}>{r.name}</div>
                      <div style={{ fontSize: 16, color: theme.muted, marginTop: 4 }}>NDC {r.ndc}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: theme.primary }}>{r.price}/unit</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cursor */}
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transition: "none",
            pointerEvents: "none",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill={theme.ink} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}>
            <path d="M3 3l7 18 2-8 8-2z" stroke="#fff" strokeWidth="1.5" />
          </svg>
          {clickPulse > 0 && (
            <div
              style={{
                position: "absolute",
                top: -10,
                left: -10,
                width: 50,
                height: 50,
                borderRadius: 999,
                border: `3px solid ${theme.primary}`,
                opacity: 0.6,
              }}
            />
          )}
        </div>
      </BrowserChrome>
      <Caption text="1. Type any drug name or NDC" delay={6} />
    </AbsoluteFill>
  );
};
