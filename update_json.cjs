const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let count = 0;
data.gallery.forEach(item => {
  // Initialize fields
  if (typeof item.isFlattened === 'undefined') item.isFlattened = false;
  if (typeof item.isMounted === 'undefined') item.isMounted = false;
  if (typeof item.isFramed === 'undefined') item.isFramed = false;

  if (item.description) {
    // If the user already manually deleted some parts, we can detect it.
    // But mostly we just want to remove the placeholder "(拓平; 裱褙; 裝框)"
    // Since the user might have kept "拓平", let's check:
    
    // Actually, if we just remove the exact string " (拓平; 裱褙; 裝框)":
    if (item.description.includes('(拓平; 裱褙; 裝框)')) {
      item.description = item.description.replace(' (拓平; 裱褙; 裝框)', '').trim();
      count++;
    } else if (item.description.includes('(拓平;裱褙;裝框)')) {
      item.description = item.description.replace('(拓平;裱褙;裝框)', '').trim();
      count++;
    }
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Migrated schema and cleaned up ${count} items in data.json.`);
