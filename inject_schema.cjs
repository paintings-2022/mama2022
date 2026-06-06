const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let modified = false;
data.gallery.forEach(item => {
  if (typeof item.isFlattened === 'undefined') { item.isFlattened = false; modified = true; }
  if (typeof item.isMounted === 'undefined') { item.isMounted = false; modified = true; }
  if (typeof item.isFramed === 'undefined') { item.isFramed = false; modified = true; }
  if (typeof item.isInscribed === 'undefined') { item.isInscribed = false; modified = true; }
});

if (modified) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully injected all missing schema fields (isFlattened, isMounted, isFramed, isInscribed).');
} else {
  console.log('No modifications needed.');
}
