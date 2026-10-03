// System font for now. If the team picks a brand font, add expo-font later and
// set fontFamily here ONCE. On Android, custom fonts need one family per weight.
export const typography = Object.freeze({
  display:    { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
  title:      { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  heading:    { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body:       { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  label:      { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption:    { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  overline:   { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1 },
});