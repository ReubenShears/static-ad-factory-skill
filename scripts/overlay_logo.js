// Patch over an (emptied) logo area with a brand-colour rectangle, then composite the real client
// logo on top. Use after a carbon-copy edit that left the logo area blank, or to cover a residual
// mark. Tune coords by viewing the result.
// Usage: node overlay_logo.js <base.png> <out.png> <logo.png> <logoLeft> <logoTop> <logoW> [patchHex=#0F2E2A] [pad=18]
const sharp = require('sharp');
const [, , base, out, logoPath, lLeft, lTop, lW, patchHex = '#0F2E2A', padArg] = process.argv;
const pad = +(padArg || 18);
(async () => {
  const logo = await sharp(logoPath).resize({ width: +lW }).png().toBuffer();
  const lm = await sharp(logo).metadata();
  const rectW = lm.width + pad * 2, rectH = lm.height + pad * 2;
  const rect = await sharp({ create: { width: rectW, height: rectH, channels: 4, background: patchHex } }).png().toBuffer();
  await sharp(base).composite([
    { input: rect, left: Math.max(0, +lLeft - pad), top: Math.max(0, +lTop - pad) },
    { input: logo, left: +lLeft, top: +lTop }
  ]).png().toFile(out);
  console.log('wrote', out, '(logo', lm.width + 'x' + lm.height + ')');
})();
