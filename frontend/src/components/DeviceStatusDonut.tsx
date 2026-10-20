import React from 'react';

interface DeviceStatusDonutProps {
  online: number;
  offline: number;
  total: number;
  /** px diameter of the SVG ring. Defaults to 150 */
  size?: number;
}

/**
 * Single circular SVG donut chart for device connectivity status.
 * Green arc  = online devices
 * Orange arc = offline devices
 * Dark arc   = standby / unmonitored
 */
export const DeviceStatusDonut: React.FC<DeviceStatusDonutProps> = ({
  online,
  offline,
  total,
  size = 150,
}) => {
  const onlinePct  = total > 0 ? Math.round((online  / total) * 100) : 0;

  // SVG geometry
  const cx     = size / 2;
  const cy     = size / 2;
  const stroke = size * 0.12;           // ring thickness
  const r      = cx - stroke / 2 - 5;  // radius of ring centre-line
  const circum = 2 * Math.PI * r;

  const GAP = 3; // px gap between arc segments

  // Arc lengths
  const onlineLen  = total > 0 ? (online  / total) * circum : 0;
  const offlineLen = total > 0 ? (offline / total) * circum : 0;

  // dashoffset to position each arc correctly (start at top = -90°)
  // We stack: online → offline → standby, each with a small gap
  const offlineStart  = onlineLen  + GAP;
  const standbyStart  = offlineStart + offlineLen + GAP;
  const standbyLen    = Math.max(0, circum - onlineLen - offlineLen - GAP * 2);

  // Colors
  const GREEN  = '#10b981';
  const ORANGE = '#f97316';
  const DIM    = '#334155';   // standby arc
  const BG     = '#0f172a';

  // Text sizing — kept small enough to stay inside inner circle
  const innerR     = r - stroke / 2;          // inner edge radius
  const maxTextW   = innerR * 1.7;            // approx usable text width

  const pctSize    = Math.floor(size * 0.19); // e.g. 28px at size=150
  const labelSize  = Math.floor(size * 0.085);
  const countSize  = Math.floor(size * 0.075);

  // Vertical positions — spread across the inner circle
  const pctY   = cy - size * 0.07;
  const labelY = cy + size * 0.07;
  const countY = cy + size * 0.175;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${onlinePct}% online — ${online} online, ${offline} offline of ${total} total`}
    >
      {/* Dark background */}
      <circle cx={cx} cy={cy} r={cx - 1} fill={BG} />

      {/* Track ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={DIM} strokeWidth={stroke} opacity={0.35} />

      {/* Standby arc (dim) */}
      {standbyLen > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={DIM}
          strokeWidth={stroke}
          strokeDasharray={`${standbyLen - GAP} ${circum - standbyLen + GAP}`}
          transform={`rotate(${-90 + (standbyStart / circum) * 360}, ${cx}, ${cy})`}
          strokeLinecap="butt"
        />
      )}

      {/* Offline arc (orange) */}
      {offlineLen > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={ORANGE}
          strokeWidth={stroke}
          strokeDasharray={`${offlineLen - GAP} ${circum - offlineLen + GAP}`}
          transform={`rotate(${-90 + (offlineStart / circum) * 360}, ${cx}, ${cy})`}
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 4px #f97316aa)' }}
        />
      )}

      {/* Online arc (green) — starts at top */}
      {onlineLen > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={GREEN}
          strokeWidth={stroke}
          strokeDasharray={`${onlineLen - GAP} ${circum - onlineLen + GAP}`}
          transform={`rotate(-90, ${cx}, ${cy})`}
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 5px #10b981aa)' }}
        />
      )}

      {/* Centre: percentage */}
      <text
        x={cx}
        y={pctY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize={pctSize}
      >
        {onlinePct}
        <tspan fontSize={Math.floor(pctSize * 0.55)} fill="#94a3b8" dy={-Math.floor(pctSize * 0.2)}>%</tspan>
      </text>

      {/* Centre: ONLINE label */}
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={GREEN}
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize={labelSize}
        letterSpacing="0.06em"
      >
        ONLINE
      </text>

      {/* Centre: count */}
      <text
        x={cx}
        y={countY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#64748b"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontWeight="500"
        fontSize={countSize}
      >
        {online}/{total} devices
      </text>
    </svg>
  );
};
