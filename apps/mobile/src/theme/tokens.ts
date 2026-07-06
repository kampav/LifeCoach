// OLED-optimized design system — Cyberpunk HUD aesthetic
export const Colors = {
  // Base (pure OLED black — saves battery on AMOLED)
  bg:          "#000000",
  surface0:    "#07070F",
  surface1:    "#0C0C1A",
  surface2:    "#121224",
  surface3:    "#1A1A30",
  border:      "rgba(255,255,255,0.06)",
  borderHover: "rgba(110,231,255,0.25)",

  // Accent system
  primary:     "#6EE7FF", // Electric cyan
  win:         "#00FF94", // Neon green
  miss:        "#FF4060", // Crimson
  gold:        "#FFB800", // Amber (streaks/countdown)
  violet:      "#9D7AFF", // Coach/AI sections
  orange:      "#FF7A3D", // Spirit
  
  // Metric colors
  health:      "#00FF94",
  mind:        "#6EE7FF",
  launchpad:   "#9D7AFF",
  innerCircle: "#FF4060",
  engine:      "#FFB800",
  spirit:      "#FF7A3D",

  // Text
  textPrimary:   "#F0F4FF",
  textSecondary: "#5A6A8A",
  textData:      "#A0AEC0",
  textDisabled:  "#2A3050",
};

export const Typography = {
  // Space Grotesk for UI, JetBrains Mono for data, Lora for coach text
  ui:    "SpaceGrotesk",
  data:  "JetBrainsMono",
  coach: "Lora",
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Radius = {
  sm:  8,
  md:  14,
  lg:  20,
  xl:  28,
  full: 999,
};

export const Shadow = {
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
};
