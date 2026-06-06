const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let count = 0;
data.gallery.forEach(item => {
  if (item.description) {
    // Regex to match ( ... 拓平 ... 裱褙 ... 裝框 ... ) allowing for any characters inside
    const originalDesc = item.description;
    item.description = item.description.replace(/\(.*?拓平.*?裱褙.*?裝框.*?\)/g, '').trim();
    // Also catch without parentheses if any
    item.description = item.description.replace(/拓平;\s*裱褙;\s*裝框/g, '').trim();
    // Also catch the exact string the user was showing
    item.description = item.description.replace(/\(V拓平; 裱褙; 裝框\)/g, '').trim();
    
    // Clean up trailing spaces or semicolons
    item.description = item.description.replace(/;\s*$/, '').trim();

    if (item.description !== originalDesc) {
      count++;
    }
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Cleaned up descriptions in ${count} items.`);
