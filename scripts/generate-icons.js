/**
 * Generate PNG icons from SVG source
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '..', 'icons', 'icon.svg');
const outDir = path.join(__dirname, '..', 'icons');

const sizes = [180, 192, 512];

async function generate() {
    const svg = fs.readFileSync(svgPath);

    for (const size of sizes) {
        const outPath = path.join(outDir, `icon-${size}x${size}.png`);
        await sharp(svg)
            .resize(size, size)
            .png()
            .toFile(outPath);
        console.log(`Generated: icon-${size}x${size}.png`);
    }

    console.log('Done!');
}

generate().catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
