import type Phaser from 'phaser'

type G = Phaser.GameObjects.Graphics

// Ícones de traço grosso desenhados à mão (equivalentes aos ícones de linha do protótipo).

export function arrowLeft(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(3, color, 1)
  g.lineBetween(x - s / 2, y, x + s / 2, y)
  g.lineBetween(x - s / 2, y, x - s / 8, y - s * 0.38)
  g.lineBetween(x - s / 2, y, x - s / 8, y + s * 0.38)
}

export function gear(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(3, color, 1)
  const r = s * 0.3
  g.strokeCircle(x, y, r)
  g.strokeCircle(x, y, s * 0.1)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    g.lineBetween(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * s * 0.48, y + Math.sin(a) * s * 0.48)
  }
}

export function book(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(3, color, 1)
  const h = s * 0.62
  g.beginPath()
  g.moveTo(x, y - h / 2 + 3).lineTo(x - s / 2, y - h / 2).lineTo(x - s / 2, y + h / 2).lineTo(x, y + h / 2 + 3)
  g.lineTo(x + s / 2, y + h / 2).lineTo(x + s / 2, y - h / 2).lineTo(x, y - h / 2 + 3).lineTo(x, y + h / 2 + 3)
  g.strokePath()
}

export function tv(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(2, color, 1)
  g.strokeRect(x - s / 2, y - s * 0.3, s, s * 0.65)
  g.lineBetween(x - s * 0.2, y - s * 0.55, x, y - s * 0.3)
  g.lineBetween(x + s * 0.2, y - s * 0.55, x, y - s * 0.3)
}

export function bulb(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(3, color, 1)
  g.strokeCircle(x, y - s * 0.12, s * 0.3)
  g.lineBetween(x - s * 0.14, y + s * 0.3, x + s * 0.14, y + s * 0.3)
  g.lineBetween(x - s * 0.1, y + s * 0.45, x + s * 0.1, y + s * 0.45)
}

export function undoArrow(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(3, color, 1)
  g.beginPath()
  g.arc(x + s * 0.05, y + s * 0.05, s * 0.32, Math.PI * 1.1, Math.PI * 2.4, false)
  g.strokePath()
  g.lineBetween(x - s * 0.42, y - s * 0.2, x - s * 0.3, y + s * 0.12)
  g.lineBetween(x - s * 0.42, y - s * 0.2, x - s * 0.08, y - s * 0.16)
}

export function plus(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(4, color, 1)
  g.lineBetween(x - s / 2, y, x + s / 2, y)
  g.lineBetween(x, y - s / 2, x, y + s / 2)
}

export function star(g: G, x: number, y: number, r: number, fill: number, stroke: number, lw = 3): void {
  const pts: Phaser.Types.Math.Vector2Like[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.45
    pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr })
  }
  g.fillStyle(fill, 1).fillPoints(pts, true)
  g.lineStyle(lw, stroke, 1).strokePoints(pts, true)
}

export function playTriangle(g: G, x: number, y: number, s: number, color: number): void {
  g.fillStyle(color, 1).fillTriangle(x - s * 0.4, y - s / 2, x - s * 0.4, y + s / 2, x + s * 0.5, y)
}

export function close(g: G, x: number, y: number, s: number, color: number): void {
  g.lineStyle(3, color, 1)
  g.lineBetween(x - s / 2, y - s / 2, x + s / 2, y + s / 2)
  g.lineBetween(x - s / 2, y + s / 2, x + s / 2, y - s / 2)
}
