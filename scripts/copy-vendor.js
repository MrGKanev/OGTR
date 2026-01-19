const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const nodeModules = path.join(rootDir, 'node_modules');
const vendorDir = path.join(rootDir, 'vendor');

// Vendor mappings: source in node_modules -> destination in vendor
const vendors = [
  {
    name: 'leaflet',
    files: [
      { src: 'leaflet/dist/leaflet.js', dest: 'leaflet/leaflet.js' },
      { src: 'leaflet/dist/leaflet.css', dest: 'leaflet/leaflet.css' },
      { src: 'leaflet/dist/images', dest: 'leaflet/images', isDir: true }
    ]
  }
];

function copyFileSync(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  Copied: ${path.basename(dest)}`);
}

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
      console.log(`  Copied: ${entry.name}`);
    }
  }
}

console.log('Copying vendor files...\n');

for (const vendor of vendors) {
  console.log(`${vendor.name}:`);

  for (const file of vendor.files) {
    const srcPath = path.join(nodeModules, file.src);
    const destPath = path.join(vendorDir, file.dest);

    if (!fs.existsSync(srcPath)) {
      console.log(`  Warning: ${file.src} not found`);
      continue;
    }

    if (file.isDir) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }

  console.log('');
}

console.log('Done!');
