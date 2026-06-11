import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BrowserChrome, Logo } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";

const POINTS = [0.42, 0.38, 0.36, 0.31, 0.28, 0.25, 0.22, 0.21, 0.19, 0.20, 0.185, 0.184];
const MONTHS = ["'21", "", "'22", "", "'23", "", "'24", "", "'25", "", "'26", ""];

export const Scene4Chart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const drawProgress = interpolate(frame, [12, 72], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const W = 1280;
  const H = 380;
  const padX = 60;
  const padY = 40;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const maxV = Math.max(...POINTS);
  const minV = Math.min(...POINTS) * 0.85;
  const points = POINTS.map((v, i) => {
    const x = padX + (i / (POINTS.length - 1)) * innerW;
    const y = padY + innerH - ((v - minV) / (maxV - minV)) * innerH;
    return { x, y };
  });

  // path with progress
  const visibleCount = Math.max(1, Math.floor(drawProgress * (points.length - 1)) + 1);
  const partial = points.slice(0, visibleCount);
  const tailIdx = Math.min(points.length - 1, visibleCount);
  const tailFrac = drawProgress * (points.length - 1) - (visibleCount - 1);
  if (visibleCount < points.length) {
    const a = points[visibleCount - 1];
    const b = points[tailIdx];
    partial.push({ x: a.x + (b.x - a.x) * tailFrac, y: a.y + (b.y - a.y) * tailFrac });
  }
  const d = partial.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${d} L ${partial[partial.length - 1].x} ${padY + innerH} L ${padX} ${padY + innerH} Z`;

  const dotIn = spring({ frame: frame - 70, fps, config: { damping: 12, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrowserChrome url="nadaclookup.com/drug/lipitor">
        <div style={{ padding: "50px 60px", background: theme.white, height: "100%" }}>
          <Logo size={28} />

          <div style={{ marginTop: 28, opacity: headerIn, transform: `translateY(${interpolate(headerIn, [0, 1], [12, 0])}px)` }}>
            <div style={{ fontSize: 18, color: theme.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Price history
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, color: theme.ink, marginTop: 4, letterSpacing: -1 }}>
              5 years of NADAC pricing
            </div>
          </div>

          <div style={{ marginTop: 24, background: theme.primarySoft, borderRadius: 16, padding: 20, border: `1px solid ${theme.divider}` }}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              {/* grid */}
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={padX} y1={padY + (i * innerH) / 3} x2={padX + innerW} y2={padY + (i * innerH) / 3} stroke={theme.divider} strokeWidth={1} />
              ))}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.primary} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#areaGrad)" />
              <path d={d} fill="none" stroke={theme.primary} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              {/* end dot */}
              {drawProgress >= 1 && (
                <>
                  <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={14 * dotIn} fill={theme.primary} />
                  <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={6 * dotIn} fill={theme.white} />
                </>
              )}
              {/* x labels */}
              {MONTHS.map((m, i) => (
                m ? (
                  <text key={i} x={padX + (i / (POINTS.length - 1)) * innerW} y={H - 8} textAnchor="middle" fill={theme.muted} fontSize="16" fontWeight="600">
                    {m}
                  </text>
                ) : null
              ))}
            </svg>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ background: theme.accent, color: theme.white, padding: "10px 18px", borderRadius: 999, fontSize: 22, fontWeight: 700 }}>
              ↓ 56% since 2021
            </div>
            <div style={{ fontSize: 22, color: theme.inkSoft, fontWeight: 500 }}>weekly NADAC updates</div>
          </div>
        </div>
      </BrowserChrome>
      <Caption text="3. See 5 years of price history" delay={10} />
    </AbsoluteFill>
  );
};
