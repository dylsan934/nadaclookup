import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

export const Scene3Detail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const priceIn = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 130 } });
  const metaIn = spring({ frame: frame - 36, fps, config: { damping: 22, stiffness: 160 } });
  const priceCount = interpolate(frame, [18, 60], [0, 0.184], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrowserChrome url="nadaclookup.com/drug/lipitor">
        <div style={{ padding: "50px 60px", background: theme.white, height: "100%" }}>
          <Logo size={28} />

          <div style={{ marginTop: 36, opacity: headerIn, transform: `translateY(${interpolate(headerIn, [0, 1], [16, 0])}px)` }}>
            <div style={{ fontSize: 18, color: theme.muted, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>
              Current NADAC price
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, color: theme.ink, marginTop: 6, letterSpacing: -1.5 }}>
              Lipitor <span style={{ color: theme.muted, fontWeight: 500 }}>(atorvastatin)</span>
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignItems: "flex-end",
              gap: 24,
              opacity: priceIn,
              transform: `scale(${interpolate(priceIn, [0, 1], [0.92, 1])})`,
              transformOrigin: "left bottom",
            }}
          >
            <div style={{ fontSize: 180, fontWeight: 800, color: theme.primary, lineHeight: 1, letterSpacing: -6 }}>
              ${priceCount.toFixed(3)}
            </div>
            <div style={{ paddingBottom: 32, fontSize: 28, color: theme.inkSoft, fontWeight: 500 }}>per unit</div>
          </div>

          <div
            style={{
              marginTop: 36,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              opacity: metaIn,
              transform: `translateY(${interpolate(metaIn, [0, 1], [16, 0])}px)`,
            }}
          >
            {[
              { label: "Effective date", value: "Jun 4, 2026" },
              { label: "Drug class", value: "Statin" },
              { label: "NDC variants", value: "12" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: theme.primarySoft,
                  borderRadius: 14,
                  padding: "20px 24px",
                  border: `1px solid ${theme.divider}`,
                }}
              >
                <div style={{ fontSize: 14, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, color: theme.ink, marginTop: 6 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </BrowserChrome>
      <Caption text="2. Get the current NADAC price instantly" delay={20} />
    </AbsoluteFill>
  );
};
