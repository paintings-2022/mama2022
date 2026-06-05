import fs from 'fs';
import path from 'path';
import parser from 'exif-parser';

const dataPath = path.join(process.cwd(), 'public', 'data.json');

const rawDirs = [
  'public/picture/01s',
  'public/picture/02s'
];

if (!fs.existsSync(dataPath)) {
  console.error("data.json not found!");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
let updatedCount = 0;

for (const item of data.gallery) {
  if (item.type !== 'image') continue;
  
  let rawFile = null;
  for (const dir of rawDirs) {
    const tryPath = path.join(process.cwd(), dir, item.title);
    if (fs.existsSync(tryPath)) {
      rawFile = tryPath;
      break;
    }
  }

  if (rawFile) {
    try {
      const buffer = fs.readFileSync(rawFile);
      const exif = parser.create(buffer).parse();
      
      const timestamp = exif.tags && (exif.tags.DateTimeOriginal || exif.tags.CreateDate);
      if (timestamp) {
        const dateObj = new Date(timestamp * 1000);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        item.date = `${year}-${month}-${day}`;
        updatedCount++;
        console.log(`Updated ${item.title} to EXIF date: ${item.date}`);
      } else {
        console.log(`No EXIF date found for ${item.title}`);
      }
    } catch (err) {
      console.error(`Error parsing EXIF for ${item.title}:`, err.message);
    }
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nFinished! Updated ${updatedCount} images with exact shooting dates.`);
