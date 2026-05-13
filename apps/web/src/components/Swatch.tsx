interface SwatchProps {
  kind?: string;
  a: string;
  b: string;
  c: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const common: React.CSSProperties = { width: "100%", height: "100%", display: "block" };

function SwatchArt({ kind, a, b, c }: { kind: string; a: string; b: string; c: string }) {
  switch (kind) {
    case "stripes":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={a}/>
          <g transform="rotate(-22 100 100)">
            {Array.from({ length: 9 }).map((_, i) => (
              <rect key={i} x={-30 + i * 30} y="-50" width="14" height="300"
                fill={i % 2 ? b : c} opacity={i % 2 ? 1 : 0.18}/>
            ))}
          </g>
          <circle cx="155" cy="48" r="32" fill={b} opacity="0.85"/>
        </svg>
      );
    case "rings":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={a}/>
          {[80, 60, 40, 22].map((r, i) => (
            <circle key={i} cx="100" cy="100" r={r} fill="none"
              stroke={i % 2 ? b : c} strokeWidth="6" opacity={0.55 + i * 0.1}/>
          ))}
          <circle cx="100" cy="100" r="10" fill={b}/>
        </svg>
      );
    case "grooves":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={a}/>
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} cx="100" cy="100" r={20 + i * 6} fill="none"
              stroke={c} strokeWidth="1" opacity="0.45"/>
          ))}
          <circle cx="100" cy="100" r="22" fill={b}/>
          <circle cx="100" cy="100" r="3" fill={a}/>
        </svg>
      );
    case "weave":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={b}/>
          <g stroke={a} strokeWidth="2.5" opacity="0.85">
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={"v" + i} x1={i * 15} y1="0" x2={i * 15} y2="200"/>
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={"h" + i} x1="0" y1={i * 15} x2="200" y2={i * 15} opacity="0.35"/>
            ))}
          </g>
          <rect x="40" y="40" width="120" height="120" fill={a} opacity="0.12"/>
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={a}/>
          <g fill={b}>
            {Array.from({ length: 7 }).map((_, r) =>
              Array.from({ length: 7 }).map((_, col) => (
                <rect key={`${r}_${col}`} x={14 + col * 26} y={14 + r * 26} width="20" height="14"
                  rx="3" opacity={((r + col) % 3) ? 0.92 : 0.4}/>
              ))
            )}
          </g>
          <rect x="14" y="170" width="172" height="14" rx="3" fill={b} opacity="0.9"/>
        </svg>
      );
    case "mountain":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={b}/>
          <polygon points="0,160 50,80 90,130 140,40 200,160" fill={a}/>
          <polygon points="0,170 60,110 110,150 160,90 200,170 200,200 0,200" fill={c} opacity="0.85"/>
          <circle cx="160" cy="45" r="20" fill="#fff" opacity="0.55"/>
        </svg>
      );
    case "lens":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={a}/>
          <rect x="32" y="62" width="136" height="80" rx="10" fill="#1a1d23"/>
          <circle cx="100" cy="102" r="32" fill="#0b1014" stroke={b} strokeWidth="3"/>
          <circle cx="100" cy="102" r="18" fill={c} opacity="0.5"/>
          <circle cx="92" cy="94" r="6" fill="#fff" opacity="0.4"/>
          <rect x="148" y="48" width="20" height="10" rx="2" fill={b}/>
        </svg>
      );
    case "knit":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={b}/>
          {Array.from({ length: 12 }).map((_, r) =>
            Array.from({ length: 12 }).map((_, col) => (
              <path key={`${r}_${col}`}
                d={`M ${col * 18 + 4},${r * 18 + 9} q 5,-9 9,0 q 5,9 9,0`}
                fill="none" stroke={a} strokeWidth="2" opacity={r % 2 ? 0.7 : 1}/>
            ))
          )}
        </svg>
      );
    case "tessera":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <rect width="200" height="200" fill={b}/>
          {Array.from({ length: 10 }).map((_, r) =>
            Array.from({ length: 10 }).map((_, col) => {
              const seed = (r * 11 + col * 7) % 100;
              return (
                <rect key={`${r}_${col}`}
                  x={col * 20 + 2} y={r * 20 + 2} width="16" height="16"
                  fill={seed > 80 ? a : seed > 55 ? c : b}
                  opacity={seed > 80 ? 0.85 : 0.32}/>
              );
            })
          )}
        </svg>
      );
    case "orb":
      return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={common}>
          <defs>
            <radialGradient id="orb-grad" cx="0.4" cy="0.35">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
              <stop offset="40%" stopColor={b} stopOpacity="0.7"/>
              <stop offset="100%" stopColor={a}/>
            </radialGradient>
          </defs>
          <rect width="200" height="200" fill={c}/>
          <circle cx="100" cy="100" r="74" fill="url(#orb-grad)"/>
        </svg>
      );
    default:
      return (
        <div style={{ ...common, background: `linear-gradient(135deg, ${a}, ${b})` }}/>
      );
  }
}

export default function Swatch({ kind = "stripes", a, b, c, label, className, style }: SwatchProps) {
  return (
    <div className={`ss-swatch${className ? " " + className : ""}`} style={style}>
      <SwatchArt kind={kind} a={a} b={b} c={c}/>
      {label && (
        <div style={{
          position: "absolute", left: 12, top: 12, padding: "3px 8px",
          background: "rgba(11,16,20,0.7)", color: "#fff",
          borderRadius: 999, fontSize: 10, fontFamily: "var(--font-display)",
          fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

const SWATCH_KINDS = ["stripes", "rings", "grooves", "weave", "grid", "mountain", "tessera", "lens", "knit", "orb"];
const SWATCH_PALETTES = [
  { a: "#06143c", b: "#f06a2c", c: "#1855e0" },
  { a: "#0b1014", b: "#1855e0", c: "#f4f6f8" },
  { a: "#1a1d23", b: "#f06a2c", c: "#f4f6f8" },
  { a: "#c2410c", b: "#fcecca", c: "#5b1c00" },
  { a: "#0e5b3a", b: "#22c55e", c: "#b87000" },
  { a: "#5b21b6", b: "#7c3aed", c: "#db2777" },
  { a: "#0b1014", b: "#94ccff", c: "#0b3fad" },
  { a: "#1e4fb0", b: "#60a5fa", c: "#1855e0" },
  { a: "#0b3fad", b: "#f06a2c", c: "#0b1014" },
  { a: "#4a1b00", b: "#f06a2c", c: "#ffd2b3" },
  { a: "#1a1d23", b: "#c8d0d8", c: "#0b3fad" },
  { a: "#168a4a", b: "#d8f0e2", c: "#0b1014" },
];

export function getProductSwatch(id: string, index: number): { kind: string; a: string; b: string; c: string } {
  const hash = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const kind = SWATCH_KINDS[hash % SWATCH_KINDS.length] ?? "stripes";
  const palette = SWATCH_PALETTES[index % SWATCH_PALETTES.length] ?? SWATCH_PALETTES[0]!;
  return { kind, ...palette };
}
