/**
 * Revert geocode changes larger than 2km to original coordinates
 *
 * Run: node scripts/revert-large-changes.js
 */

const fs = require('fs');
const path = require('path');

// Load geocode results (has old coordinates)
const resultsPath = path.join(__dirname, 'geocode-results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Load current data file
const dataPath = path.join(__dirname, '..', 'js', 'data-normalized.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');

const THRESHOLD_KM = 2.0; // Revert changes larger than 2km
const reverted = [];

for (const [stopId, result] of Object.entries(results)) {
    if (result.newLat !== null && result.oldLat !== null) {
        const latDiff = Math.abs(result.newLat - result.oldLat);
        const lngDiff = Math.abs(result.newLng - result.oldLng);
        const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

        if (distanceKm > THRESHOLD_KM) {
            // Revert to original coordinates
            const latPattern = new RegExp(
                `('${stopId}':\\s*\\{[^}]*?lat:\\s*)([\\d.]+)(,\\s*\\n\\s*lng:\\s*)([\\d.]+)`,
                's'
            );

            const match = dataContent.match(latPattern);
            if (match) {
                dataContent = dataContent.replace(
                    latPattern,
                    `$1${result.oldLat}$3${result.oldLng}`
                );

                reverted.push({
                    id: stopId,
                    name: result.name,
                    distance: (distanceKm * 1000).toFixed(0) + 'm',
                    restoredLat: result.oldLat,
                    restoredLng: result.oldLng
                });
            }
        }
    }
}

// Write updated file
fs.writeFileSync(dataPath, dataContent);

console.log(`\n=== REVERTED ${reverted.length} LARGE CHANGES (>${THRESHOLD_KM}km) ===\n`);
reverted.forEach(r => {
    console.log(`${r.id}: ${r.name}`);
    console.log(`  Was ${r.distance} away, restored to: ${r.restoredLat}, ${r.restoredLng}`);
});
