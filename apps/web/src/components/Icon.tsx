interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  className?: string;
  "aria-label"?: string;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

const paths: Record<string, React.ReactNode> = {
  bag:      <><path d="M5 7h14l-1.2 12.4a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.6L5 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></>,
  bolt:     <path d="M13 2 5 14h6l-2 8 9-13h-6l1-7Z"/>,
  arrow:    <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  arrowL:   <><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></>,
  user:     <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  search:   <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  star:     <path d="M12 3.5 14.4 8.7l5.7.5-4.3 3.8 1.3 5.6L12 15.8l-5.1 2.8 1.3-5.6L3.9 9.2l5.7-.5L12 3.5Z"/>,
  heart:    <path d="M12 20s-7-4.5-9.5-9.2C.9 7.7 3 4 6.4 4c2 0 3.5 1.2 4.4 2.6.9-1.4 2.4-2.6 4.4-2.6 3.4 0 5.5 3.7 3.9 6.8C19 15.5 12 20 12 20Z"/>,
  cart:     <><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 12h11l2-8H6"/></>,
  check:    <path d="m5 13 4 4 10-10"/>,
  x:        <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
  plus:     <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  minus:    <path d="M5 12h14"/>,
  trash:    <><path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="m6 7 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/></>,
  pkg:      <><path d="M3 7 12 3l9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></>,
  home:     <><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></>,
  truck:    <><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></>,
  refresh:  <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
  shield:   <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/>,
  clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  flame:    <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 8 7 12 3Z"/>,
  spark:    <><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m5.6 18.4 2.8-2.8"/><path d="m15.6 8.4 2.8-2.8"/></>,
  moon:     <path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z"/>,
  sun:      <><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9 6.3 6.3"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/></>,
  pin:      <><path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></>,
  chart:    <><path d="M4 4v16h16"/><path d="m7 14 4-4 3 3 5-5"/></>,
  layers:   <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 14 9 5 9-5"/></>,
  edit:     <><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="m18.5 2.5 2 2L12 13l-4 1 1-4 8.5-8.5Z"/></>,
  mail:     <><rect width="20" height="14" x="2" y="5" rx="2"/><path d="m2 7 10 7 10-7"/></>,
};

export default function Icon({ name, size = 18, stroke = 1.6, style, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      {...rest}
    >
      {paths[name] ?? null}
    </svg>
  );
}
