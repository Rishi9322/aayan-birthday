// Run `npm run photos` after dropping images into public/photos.
// Makes a 1000px web copy (photoN.jpg) and a 480px copy (photoN-480.jpg) of each jpg/png.
import sharp from 'sharp';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('../public/photos/', import.meta.url));
for (const f of readdirSync(dir)) {
  if (!/\.(jpe?g|png)$/i.test(f) || /-480\./.test(f)) continue;
  const base = f.replace(/\.\w+$/, '');
  const buf = readFileSync(join(dir, f)); // read first so we can overwrite in place
  for (const [w, name] of [[1000, base], [480, base + '-480']]) {
    const r = await sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toFile(join(dir, name + '.jpg'));
    console.log(name + '.jpg', r.width + 'x' + r.height, Math.round(r.size / 1024) + 'KB');
  }
}
