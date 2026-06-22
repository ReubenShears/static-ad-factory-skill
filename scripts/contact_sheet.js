// Build a QC contact-sheet montage from a directory of square PNGs.
// Usage: node contact_sheet.js <dir> <outFile> [cols=5] [cell=360]
// Tiles every *.png in <dir> (sorted) except files starting with "_".
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const [, , dir = '.', outFile = '_contactsheet.png', colsArg, cellArg] = process.argv;
const cols = +(colsArg || 5);
const cell = +(cellArg || 360);
const pad = 10;
(async () => {
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png') && !f.startsWith('_')).sort();
  if (!files.length) { console.error('no png files in', dir); process.exit(1); }
  const rows = Math.ceil(files.length / cols);
  const W = cols * cell + (cols + 1) * pad, H = rows * cell + (rows + 1) * pad;
  const comps = [];
  for (let i = 0; i < files.length; i++) {
    const buf = await sharp(path.join(dir, files[i])).resize(cell, cell, { fit: 'cover' }).toBuffer();
    comps.push({ input: buf, left: pad + (i % cols) * (cell + pad), top: pad + Math.floor(i / cols) * (cell + pad) });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: '#cccccc' } }).composite(comps).png().toFile(outFile);
  console.log('contact sheet', W + 'x' + H, 'tiles', files.length, '->', outFile);
})();
