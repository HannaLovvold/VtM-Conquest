/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Shared dark-glass UI constants for the map editor, matching the game's GameUI
// look (rgba(12,8,8,.92) surfaces, blur, bone text, crimson accent #8a0303).

export const ACCENT = "#8a0303";
export const ACCENT_RGB = [138, 3, 3];

export const panelSurface = {
  backgroundColor: "rgba(12, 8, 8, 0.92)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(232,221,200,0.12)",
  borderRadius: "12px",
  color: "#e8ddc8",
  fontFamily: "sans-serif",
  boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
};

export const toolButton = (active, disabled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  minWidth: "34px",
  height: "34px",
  padding: "0 8px",
  background: active ? "rgba(138,3,3,0.55)" : "rgba(232,221,200,0.06)",
  border: active ? "1px solid rgba(138,3,3,0.9)" : "1px solid rgba(232,221,200,0.12)",
  borderRadius: "8px",
  color: disabled ? "rgba(232,221,200,0.3)" : "#e8ddc8",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: "13px",
  fontWeight: 600,
  transition: "background 0.12s, border 0.12s",
});

export const pillButton = (active) => ({
  background: active ? "rgba(138,3,3,0.5)" : "rgba(232,221,200,0.08)",
  border: "1px solid rgba(232,221,200,0.15)",
  borderRadius: "7px",
  color: "#e8ddc8",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
  padding: "5px 9px",
});

export const inputStyle = {
  width: "100%",
  padding: "0.5rem 0.6rem",
  borderRadius: "8px",
  border: "1px solid rgba(232,221,200,0.16)",
  backgroundColor: "rgba(0,0,0,0.28)",
  color: "#e8ddc8",
  fontSize: "0.85rem",
  outline: "none",
  boxSizing: "border-box",
};

export const labelDim = {
  color: "rgba(232,221,200,0.55)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
};
