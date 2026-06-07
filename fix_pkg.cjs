const fs = require('fs');
let content = fs.readFileSync('package.json', 'utf8');
if (!content.startsWith('{')) {
  content = '{\n' + content;
}
content = content.replace(/"type": "module",\s*"type": "module",/g, '"type": "module",');
fs.writeFileSync('package.json', content, 'utf8');
console.log('Fixed package.json');
