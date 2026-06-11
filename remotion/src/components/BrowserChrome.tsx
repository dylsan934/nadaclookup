import { theme } from "../theme";

export const BrowserChrome: React.FC<{ url: string; children: React.ReactNode; width?: number; height?: number }> = ({
  url,
  children,
  width = 1500,
  height = 760,
}) => {
  return (
    <div
      style={{
        width,
        height,
        background: theme.white,
        borderRadius: 22,
        boxShadow: "0 40px 100px rgba(11, 31, 61, 0.18), 0 8px 24px rgba(11,31,61,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 46, background: "#F1F4F9", display: "flex", alignItems: "center", padding: "0 18px", gap: 16, borderBottom: `1px solid ${theme.divider}` }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#FEBC2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#28C840" }} />
        </div>
        <div
          style={{
            flex: 1,
            background: theme.white,
            borderRadius: 8,
            height: 28,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            fontSize: 14,
            color: theme.muted,
            border: `1px solid ${theme.divider}`,
          }}
        >
          🔒 {url}
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  );
};

export const Logo: React.FC<{ size?: number; dark?: boolean }> = ({ size = 32, dark = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div
      style={{
        width: size * 1.6,
        height: size * 0.7,
        borderRadius: 999,
        background: dark ? theme.white : theme.primary,
        border: dark ? `2px solid ${theme.white}` : "none",
        boxShadow: dark ? "none" : "0 4px 12px rgba(11,95,204,0.3)",
      }}
    />
    <span style={{ fontSize: size * 0.7, fontWeight: 700, color: dark ? theme.white : theme.ink, letterSpacing: -0.5 }}>
      NADAC Lookup
    </span>
  </div>
);
