const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const staticSrc = path.join(__dirname, '..', '.next', 'static');
const staticDest = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');

const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(__dirname, '..', '.next', 'standalone', 'public');

if (fs.existsSync(staticSrc)) {
  console.log('Copying .next/static to standalone...');
  copyDirSync(staticSrc, staticDest);
} else {
  console.log('.next/static does not exist, skipping copy.');
}

if (fs.existsSync(publicSrc)) {
  console.log('Copying public to standalone...');
  copyDirSync(publicSrc, publicDest);
} else {
  console.log('public directory does not exist, skipping copy.');
}

console.log('Postbuild copy completed successfully.');
