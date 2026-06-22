// Recolour a dark, transparent-background logo to a light (or any) solid colour, preserving its
// alpha shape - so a dark wordmark can sit on a dark brand background.
// Usage: node prep-logo.js <inputLogo.png> <outputLogo.png> [fillHex=#EDF5DE]
const sharp = require('sharp');
const [, , inp = 'logo_dark.png', out = 'logo_light.png', fill = '#EDF5DE'] = process.argv;
(async () => {
  const { data, info } = await sharp(inp).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
  await sharp({ create: { width: info.width, height: info.height, channels: 3, background: fill } })
    .joinChannel(data, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png().toFile(out);
  console.log('wrote', out, info.width + 'x' + info.height, 'fill', fill);
})();
