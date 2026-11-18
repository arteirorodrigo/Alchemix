import { hashString } from '../core/rng'

// Cores de docs/design/prototipo-lovable/tema.css (oklch) convertidas para hex sRGB.
export const C = {
  ink: 0x2c1a2b,
  background: 0x58cef8,
  card: 0xf9eed1,
  primary: 0x73cb51,
  primaryFg: 0xfdfcf5,
  primaryShade: 0x2b8a36,
  secondary: 0x21b3ed,
  secondaryShade: 0x006bbb,
  accent: 0xffb330,
  accentShade: 0xdb640e,
  berry: 0xf05465,
  berryShade: 0xa4283a,
  paperShade: 0xdcc49c,
  earth: 0x9c6141,
  earthDark: 0x713d2a,
  muted: 0xe7d6b3,
  mutedFg: 0x734e39,
  overlay: 0x251323,
} as const

export const FONT = '"Pixelify Sans", monospace'
export const css = (n: number) => '#' + n.toString(16).padStart(6, '0')

export interface ElementColor { fill: number; shade: number }

// --el-* do protótipo (o id `broto` usa as cores de `--el-planta`).
const PROTO: Record<string, ElementColor> = {
  agua: { fill: 0xa6e2fb, shade: 0x50a9d9 },
  pedra: { fill: 0xc9d2de, shade: 0x8893a5 },
  fogo: { fill: 0xffd791, shade: 0xeb883b },
  broto: { fill: 0xbbefb0, shade: 0x61b565 },
  barro: { fill: 0xe7c3a2, shade: 0xb27f5c },
  tijolo: { fill: 0xfdbcab, shade: 0xcf6b5b },
  vapor: { fill: 0xe4f5fb, shade: 0x97bed2 },
  flor: { fill: 0xffd2e7, shade: 0xdf84a8 },
  casinha: { fill: 0xfde89a, shade: 0xe1a035 },
  'arco-iris': { fill: 0xb7f2ed, shade: 0x48b7bd },
}

/** oklch (L 0..1, C, h em graus) → inteiro 0xRRGGBB, com corte para o gamut sRGB. */
export function oklchToHex(L: number, Cr: number, h: number): number {
  const a = Cr * Math.cos((h * Math.PI) / 180)
  const b = Cr * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const [r, g, bl] = lin.map((x) => {
    const v = Math.min(1, Math.max(0, x))
    const e = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
    return Math.round(e * 255)
  })
  return (r << 16) | (g << 8) | bl
}

// Luminosidade/croma médios dos --el-* do protótipo (fundo ≈ 89% .07, sombra ≈ 70% .11).
export function elementColor(id: string): ElementColor {
  const p = PROTO[id]
  if (p) return p
  const hue = hashString(id) % 360
  return { fill: oklchToHex(0.89, 0.07, hue), shade: oklchToHex(0.7, 0.11, hue) }
}
