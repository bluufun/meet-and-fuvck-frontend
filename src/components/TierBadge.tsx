"use client";

import { useId } from "react";
import { TIER_META, type BoostTier } from "@/lib/boostTiers";

// ─────────────────────────────────────────────────────────────────────────────
// Premium tier badge: a scalloped certificate rosette with a notched ribbon
// tail, concentric rim rings and a brushed-metal face. One drawing, three
// colourways — each tier is the same medal in its own colour:
//   Elite Plus → gold   ·   Elite → red   ·   Fresher → blue
// Pure SVG (no raster asset), so it stays crisp at 14px and at 140px.
// ─────────────────────────────────────────────────────────────────────────────

type Metal = {
  rim: [string, string, string]; // rosette body, light → mid → dark
  face: [string, string]; // face centre → edge
  ring: string; // engraved ring colour
  edge: string; // outer outline
  emblem: [string, string]; // star highlight / shade
  ribbon: [string, string]; // ribbon top → bottom
};

const METALS: Record<Exclude<BoostTier, "regular">, Metal> = {
  elite_plus: {
    rim: ["#FBE58D", "#E8BC3E", "#C48A12"],
    face: ["#F6E391", "#DDB84A"],
    ring: "#D9920B",
    edge: "#A8730A",
    emblem: ["#FFF3C2", "#B8860B"],
    ribbon: ["#F3D164", "#D29C1E"],
  },
  elite: {
    rim: ["#FF8A8A", "#E23B3B", "#A81818"],
    face: ["#FF8F8F", "#CC2B2B"],
    ring: "#8F1212",
    edge: "#7E1010",
    emblem: ["#FFD1D1", "#8F1212"],
    ribbon: ["#EE5A5A", "#B31F1F"],
  },
  fresher: {
    rim: ["#8FC2FF", "#3B82F6", "#1D4ED8"],
    face: ["#93C5FD", "#2F6FE0"],
    ring: "#1E40AF",
    edge: "#1E3A8A",
    emblem: ["#DBEAFE", "#1E3A8A"],
    ribbon: ["#5C9BFA", "#2250C4"],
  },
};

// Scalloped rosette outline — a circle whose radius ripples 16 times.
const CX = 50;
const CY = 50;
const LOBES = 16;
const ROSETTE_PATH = (() => {
  const steps = 192;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = 42.6 + 2.9 * Math.cos(LOBES * t);
    const x = (CX + r * Math.cos(t)).toFixed(2);
    const y = (CY + r * Math.sin(t)).toFixed(2);
    d += `${i === 0 ? "M" : "L"}${x} ${y} `;
  }
  return d + "Z";
})();

