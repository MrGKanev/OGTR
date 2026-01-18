/**
 * Apply geocoded coordinates to data-normalized.js
 *
 * Run: node scripts/apply-geocode.js
 */

const fs = require('fs');
const path = require('path');

// Load geocode results
const resultsPath = path.join(__dirname, 'geocode-results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Load current data file
const dataPath = path.join(__dirname, '..', 'js', 'data-normalized.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');

// Track changes
const changes = [];
const skipped = [];

// Process each geocoded stop
for (const [stopId, result] of Object.entries(results)) {
    if (result.newLat !== null && result.newLng !== null) {
        // Build regex to find this stop's coordinates
        // Match: lat: NUMBER,\n        lng: NUMBER,
        const latPattern = new RegExp(
            `('${stopId}':\\s*\\{[^}]*?lat:\\s*)([\\d.]+)(,\\s*\\n\\s*lng:\\s*)([\\d.]+)`,
            's'
        );

        const match = dataContent.match(latPattern);
        if (match) {
            const oldLat = parseFloat(match[2]);
            const oldLng = parseFloat(match[4]);

            // Calculate distance change
            const latDiff = Math.abs(result.newLat - oldLat);
            const lngDiff = Math.abs(result.newLng - oldLng);
            const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

            // Apply the new coordinates
            dataContent = dataContent.replace(
                latPattern,
                `$1${result.newLat}$3${result.newLng}`
            );

            changes.push({
                id: stopId,
                name: result.name,
                oldLat,
                oldLng,
                newLat: result.newLat,
                newLng: result.newLng,
                distance: (distanceKm * 1000).toFixed(0) + 'm',
                source: result.source
            });
        } else {
            skipped.push({ id: stopId, name: result.name, reason: 'Pattern not found' });
        }
    } else {
        skipped.push({ id: stopId, name: result.name, reason: result.error || 'No coordinates' });
    }
}

// Write updated file
fs.writeFileSync(dataPath, dataContent);

// Report
console.log('\n=== COORDINATES UPDATED ===\n');
console.log(`Updated: ${changes.length} stops`);
console.log(`Skipped: ${skipped.length} stops`);

console.log('\n--- Changes Applied ---');
changes
    .sort((a, b) => parseInt(b.distance) - parseInt(a.distance))
    .forEach(c => {
        console.log(`\n${c.id}: ${c.name}`);
        console.log(`  Old: ${c.oldLat.toFixed(4)}, ${c.oldLng.toFixed(4)}`);
        console.log(`  New: ${c.newLat.toFixed(4)}, ${c.newLng.toFixed(4)}`);
        console.log(`  Distance: ${c.distance}`);
    });

console.log('\n--- Skipped (not found) ---');
skipped.forEach(s => {
    console.log(`  ${s.id}: ${s.name} - ${s.reason}`);
});
