/**
 * Apply ALL geocoded coordinates (including >2km changes)
 *
 * Run: node scripts/apply-all-geocode.js
 */

const fs = require('fs');
const path = require('path');

// Load geocode results
const resultsPath = path.join(__dirname, 'geocode-results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Load current data file
const dataPath = path.join(__dirname, '..', 'js', 'data-normalized.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');

const applied = [];

for (const [stopId, result] of Object.entries(results)) {
    if (result.newLat !== null && result.newLng !== null) {
        // Build regex to find this stop's coordinates
        const latPattern = new RegExp(
            `('${stopId}':\\s*\\{[^}]*?lat:\\s*)([\\d.]+)(,\\s*\\n\\s*lng:\\s*)([\\d.]+)`,
            's'
        );

        const match = dataContent.match(latPattern);
        if (match) {
            const currentLat = parseFloat(match[2]);
            const currentLng = parseFloat(match[4]);

            // Check if coordinates are different from geocoded
            if (Math.abs(currentLat - result.newLat) > 0.0001 ||
                Math.abs(currentLng - result.newLng) > 0.0001) {

                // Calculate distance
                const latDiff = Math.abs(result.newLat - result.oldLat);
                const lngDiff = Math.abs(result.newLng - result.oldLng);
                const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

                // Apply the new coordinates
                dataContent = dataContent.replace(
                    latPattern,
                    `$1${result.newLat}$3${result.newLng}`
                );

                applied.push({
                    id: stopId,
                    name: result.name,
                    distance: (distanceKm * 1000).toFixed(0) + 'm',
                    newLat: result.newLat,
                    newLng: result.newLng,
                    source: result.source
                });
            }
        }
    }
}

// Write updated file
fs.writeFileSync(dataPath, dataContent);

console.log(`\n=== APPLIED ${applied.length} GEOCODE CHANGES ===\n`);
applied.forEach(a => {
    console.log(`${a.id}: ${a.name}`);
    console.log(`  New: ${a.newLat.toFixed(4)}, ${a.newLng.toFixed(4)} (${a.distance})`);
    console.log(`  Source: ${a.source.substring(0, 60)}...`);
});
