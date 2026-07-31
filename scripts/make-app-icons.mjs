// Genererar appens ikoner till public/.  node scripts/make-app-icons.mjs
//
// Finns som skript så att PNG-filerna i repot har en spårbar källa i stället
// för att vara oförklarliga binärer som ingen vet hur man gör om.
//
// Två varianter av motivet:
//   any       — skivstången fyller ikonen
//   maskable  — samma motiv nedskalat, så att det överlever att Android och
//               iOS beskär ikonen till en cirkel eller squircle. Utan detta
//               kapas vikterna av på sidorna.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT_DIR, { recursive: true });

const BG = [10, 10, 10]; // --color-bg
const FG = [237, 237, 237]; // --color-fg

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * Skivstång i andelar av bredden. `scale` krymper motivet mot mitten, vilket
 * är vad maskable-varianten behöver.
 */
function isBar(x, y, size, scale) {
  const u = (x / size - 0.5) / scale + 0.5;
  const v = (y / size - 0.5) / scale + 0.5;
  if (v >= 0.44 && v <= 0.56 && u >= 0.16 && u <= 0.84) return true; // greppet
  if (v >= 0.28 && v <= 0.72 && u >= 0.18 && u <= 0.3) return true; // vänster vikt
  if (v >= 0.28 && v <= 0.72 && u >= 0.7 && u <= 0.82) return true; // höger vikt
  return false;
}

function makePng(size, scale = 1) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filtertyp none
    for (let x = 0; x < size; x++) {
      const c = isBar(x, y, size, scale) ? FG : BG;
      raw[p++] = c[0];
      raw[p++] = c[1];
      raw[p++] = c[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bitdjup
  ihdr[9] = 2; // truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const files = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  // 0.62 håller motivet innanför maskable-standardens säkra zon (mitten 80 %).
  ['icon-maskable-512.png', 512, 0.62],
  ['apple-touch-icon.png', 180, 1],
];

for (const [name, size, scale] of files) {
  writeFileSync(join(OUT_DIR, name), makePng(size, scale));
  console.log(`skrev public/${name} (${size}x${size}, skala ${scale})`);
}