// Five-point star for the embossed centre mark.
const STAR_PATH = (() => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 13.5 : 5.6;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i === 0 ? "M" : "L"}${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)} `;
  }
  return d + "Z";
})();

const ASPECT = 128 / 100;

export function TierBadge({
  tier,
  size = 24,
  className = "",
}: {
  tier: BoostTier;
  /** Width in px — height follows the medal's proportions. */
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  if (tier === "regular") return null;
  const m = METALS[tier];
  const id = (n: string) => `${n}-${uid}`;

  return (
    <svg
      role='img'
      aria-label={`${TIER_META[tier].label} badge`}
      viewBox='0 0 100 128'
      width={size}
      height={Math.round(size * ASPECT)}
      className={`shrink-0 ${className}`}
      style={{ filter: "drop-shadow(0 1.5px 2px rgba(0,0,0,0.38))" }}>
      <defs>
        <linearGradient id={id("rim")} x1='0.12' y1='0' x2='0.88' y2='1'>
          <stop offset='0' stopColor={m.rim[0]} />
          <stop offset='0.5' stopColor={m.rim[1]} />
          <stop offset='1' stopColor={m.rim[2]} />
        </linearGradient>
        <linearGradient id={id("rib")} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor={m.ribbon[0]} />
          <stop offset='1' stopColor={m.ribbon[1]} />
        </linearGradient>
        <linearGradient id={id("cast")} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#000' stopOpacity='0.32' />
          <stop offset='1' stopColor='#000' stopOpacity='0' />
        </linearGradient>
        <radialGradient id={id("face")} cx='0.5' cy='0.45' r='0.62'>
          <stop offset='0' stopColor={m.face[0]} />
          <stop offset='1' stopColor={m.face[1]} />
        </radialGradient>
        <linearGradient id={id("sheen")} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor='#fff' stopOpacity='0.38' />
          <stop offset='0.5' stopColor='#fff' stopOpacity='0' />
          <stop offset='1' stopColor='#000' stopOpacity='0.14' />
        </linearGradient>
        <linearGradient id={id("star")} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor={m.emblem[0]} />
          <stop offset='1' stopColor={m.emblem[1]} />
        </linearGradient>
      </defs>

      {/* Ribbon tail (behind the rosette) */}
      <path
        d='M30 62 L30 125 L50 108 L70 125 L70 62 Z'
        fill={`url(#${id("rib")})`}
        stroke={m.edge}
        strokeWidth='0.9'
        strokeLinejoin='round'
      />
      <path
        d='M33.5 64 L33.5 118 L50 103.5 L66.5 118 L66.5 64'
        fill='none'
        stroke={m.ring}
        strokeWidth='0.9'
        strokeOpacity='0.75'
        strokeLinejoin='round'
      />
      {/* Shadow the rosette casts onto the ribbon */}
      <path
        d='M30 86 L70 86 L70 112 L30 112 Z'
        fill={`url(#${id("cast")})`}
        clipPath={`url(#${id("ribClip")})`}
      />
      <clipPath id={id("ribClip")}>
        <path d='M30 62 L30 125 L50 108 L70 125 L70 62 Z' />
      </clipPath>

      {/* Scalloped rosette */}
      <path
        d={ROSETTE_PATH}
        fill={`url(#${id("rim")})`}
        stroke={m.edge}
        strokeWidth='1'
        strokeLinejoin='round'
      />
      {/* Bevel highlight just inside the scalloped edge */}
      <path
        d={ROSETTE_PATH}
        fill='none'
        stroke='#fff'
        strokeOpacity='0.45'
        strokeWidth='0.7'
        transform={`translate(${CX} ${CY}) scale(0.955) translate(${-CX} ${-CY})`}
      />

      {/* Twin engraved rings */}
      <circle
        cx={CX}
        cy={CY}
        r='35'
        fill='none'
        stroke={m.ring}
        strokeWidth='1.5'
      />
      <circle
        cx={CX}
        cy={CY}
        r='32.4'
        fill='none'
        stroke={m.ring}
        strokeWidth='0.8'
        strokeOpacity='0.85'
      />

      {/* Brushed-metal face */}
      <circle cx={CX} cy={CY} r='30.6' fill={`url(#${id("face")})`} />
      <circle cx={CX} cy={CY} r='30.6' fill={`url(#${id("sheen")})`} />
      <circle
        cx={CX}
        cy={CY}
        r='30.6'
        fill='none'
        stroke={m.ring}
        strokeOpacity='0.45'
        strokeWidth='0.7'
      />

      {/* Embossed star: shade offset down-right, highlight on top */}
      <path
        d={STAR_PATH}
        fill={m.emblem[1]}
        fillOpacity='0.55'
        transform='translate(0.9 1.1)'
      />
      <path
        d={STAR_PATH}
        fill={`url(#${id("star")})`}
        stroke={m.emblem[1]}
        strokeOpacity='0.55'
        strokeWidth='0.5'
        strokeLinejoin='round'
      />
    </svg>
  );
}

const CHIP_STYLES: Record<
  Exclude<BoostTier, "regular">,
  { light: string }
> = {
  elite_plus: {
    light: "bg-[#FFF3CF] text-[#8A5A00] ring-1 ring-[#E8BC3E]/60",
  },
  elite: {
    light: "bg-red-50 text-red-700 ring-1 ring-red-300/70",
  },
  fresher: {
    light: "bg-blue-50 text-blue-700 ring-1 ring-blue-300/70",
  },
};

/**
 * Medal + tier name. The medal overlaps the left end of the label pill, so the
 * badge reads as a real hanging award rather than a flat tag.
 *   overlay → for use on photos / dark surfaces (glass pill)
 *   light   → for use on white / light surfaces (tinted pill)
 */
export default function TierChip({
  tier,
  size = "md",
  variant = "overlay",
  className = "",
}: {
  tier: BoostTier;
  size?: "sm" | "md" | "lg";
  variant?: "overlay" | "light";
  className?: string;
}) {
  if (tier === "regular") return null;
  const label = TIER_META[tier].label;
  const dims = {
    sm: {
      medal: 20,
      text: "text-[9.5px]",
      pad: "py-[2px] pl-[15px] pr-2",
      overlap: "-mr-[11px]",
    },
    md: {
      medal: 24,
      text: "text-[10.5px]",
      pad: "py-[3px] pl-[18px] pr-2.5",
      overlap: "-mr-[13px]",
    },
    lg: {
      medal: 30,
      text: "text-xs",
      pad: "py-1 pl-[22px] pr-3",
      overlap: "-mr-4",
    },
  }[size];

  const pill =
    variant === "overlay"
      ? `bg-gradient-to-br ${TIER_META[tier].overlayGradient} text-white ring-1 ring-white/25`
      : CHIP_STYLES[tier].light;

  return (
    <span
      className={`inline-flex shrink-0 select-none items-center ${className}`}>
      <TierBadge
        tier={tier}
        size={dims.medal}
        className={`relative z-0 ${dims.overlap}`}
      />
      <span
        className={`whitespace-nowrap rounded-full font-bold leading-none tracking-wide ${dims.text} ${dims.pad} ${pill}`}>
        {label}
      </span>
    </span>
  );
}
