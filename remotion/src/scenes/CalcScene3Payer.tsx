import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

const PAYERS = ["Medicaid (state FFS)", "Medicare Part D", "Commercial PBM", "Cash pay"];

export const CalcScene3Payer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const dropOpen = frame > 25;
  const selected = frame > 65 ? 0 : -1;
  const feeIn = spring({ frame: frame - 80, fps, config: { damping: 20 } });
  const feeVal = interpolate(frame, [80, 100], [0, 10.5], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

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
              Step 2 — Pick payer & fees
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 18, color: theme.inkSoft, fontWeight: 600, marginBottom: 10 }}>Payer / contract</div>
            <div
              style={{
                background: theme.white,
                borderRadius: 14,
                border: `2px solid ${theme.primary}`,
                boxShadow: "0 8px 32px rgba(11,95,204,0.1)",
                overflow: "hidden",
              }}
            >
              {PAYERS.map((p, i) => {
                const visible = dropOpen;
                const rowIn = visible ? spring({ frame: frame - 25 - i * 4, fps, config: { damping: 22, stiffness: 200 } }) : 0;
                const isSelected = i === selected;
                return (
                  <div
                    key={p}
                    style={{
                      padding: "20px 24px",
                      borderBottom: i < PAYERS.length - 1 ? `1px solid ${theme.divider}` : "none",
                      background: isSelected ? theme.primarySoft : theme.white,
                      opacity: rowIn,
                      transform: `translateX(${interpolate(rowIn, [0, 1], [-12, 0])}px)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 24,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? theme.primary : theme.ink,
                    }}
                  >
                    <span>{p}</span>
                    {isSelected && <span style={{ fontSize: 24, color: theme.primary }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dispensing fee */}
          {frame > 75 && (
            <div style={{ marginTop: 24, opacity: feeIn }}>
              <div style={{ fontSize: 18, color: theme.inkSoft, fontWeight: 600, marginBottom: 10 }}>Dispensing fee</div>
              <div
                style={{
                  height: 78,
                  borderRadius: 14,
                  border: `2px solid ${theme.primary}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 24px",
                  gap: 12,
                  background: theme.white,
                }}
              >
                <span style={{ fontSize: 28, color: theme.muted, fontWeight: 600 }}>$</span>
                <span style={{ fontSize: 32, fontWeight: 700, color: theme.ink }}>{feeVal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </BrowserChrome>
      <Caption text="2. Pick your payer & fees" delay={6} />
    </AbsoluteFill>
  );
};
