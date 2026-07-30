// Genererar ikonerna för testsidans manifest. Körs sällan:  node test/make-icons.mjs
// Finns här så att PNG-filerna i repot har en spårbar källa i stället för att vara
// oförklarliga binärer. Ritar en enkel skivstång på mörk botten, inga beroenden.

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));

const BG = [10, 10, 10];       // #0a0a0a
const FG = [237, 237, 237];    // #ededed

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

/** Ritar en skivstång: två vikter, ett grepp. Koordinater i andelar av bredden. */
function isBar(x, y, size) {
  const u = x / size;
  const v = y / size;
  const barTop = 0.44;
  const barBottom = 0.56;
  const plateTop = 0.28;
  const plateBottom = 0.72;

  // Greppet
  if (v >= barTop && v <= barBottom && u >= 0.16 && u <= 0.84) return true;
  // Vänster vikt
  if (v >= plateTop && v <= plateBottom && u >= 0.18 && u <= 0.3) return true;
  // Höger vikt
  if (v >= plateTop && v <= plateBottom && u >= 0.7 && u <= 0.82) return true;
  return false;
}

function makePng(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filtertyp: none
    for (let x = 0; x < size; x++) {
      const c = isBar(x, y, size) ? FG : BG;
      raw[p++] = c[0];
      raw[p++] = c[1];
      raw[p++] = c[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bitdjup
  ihdr[9] = 2;  // färgtyp: truecolor RGB
  ihdr[10] = 0; // kompression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [size, name] of [
  [180, 'apple-touch-icon.png'], // iOS hemskärm
  [192, 'icon-192.png'],
  [512, 'icon-512.png'],
]) {
  const file = join(OUT_DIR, name);
  writeFileSync(file, makePng(size));
  console.log(`skrev ${name} (${size}x${size})`);
}
