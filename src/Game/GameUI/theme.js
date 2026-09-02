/*! Open Historia — portions (crimson & bone theme tokens) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */

// Crimson & bone theme tokens. JS constants (not CSS vars) because several
// call sites concatenate real values — `rgba(${ACCENT_RGB}, …)`, `${ACCENT}cc`,
// `color-mix(… ${ACCENT} …)` — which `var()` strings cannot feed. `styles.css`
// mirrors these values in its `:root` block for plain-CSS consumers; keep the
// two in sync.

// Warm near-black surfaces (no blue cast)
export const BG = "#0a0605";
export const SURFACE = "rgba(12, 8, 8, 0.92)";
export const SURFACE_RAISED = "rgba(22, 15, 13, 0.92)";
export const SURFACE_SUNKEN = "rgba(0, 0, 0, 0.28)";

// Bone / parchment text
export const TEXT = "#e8ddc8";
export const TEXT_BRIGHT = "#f5eeda";
export const TEXT_DIM = "rgba(232, 221, 200, 0.68)";
export const TEXT_FAINT = "rgba(232, 221, 200, 0.45)";

// Blood-crimson accent
export const ACCENT = "#8a0303";
export const ACCENT_BRIGHT = "#c02020";
export const ACCENT_SOFT = "rgba(138, 3, 3, 0.55)";
export const ACCENT_FAINT = "rgba(138, 3, 3, 0.28)";
export const ACCENT_GLOW = "rgba(192, 32, 32, 0.45)";
export const ACCENT_RGB = "138, 3, 3";
export const ACCENT_BRIGHT_RGB = "192, 32, 32";

// Borders
export const BORDER = "rgba(232, 221, 200, 0.12)";
export const BORDER_STRONG = "rgba(232, 221, 200, 0.2)";
export const BORDER_ACCENT = "rgba(138, 3, 3, 0.8)";

// Type
export const FONT_DISPLAY = '"Cinzel", Georgia, serif';
export const FONT_SERIF = '"EB Garamond", Georgia, serif';
export const FONT_UI = '"Segoe UI", system-ui, sans-serif';
