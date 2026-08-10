import React from "react";


type IconProps = { size?: number };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const WhiskyIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M12 14h16l-2 18a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z" />
    <circle cx="18" cy="24" r="2" />
    <circle cx="23" cy="27" r="2" />
    <path d="M23 14c1-3 3-5 5-6" />
    <path d="M27 8c1 1 1 2 0 3" />
  </svg>
);

export const RonIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M17 6h6v5l3 3v18a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V14l3-3z" />
    <path d="M15 20h10" />
  </svg>
);

export const VodkaIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M16 5h8v6l2 2v19a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V13l2-2z" />
    <path d="M14 24h12" />
    <path d="M19 13v4M21 13v4" />
  </svg>
);

export const TequilaIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M13 13h14l-2 19a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2z" />
    <path d="M22 13c1.5-2.5 3-4 5-4.5" />
  </svg>
);

export const VinoIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M14 6h12c0 7-2 11-6 11s-6-4-6-11z" />
    <path d="M20 17v10" />
    <path d="M14 32h12" />
    <path d="M20 27c-4 0-6 2-6 5h12c0-3-2-5-6-5z" />
  </svg>
);

export const ChampanaIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M17 5c1 6-1 9-1 13s2 6 4 6 4-2 4-6-2-7-1-13z" />
    <path d="M20 24v10" />
    <path d="M15 34h10" />
    <circle cx="19" cy="12" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="21" cy="16" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="19.5" cy="20" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const CervezaIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M12 14h14v16a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" />
    <path d="M26 17h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3" />
    <path d="M12 11c0-2 2-3 4-2 1-2 4-2 5 0 2-1 4 0 4 2" />
    <path d="M15 19h8" />
  </svg>
);

export const CoctelesIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M10 9h20l-9 12v10" />
    <path d="M15 34h10" />
    <path d="M12 12h16" />
  </svg>
);

export const NacionalesIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <path d="M13 12h6v6l1 1v13a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 12 32V19l1-1z" />
    <path d="M15 8h2v4h-2z" />
    <path d="M22 16h5v6l1 1v9a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 21 32v-9l1-1z" />
    <path d="M24 13h1.5v3H24z" />
  </svg>
);

export const ImportadosIcon: React.FC<IconProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" {...base}>
    <circle cx="15" cy="19" r="8" />
    <path d="M7 19h16M15 11c2 2.5 2 13.5 0 16M15 11c-2 2.5-2 13.5 0 16" />
    <path d="M25 12h5v5l2 2v13a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 23 32V19l2-2z" />
  </svg>
);