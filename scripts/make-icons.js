// Builds every app/site icon from the logo mark (the yellow shape with the
// figure, at the left of public/oltinde-logo.png), so nothing is cropped:
//   node scripts/make-icons.js
// Android adaptive icons only show the central ~66% of the foreground, so
// the mark is placed inside that safe zone.
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public/oltinde-logo.png');
const MARK_BOX = { left: 148, top: 16, width: 456, height: 480 }; // ends before the "O" (x=611)

async function mark(size) {
  return sharp(SRC).extract(MARK_BOX).resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function onCanvas(size, markRatio, background, out) {
  const m = Math.round(size * markRatio);
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: await mark(m), gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, out));
}

// Monochrome (Android 13 themed icons): only alpha counts. The yellow shape
// is solid and the figure is cut out of it.
async function monochrome(size, markRatio, out) {
  const m = Math.round(size * markRatio);
  const { data, info } = await sharp(await mark(m)).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const dark = data[i] < 90 && data[i + 1] < 90 && data[i + 2] < 90;
    const alpha = dark ? 0 : data[i + 3];
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = alpha;
  }
  const glyph = await sharp(data, { raw: info }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, out));
}

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

(async () => {
  // App (mobile/assets)
  await onCanvas(1024, 0.78, WHITE, 'mobile/assets/icon.png'); // iOS / legacy launcher
  await onCanvas(1024, 0.58, CLEAR, 'mobile/assets/android-icon-foreground.png'); // adaptive, inside the safe zone
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: WHITE } }).png().toFile(path.join(ROOT, 'mobile/assets/android-icon-background.png'));
  await monochrome(1024, 0.58, 'mobile/assets/android-icon-monochrome.png');
  await onCanvas(1024, 1, CLEAR, 'mobile/assets/splash-icon.png');
  await onCanvas(48, 0.9, CLEAR, 'mobile/assets/favicon.png');

  // Website install icons (same crop problem)
  await onCanvas(192, 0.82, WHITE, 'public/icons/icon-192.png');
  await onCanvas(512, 0.82, WHITE, 'public/icons/icon-512.png');
  await onCanvas(192, 0.62, WHITE, 'public/icons/icon-maskable-192.png');
  await onCanvas(512, 0.62, WHITE, 'public/icons/icon-maskable-512.png');
  await onCanvas(180, 0.8, WHITE, 'src/app/apple-icon.png');
  await onCanvas(64, 0.92, CLEAR, 'src/app/icon.png');
  console.log('icons written');
})();
