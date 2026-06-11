import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

export const CalcScene4Result: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const profitIn = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 130 } });
  const breakdownIn = spring({ frame: frame - 50, fps, config: { damping: 22, stiffness: 160 } });
  const profitNum = interpolate(frame, [18, 70], [0, 7.62], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const rows = [
    { label: "NADAC cost (90 tabs)", value: "$2.88", color: theme.ink },
    { label: "Dispensing fee", value: "+ $10.50", color: theme.ink },
    { label: "Payer reimbursement", value: "$21.00", color: theme.ink },
    { label: "Net profit", value: "+ $7.62", color: theme.accent, bold: true },
  ];

  return (
    <AbsoluteFill style={{ background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrowserChrome url="nadaclookup.com/reimbursement-calculator">
        <div style={{ padding: "50px 60px", background: theme.white, height: "100%" }}>
          <Logo size={28} />
          <div style={{ marginTop: 24, opacity: headerIn }}>
            <div style={{ fontSize: 18, color: theme.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Estimated reimbursement
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.ink, marginTop: 2, letterSpacing: -0.8 }}>
              Metformin 500mg · 90 tablets
            </div>
          </div>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              alignItems: "flex-end",
              gap: 22,
              opacity: profitIn,
              transform: `scale(${interpolate(profitIn, [0, 1], [0.92, 1])})`,
              transformOrigin: "left bottom",
            }}
          >
            <div style={{ fontSize: 150, fontWeight: 800, color: theme.accent, lineHeight: 1, letterSpacing: -5 }}>
              +${profitNum.toFixed(2)}
            </div>
            <div style={{ paddingBottom: 26, fontSize: 26, color: theme.inkSoft, fontWeight: 600 }}>net profit</div>
          </div>

          <div
            style={{
              marginTop: 28,
              background: theme.primarySoft,
              borderRadius: 16,
              border: `1px solid ${theme.divider}`,
              padding: "8px 28px",
              opacity: breakdownIn,
              transform: `translateY(${interpolate(breakdownIn, [0, 1], [16, 0])}px)`,
            }}
          >
            {rows.map((r, i) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px 0",
                  borderBottom: i < rows.length - 1 ? `1px solid ${theme.divider}` : "none",
                  fontSize: 24,
                  fontWeight: r.bold ? 800 : 500,
                  color: r.color,
                }}
              >
                <span>{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </BrowserChrome>
      <Caption text="3. See your reimbursement instantly" delay={20} />
    </AbsoluteFill>
  );
};
