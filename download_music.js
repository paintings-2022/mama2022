import fs from 'fs';
import path from 'path';
import https from 'https';

const outDir = path.join(process.cwd(), 'public', 'music');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const filesToDownload = [
  {
    name: 'Debussy_Clair_de_Lune.ogg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg'
  },
  {
    name: 'Chopin_Nocturne_Op9_No2.ogg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Chopin_-_Nocturne_Op_9_No_2_%28E_Flat_Major%29.ogg'
  },
  {
    name: 'Satie_Gymnopedie_No1.ogg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Gymnop%C3%A9die_No._1.ogg'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  console.log('Downloading soft piano music...');
  for (const file of filesToDownload) {
    console.log(`Downloading ${file.name}...`);
    try {
      await download(file.url, path.join(outDir, file.name));
      console.log(`Downloaded ${file.name}`);
    } catch (e) {
      console.error(`Failed to download ${file.name}:`, e.message);
    }
  }
  console.log('Done!');
}
run();
