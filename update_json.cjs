const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let count = 0;
data.gallery.forEach(item => {
  if (item.description && item.description.includes('painting 照片')) {
    item.description = item.description.replace(/painting 照片/g, '; ');
    count++;
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated ${count} items in data.json.`);
