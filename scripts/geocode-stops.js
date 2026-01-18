/**
 * Geocode stops using OpenStreetMap Nominatim API
 *
 * Run: node scripts/geocode-stops.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load current stops from the module
const dataModule = require('../js/data-normalized.js');
const STOPS = dataModule.STOPS;

// Nominatim API request with rate limiting
function geocodeAddress(query, city = 'Русе', country = 'България') {
    return new Promise((resolve, reject) => {
        const searchQuery = encodeURIComponent(`${query}, ${city}, ${country}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=1&addressdetails=1`;

        const options = {
            headers: {
                'User-Agent': 'OGTR-Transit-Map/1.0 (geocoding stops)'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const results = JSON.parse(data);
                    if (results.length > 0) {
                        resolve({
                            lat: parseFloat(results[0].lat),
                            lng: parseFloat(results[0].lon),
                            displayName: results[0].display_name,
                            type: results[0].type
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Sleep function for rate limiting (Nominatim requires 1 req/sec)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Alternative search queries for stops
function getSearchQueries(stopName) {
    const queries = [stopName];

    // Add variations
    if (stopName.includes('ж.к.')) {
        queries.push(stopName.replace('ж.к.', 'жилищен комплекс'));
        queries.push(stopName.replace('ж.к.', ''));
    }
    if (stopName.includes('бул.')) {
        queries.push(stopName.replace('бул.', 'булевард'));
    }
    if (stopName.includes('ул.')) {
        queries.push(stopName.replace('ул.', 'улица'));
    }
    if (stopName.includes('кв.')) {
        queries.push(stopName.replace('кв.', 'квартал'));
    }
    if (stopName.includes('пл.')) {
        queries.push(stopName.replace('пл.', 'площад'));
    }

    // Try just the main part
    const mainPart = stopName.replace(/^(ж\.к\.|бул\.|ул\.|кв\.|пл\.)\s*/i, '').trim();
    if (mainPart !== stopName) {
        queries.push(mainPart);
    }

    return queries;
}

async function geocodeAllStops() {
    const results = {};
    const stopIds = Object.keys(STOPS);

    console.log(`\n=== Geocoding ${stopIds.length} stops ===\n`);

    for (let i = 0; i < stopIds.length; i++) {
        const id = stopIds[i];
        const stop = STOPS[id];
        const queries = getSearchQueries(stop.name);

        console.log(`[${i + 1}/${stopIds.length}] ${id}: ${stop.name}`);

        let found = null;
        for (const query of queries) {
            await sleep(1100); // Rate limit: 1 request per second

            try {
                const result = await geocodeAddress(query);
                if (result) {
                    // Check if result is within Ruse bounds (roughly)
                    if (result.lat > 43.75 && result.lat < 43.95 &&
                        result.lng > 25.85 && result.lng < 26.1) {
                        found = result;
                        console.log(`  ✓ Found: ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`);
                        console.log(`    (${result.displayName.substring(0, 60)}...)`);
                        break;
                    } else {
                        console.log(`  ✗ Outside Ruse bounds: ${query}`);
                    }
                } else {
                    console.log(`  ✗ Not found: ${query}`);
                }
            } catch (e) {
                console.log(`  ✗ Error: ${e.message}`);
            }
        }

        if (found) {
            results[id] = {
                name: stop.name,
                oldLat: stop.lat,
                oldLng: stop.lng,
                newLat: found.lat,
                newLng: found.lng,
                source: found.displayName
            };
        } else {
            results[id] = {
                name: stop.name,
                oldLat: stop.lat,
                oldLng: stop.lng,
                newLat: null,
                newLng: null,
                error: 'Not found'
            };
        }
    }

    return results;
}

async function main() {
    console.log('Starting geocoding...');
    console.log('This will take about ' + Math.ceil(Object.keys(STOPS).length * 1.1 / 60) + ' minutes');
    console.log('(Rate limited to 1 request per second for Nominatim API)');

    const results = await geocodeAllStops();

    // Save results to JSON
    const outputPath = path.join(__dirname, 'geocode-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);

    // Summary
    const found = Object.values(results).filter(r => r.newLat !== null);
    const notFound = Object.values(results).filter(r => r.newLat === null);

    console.log('\n=== SUMMARY ===');
    console.log(`Found: ${found.length}`);
    console.log(`Not found: ${notFound.length}`);

    if (notFound.length > 0) {
        console.log('\nNot found stops:');
        notFound.forEach(r => console.log(`  - ${r.name}`));
    }

    // Show significant changes
    console.log('\n=== SIGNIFICANT COORDINATE CHANGES (>100m) ===');
    found.forEach(r => {
        const latDiff = Math.abs(r.newLat - r.oldLat);
        const lngDiff = Math.abs(r.newLng - r.oldLng);
        // Rough distance calculation (1 degree ≈ 111km at this latitude)
        const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
        if (distanceKm > 0.1) { // More than 100m
            console.log(`  ${r.name}: ${(distanceKm * 1000).toFixed(0)}m change`);
            console.log(`    Old: ${r.oldLat.toFixed(4)}, ${r.oldLng.toFixed(4)}`);
            console.log(`    New: ${r.newLat.toFixed(4)}, ${r.newLng.toFixed(4)}`);
        }
    });
}

main().catch(console.error);
