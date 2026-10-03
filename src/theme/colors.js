import { palette as p } from './palette';

// Layer 2: semantic tokens. Day and Night MUST define identical keys.
const day = {
  background: p.white,
  backgroundElevated: p.white,
  surface: p.sand[50],
  surfaceRaised: p.white,
  surfaceSunken: p.sand[100],
  overlay: 'rgba(23, 22, 19, 0.5)',

  text: p.sand[900],
  textMuted: p.sand[600],
  textAccent: p.ember[700],
  textHighlight: p.violet[600],
  textOnAccent: '#1A0B00',
  textOnHighlight: p.white,
  textOnDanger: p.white,

  border: p.sand[200],
  borderStrong: p.sand[300],
  focusRing: p.ember[600],

  accent: p.ember[500],
  accentSoft: p.ember[50],
  highlight: p.violet[600],
  highlightSoft: p.violet[100],

  success: p.green[700],
  successSoft: p.green[100],
  warning: p.amber[700],
  warningSoft: p.amber[100],
  danger: p.red[700],
  dangerSoft: p.red[100],

  skeleton: p.sand[200],

  auraGradient: [p.gold[400], p.ember[500], p.magenta[500]],
  auraGlow: p.ember[500],
  avatarPalette: [p.ember[100], p.violet[100], p.green[100], p.red[100], p.amber[100]],
};

const night = {
  background: p.ink[950],
  backgroundElevated: p.ink[800],
  surface: p.ink[800],
  surfaceRaised: p.ink[700],
  surfaceSunken: p.ink[900],
  overlay: 'rgba(0, 0, 0, 0.65)',

  text: p.ink[50],
  textMuted: p.ink[300],
  textAccent: p.ember[300],
  textHighlight: p.violet[300],
  textOnAccent: '#1A0B00',
  textOnHighlight: p.white,
  textOnDanger: '#2A0507',

  border: p.ink[600],
  borderStrong: p.ink[500],
  focusRing: p.ember[300],

  accent: p.ember[500],
  accentSoft: 'rgba(255, 122, 26, 0.16)',
  highlight: p.violet[600],
  highlightSoft: 'rgba(124, 92, 255, 0.2)',

  success: p.green[300],
  successSoft: 'rgba(110, 219, 160, 0.14)',
  warning: p.amber[300],
  warningSoft: 'rgba(255, 215, 94, 0.14)',
  danger: p.red[300],
  dangerSoft: 'rgba(255, 138, 142, 0.14)',

  skeleton: p.ink[600],

  auraGradient: [p.gold[400], p.magenta[400], p.violet[500]],
  auraGlow: p.magenta[400],
  avatarPalette: ['#3A2416', '#2A2250', '#143B2A', '#3F1B1E', '#3B2F0F'],
};

export const colors = Object.freeze({ day: Object.freeze(day), night: Object.freeze(night) });