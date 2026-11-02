// Midnight design tokens — implemented exactly from the spec. Dark-only app:
// there is no light mode in this spec, so every screen sits on #0F0F11.
export const colors = {
  background: '#0F0F11',
  surface: '#1A1A1C',
  surfaceAlt: '#27272A',
  onSurface: '#FAFAFA',
  onSurfaceVariant: '#A1A1AA',
  border: '#3F3F46',
  primary: '#F7A5A5',
  onPrimary: '#1A1A1A',
  secondary: '#8E99F3',
  onSecondary: '#1A1A1A',
  accent: '#FCE570',
  onAccent: '#1A1A1A',
  success: '#4ADE80',
  error: '#EF4444',
  chartViolet: '#C084FC',
  chartCoral: '#FF8577',
} as const;

// Font families (loaded in App.tsx via expo-font).
// REALITY CHECK: Space Grotesk ships max weight 700, not 900 — the spec's
// 900 is unattainable, so display/numerals use SpaceGrotesk_700Bold and are
// large rather than heavier. No weight 400/600 is used anywhere: numerals
// and headlines 700, labels 700, body 500.
export const fonts = {
  grotesk: 'SpaceGrotesk_700Bold',
  jakartaBold: 'PlusJakartaSans_700Bold',
  jakartaMedium: 'PlusJakartaSans_500Medium',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const radii = { sm: 4, md: 12, lg: 16, xl: 24, full: 9999 } as const;
export const spacing = { gutter: 16, cardPadding: 20, sectionGap: 16 } as const;

/** Uppercase wide-tracked label style (spec: ~0.12em tracking). */
export const labelStyle = {
  fontFamily: fonts.jakartaBold,
  textTransform: 'uppercase' as const,
  letterSpacing: 1.4,
};
