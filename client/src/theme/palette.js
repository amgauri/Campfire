// Layer 1: raw color primitives. ONLY colors.js may import this file.
export const palette = Object.freeze({
  white: '#FFFFFF',
  sand: {
    50: '#F8F7F4', 100: '#F0EFEA', 200: '#E3E1DA', 300: '#CFCCC2',
    500: '#8B887E', 600: '#6A675E', 900: '#171613',
  },
  ink: {
    950: '#07070D', 900: '#0C0C16', 800: '#141421', 700: '#1E1E2F',
    600: '#2B2B40', 500: '#3D3D57', 300: '#8E8EAA', 50: '#F3F3FA',
  },
  ember: { 50: '#FFF3EA', 100: '#FFE1CB', 300: '#FFB27A', 500: '#FF7A1A', 600: '#E8630A', 700: '#B84B05' },
  violet: { 100: '#ECE6FF', 300: '#B7A3FF', 500: '#7C5CFF', 600: '#6340E8' },
  magenta: { 400: '#FF4FA3', 500: '#F0288A' },
  gold: { 400: '#FFC857' },
  green: { 100: '#DDF6E8', 300: '#6EDBA0', 700: '#0F7A45' },
  red: { 100: '#FDE3E4', 300: '#FF8A8E', 700: '#B5262B' },
  amber: { 100: '#FFF1CC', 300: '#FFD75E', 700: '#8A5F00' },
});