const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let count = 0;
data.gallery.forEach(item => {
  if (item.title) {
    const titleUpper = item.title.toUpperCase();
    if (!titleUpper.endsWith('.JPG') && !titleUpper.endsWith('.MP4')) {
      item.isInscribed = true;
      count++;
    }
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated isInscribed to true for ${count} items.`);
