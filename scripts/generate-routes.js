/**
 * Generate route geometries using OSRM (follows actual roads)
 *
 * Run: node scripts/generate-routes.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load data
const dataModule = require('../js/data-normalized.js');
const { STOPS, LINES } = dataModule;

// OSRM demo server (free, rate limited)
const OSRM_BASE = 'router.project-osrm.org';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get route from OSRM between multiple points
 */
function getRoute(coordinates) {
    return new Promise((resolve, reject) => {
        // Format: lng,lat;lng,lat;...
        const coordString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
        const url = `/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

        const options = {
            hostname: OSRM_BASE,
            path: url,
            method: 'GET',
            headers: {
                'User-Agent': 'OGTR-Transit-Map/1.0'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.code === 'Ok' && result.routes && result.routes[0]) {
                        resolve(result.routes[0].geometry);
                    } else {
                        console.log('  OSRM response:', result.code || 'Unknown error');
                        resolve(null);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function generateAllRoutes() {
    const routeGeometries = {};
    const lineIds = Object.keys(LINES);

    console.log(`\n=== Generating routes for ${lineIds.length} lines ===\n`);

    for (let i = 0; i < lineIds.length; i++) {
        const lineId = lineIds[i];
        const line = LINES[lineId];

        console.log(`[${i + 1}/${lineIds.length}] ${lineId}: ${line.name}`);

        // Get coordinates for all stops in this line
        const coordinates = line.stops
            .map(stopId => {
                const stop = STOPS[stopId];
                if (!stop) {
                    console.log(`  Warning: Stop ${stopId} not found`);
                    return null;
                }
                return [stop.lng, stop.lat];
            })
            .filter(c => c !== null);

        if (coordinates.length < 2) {
            console.log('  Skipping: Not enough valid stops');
            continue;
        }

        console.log(`  ${coordinates.length} stops`);

        // Rate limit
        await sleep(1100);

        try {
            const geometry = await getRoute(coordinates);
            if (geometry) {
                routeGeometries[lineId] = geometry;
                console.log(`  ✓ Route generated (${geometry.coordinates.length} points)`);
            } else {
                // Fallback to straight lines
                routeGeometries[lineId] = {
                    type: 'LineString',
                    coordinates: coordinates
                };
                console.log('  ✗ Using fallback (straight lines)');
            }
        } catch (e) {
            console.log(`  ✗ Error: ${e.message}`);
            routeGeometries[lineId] = {
                type: 'LineString',
                coordinates: coordinates
            };
        }
    }

    return routeGeometries;
}

async function main() {
    console.log('Generating route geometries from OSRM...');
    console.log('This will take about ' + Math.ceil(Object.keys(LINES).length * 1.1 / 60) + ' minutes');

    const routeGeometries = await generateAllRoutes();

    // Save to JSON file
    const outputPath = path.join(__dirname, 'route-geometries.json');
    fs.writeFileSync(outputPath, JSON.stringify(routeGeometries, null, 2));
    console.log(`\nRoutes saved to: ${outputPath}`);

    // Generate JS code to paste into data-normalized.js
    const jsOutput = `const ROUTE_GEOMETRIES = ${JSON.stringify(routeGeometries, null, 4)};`;
    const jsPath = path.join(__dirname, 'route-geometries.js');
    fs.writeFileSync(jsPath, jsOutput);
    console.log(`JS code saved to: ${jsPath}`);

    console.log('\n=== DONE ===');
    console.log(`Generated routes for ${Object.keys(routeGeometries).length} lines`);
}

main().catch(console.error);
