import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dataPath = path.join(process.cwd(), 'public', 'data.json');
const rawDirs = [
  { raw: 'public/picture/01s', out: 'public/picture/01', cat: 'life', desc: 'life 照片' },
  { raw: 'public/picture/02s', out: 'public/picture/02', cat: 'painting', desc: 'painting 照片' }
];

async function processImages() {
  let existingData = { gallery: [] };
  if (fs.existsSync(dataPath)) {
    existingData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }
  
  let nextId = existingData.gallery.length > 0 
    ? Math.max(...existingData.gallery.map(i => parseInt(i.id) || 0)) + 1 
    : 100;

  let addedCount = 0;

  for (const dir of rawDirs) {
    if (!fs.existsSync(dir.raw)) {
      console.log(`Directory ${dir.raw} not found, skipping.`);
      continue;
    }
    if (!fs.existsSync(dir.out)) fs.mkdirSync(dir.out, { recursive: true });

    const files = fs.readdirSync(dir.raw).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    console.log(`Found ${files.length} original files in ${dir.raw}`);

    for (const file of files) {
      const inputPath = path.join(dir.raw, file);
      const outName = file.replace(/\.(png|jpeg|jpg)$/i, '.jpg');
      const outputPath = path.join(dir.out, outName);
      const targetUrl = `/${dir.out.replace('public/', '')}/${outName}`.replace(/\\/g, '/');

      const existsInJson = existingData.gallery.find(item => item.url && item.url.replace(/\?.*$/, '') === targetUrl);
      const fileExists = fs.existsSync(outputPath);

      if (existsInJson && fileExists) {
        // Skip already processed images
        continue;
      }

      const stat = fs.statSync(inputPath);
      const dateObj = stat.birthtime || stat.mtime;
      const dateStr = dateObj.toISOString().split('T')[0];

      try {
        console.log(`Processing NEW file: ${file}...`);
        await sharp(inputPath)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .rotate()
          .toFile(outputPath);

        if (!existsInJson) {
          existingData.gallery.push({
            id: String(nextId++),
            type: 'image',
            category: dir.cat,
            url: targetUrl,
            title: file,
            description: dir.desc,
            date: dateStr,
            location: '',
            isLiked: true
          });
          addedCount++;
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
  console.log(`All done! Added ${addedCount} new images. Total items in gallery: ${existingData.gallery.length}`);
}

processImages().catch(console.error);
