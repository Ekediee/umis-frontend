/**
 * Builds every app icon from the BU Pulse logomark (public/images/bu-pulse-logomark.svg).
 *
 *   node scripts/pwa/build-icons.mjs
 *
 * - icon-192/512: the logomark on a transparent square (desktop taskbar, Start menu, Dock)
 * - maskable-192/512: on white, inside Android's safe zone so any mask shape keeps it whole
 * - apple-touch-icon: on white, full bleed (iOS fills transparency with black)
 * - badge-96: white silhouette for the Android status bar (the heartbeat stays cut out)
 * - app/favicon.ico + icon.svg: the browser tab
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "../..");
const svg = await readFile(path.join(root, "public/images/bu-pulse-logomark.svg"));
const out = (f) => path.join(root, "public/icons", f);
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/** The logomark `markHeight` px tall, centred on a `size` square */
async function icon(size, markHeight, background) {
  const mark = await sharp(svg, { density: 1200 }).resize({ height: Math.round(markHeight) }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

for (const s of [192, 512]) {
  await writeFile(out(`icon-${s}.png`), await icon(s, s * 0.84, CLEAR));
  // Safe zone is the centre circle, 80% of the width: a 33:48 mark fits at ~62% height
  await writeFile(out(`maskable-${s}.png`), await icon(s, s * 0.6, WHITE));
}
await writeFile(out("apple-touch-icon.png"), await icon(180, 180 * 0.74, WHITE));

// Badge: every coloured pixel turns white, the logo's white parts turn clear
{
  const { data, info } = await sharp(await icon(96, 96 * 0.86, CLEAR)).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const whiteness = Math.min(data[i], data[i + 1], data[i + 2]) / 255;
    data[i + 3] = Math.round(data[i + 3] * (1 - whiteness ** 4));
    data[i] = data[i + 1] = data[i + 2] = 255;
  }
  await sharp(data, { raw: info }).png().toFile(out("badge-96.png"));
}

// favicon.ico holding 16, 32 and 48 px PNGs (ICO allows PNG payloads)
{
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => icon(s, s * 0.94, CLEAR)));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(s, e);
    header.writeUInt8(s, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(pngs[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += pngs[i].length;
  });
  await writeFile(path.join(root, "app/favicon.ico"), Buffer.concat([header, ...pngs]));
}
await writeFile(out("icon.svg"), svg);

console.log("Icons written to public/icons and app/favicon.ico");
