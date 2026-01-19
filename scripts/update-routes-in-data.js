/**
 * Replace ROUTE_GEOMETRIES in data-normalized.js with new OSRM routes
 */

const fs = require('fs');
const path = require('path');

// Load new routes
const newRoutes = require('./route-geometries.json');

// Load data file
const dataPath = path.join(__dirname, '..', 'js', 'data-normalized.js');
let content = fs.readFileSync(dataPath, 'utf8');

// Find the ROUTE_GEOMETRIES section
const startMarker = '// ═══════════════════════════════════════════════════════════════\n// ROUTE GEOMETRIES (GeoJSON LineStrings) - Generated from OSRM\n// ═══════════════════════════════════════════════════════════════\nconst ROUTE_GEOMETRIES = {';
const endMarker = '\n// ═══════════════════════════════════════════════════════════════\n// HELPER FUNCTIONS';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find ROUTE_GEOMETRIES section markers');
    process.exit(1);
}

// Build new ROUTE_GEOMETRIES object
const routeLines = Object.entries(newRoutes).map(([lineId, geometry]) => {
    // Compact the coordinates for smaller file size
    const compactCoords = geometry.coordinates.map(c =>
        `[${c[0].toFixed(6)},${c[1].toFixed(6)}]`
    ).join(',');
    return `    '${lineId}': { type: 'LineString', coordinates: [${compactCoords}] }`;
});

const newSection = `// ═══════════════════════════════════════════════════════════════
// ROUTE GEOMETRIES (GeoJSON LineStrings) - Generated from OSRM
// ═══════════════════════════════════════════════════════════════
const ROUTE_GEOMETRIES = {
${routeLines.join(',\n')}
};`;

// Replace the section
const newContent = content.substring(0, startIdx) + newSection + content.substring(endIdx);

fs.writeFileSync(dataPath, newContent);

console.log('ROUTE_GEOMETRIES updated successfully!');
console.log(`Routes: ${Object.keys(newRoutes).length}`);
console.log(`Total coordinate points: ${Object.values(newRoutes).reduce((sum, r) => sum + r.coordinates.length, 0)}`);
