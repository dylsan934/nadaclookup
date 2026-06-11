import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

export const AlertScene3Threshold: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });

  // slider animates from 0% to 67% (i.e. ~5%)
  const sliderProg = interpolate(frame, [25, 80], [0, 0.67], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const threshold = (sliderProg * 7.5).toFixed(1); // 0 -> ~5%
  const trackW = 1100;

  return (
    <AbsoluteFill style={{ background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrowserChrome url="nadaclookup.com/saved-drugs">
        <div style={{ padding: "50px 60px", background: theme.white, height: "100%" }}>
          <Logo size={28} />
          <div style={{ marginTop: 30, opacity: headerIn, transform: `translateY(${interpolate(headerIn, [0, 1], [12, 0])}px)` }}>
            <div style={{ fontSize: 18, color: theme.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Alert settings · Lipitor
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: theme.ink, marginTop: 4, letterSpacing: -1 }}>
              Notify me when price changes by
            </div>
          </div>

          {/* Big readout */}
          <div style={{ marginTop: 28, display: "flex", alignItems: "baseline", gap: 16 }}>
            <div style={{ fontSize: 150, fontWeight: 800, color: theme.primary, lineHeight: 1, letterSpacing: -5 }}>
              {threshold}%
            </div>
            <div style={{ fontSize: 28, color: theme.inkSoft, fontWeight: 500 }}>or more</div>
          </div>

          {/* Slider */}
          <div style={{ marginTop: 28, position: "relative", width: trackW, height: 14, background: theme.divider, borderRadius: 999 }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: 14, width: trackW * sliderProg, background: theme.primary, borderRadius: 999 }} />
            <div
              style={{
                position: "absolute",
                top: -16,
                left: trackW * sliderProg - 23,
                width: 46,
                height: 46,
                borderRadius: 999,
                background: theme.white,
                border: `4px solid ${theme.primary}`,
                boxShadow: "0 6px 16px rgba(11,95,204,0.25)",
              }}
            />
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", width: trackW, color: theme.muted, fontSize: 18, fontWeight: 500 }}>
            <span>0%</span><span>2.5%</span><span>5%</span><span>7.5%</span>
          </div>

          {/* Methods */}
          <div style={{ marginTop: 32, display: "flex", gap: 14 }}>
            {[
              { icon: "✉️", label: "Email" },
              { icon: "🔔", label: "In-app" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: theme.primarySoft,
                  border: `2px solid ${theme.primary}`,
                  borderRadius: 12,
                  padding: "14px 22px",
                  fontSize: 22,
                  fontWeight: 600,
                  color: theme.primary,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>{m.icon}</span>{m.label}
              </div>
            ))}
          </div>
        </div>
      </BrowserChrome>
      <Caption text="2. Set your alert threshold" delay={10} />
    </AbsoluteFill>
  );
};
