export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
} as const;

export const shadows = {
  default: "0 8px 24px -12px rgba(0, 0, 0, 0.18)",
  elevated: "0 18px 50px -18px rgba(0, 0, 0, 0.22)",
} as const;

export const layout = {
  sidebarWidth: "240px",
  headerHeight: "64px",
  bottomNavHeight: "64px",
  maxContentWidth: "1280px",
  mobileBreakpoint: "768px",
} as const;
