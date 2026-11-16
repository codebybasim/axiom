/**
 * Generates PNG icons from the SVG favicon using sharp (if available)
 * or falls back to writing placeholder PNGs via canvas in Node.
 *
 * Run: node scripts/generate-icons.mjs
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;

  // Background
  ctx.fillStyle = '#0B0D12';
  roundRect(ctx, 0, 0, s, s, s * 0.22);
  ctx.fill();

  // Hex outline
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = s * 0.04;
  hexPath(ctx, s / 2, s / 2, s * 0.44);
  ctx.stroke();

  // A letter fill
  ctx.fillStyle = '#6366f1';
  const scale = s / 64;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(32, 16);
  ctx.lineTo(44, 46);
  ctx.lineTo(38, 46);
  ctx.lineTo(35, 38);
  ctx.lineTo(29, 38);
  ctx.lineTo(26, 46);
  ctx.lineTo(20, 46);
  ctx.closePath();
  ctx.fill();

  // Crossbar cutout
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(27.5 - 1, 32, 10, 3.5);
  ctx.restore();

  // Dot
  ctx.fillStyle = '#a5b4fc';
  ctx.beginPath();
  ctx.arc(s / 2, s * 0.185, s * 0.04, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Generate 192 and 512
for (const size of [192, 512]) {
  const canvas = drawIcon(size);
  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(publicDir, `icon-${size}.png`), buf);
  console.log(`✓ icon-${size}.png`);
}

// Generate OG image 1200x630
{
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1200, 630);
  grad.addColorStop(0, '#0B0D12');
  grad.addColorStop(1, '#10131e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  // Grid dots pattern
  ctx.fillStyle = 'rgba(99,102,241,0.08)';
  for (let x = 40; x < 1200; x += 60) {
    for (let y = 40; y < 630; y += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Large icon
  const icon = drawIcon(180);
  ctx.drawImage(icon, 510, 80, 180, 180);

  // Title
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Axiom Puzzle Lab', 600, 340);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px sans-serif';
  ctx.fillText('16 Free Online Visual Puzzle Games', 600, 400);

  // Game chips
  const games = ['Sudoku', 'Minesweeper', 'Traffic Escape', 'Laser Mirrors', 'Flow Connect', 'Sokoban'];
  ctx.font = '22px sans-serif';
  const chipY = 470;
  const totalW = games.length * 160 + (games.length - 1) * 16;
  let chipX = (1200 - totalW) / 2;
  for (const g of games) {
    ctx.fillStyle = 'rgba(99,102,241,0.18)';
    roundRect(ctx, chipX, chipY, 160, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(g, chipX + 80, chipY + 32);
    chipX += 176;
  }

  // Domain
  ctx.fillStyle = '#475569';
  ctx.font = '24px sans-serif';
  ctx.fillText('axiompuz.online', 600, 580);

  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(publicDir, 'og-image.png'), buf);
  console.log('✓ og-image.png');
}
