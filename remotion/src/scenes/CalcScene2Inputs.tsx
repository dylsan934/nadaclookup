import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

const DRUG = "Metformin 500mg";

export const CalcScene2Inputs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const drugChars = Math.max(0, Math.min(DRUG.length, Math.floor((frame - 15) / 4)));
  const typedDrug = DRUG.slice(0, drugChars);
  const cursorBlink = Math.floor(frame / 12) % 2 === 0;

  const qtyStart = 15 + DRUG.length * 4 + 10;
  const qtyVal = interpolate(frame, [qtyStart, qtyStart + 22], [0, 90], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrowserChrome url="nadaclookup.com/reimbursement-calculator">
        <div style={{ padding: "50px 60px", background: theme.white, height: "100%" }}>
          <Logo size={28} />
          <div style={{ marginTop: 30, opacity: headerIn, transform: `translateY(${interpolate(headerIn, [0, 1], [12, 0])}px)` }}>
            <div style={{ fontSize: 18, color: theme.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Reimbursement calculator
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: theme.ink, marginTop: 4, letterSpacing: -1 }}>
              Step 1 — Pick a drug
            </div>
          </div>

          {/* Drug input */}
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 18, color: theme.inkSoft, fontWeight: 600, marginBottom: 10 }}>Drug name or NDC</div>
            <div
              style={{
                height: 78,
                borderRadius: 14,
                border: `2px solid ${theme.primary}`,
                background: theme.white,
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                gap: 16,
                boxShadow: "0 8px 32px rgba(11,95,204,0.1)",
              }}
            >
              <div style={{ fontSize: 28, color: theme.primary }}>💊</div>
              <div style={{ fontSize: 28, color: theme.ink, fontWeight: 600, display: "flex", alignItems: "center" }}>
                {typedDrug}
                {frame >= 15 && frame < qtyStart && (
                  <span style={{ width: 2, height: 32, background: theme.primary, marginLeft: 3, opacity: cursorBlink ? 1 : 0 }} />
                )}
              </div>
            </div>
          </div>

          {/* Quantity input */}
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 18, color: theme.inkSoft, fontWeight: 600, marginBottom: 10 }}>Quantity dispensed</div>
            <div
              style={{
                height: 78,
                borderRadius: 14,
                border: `2px solid ${frame >= qtyStart ? theme.primary : theme.divider}`,
                background: theme.white,
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.ink }}>{Math.round(qtyVal)}</div>
              <div style={{ fontSize: 22, color: theme.muted, fontWeight: 500 }}>tablets</div>
            </div>
          </div>

          {/* NADAC pulled */}
          {frame > qtyStart + 25 && (
            <div
              style={{
                marginTop: 26,
                background: theme.primarySoft,
                borderRadius: 14,
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `1px solid ${theme.divider}`,
                opacity: spring({ frame: frame - qtyStart - 25, fps, config: { damping: 20 } }),
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>NADAC auto-loaded</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.ink, marginTop: 4 }}>$0.032 / tablet</div>
              </div>
              <div style={{ fontSize: 32, color: theme.accent }}>✓</div>
            </div>
          )}
        </div>
      </BrowserChrome>
      <Caption text="1. Enter the drug & quantity" delay={6} />
    </AbsoluteFill>
  );
};
