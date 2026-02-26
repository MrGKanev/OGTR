/**
 * Extract ROUTE_GEOMETRIES from data-normalized.js into a standalone JSON file.
 * Run: node scripts/extract-geometries.js
 */
const path = require('path');

// Load the data module
const data = require('../js/data-normalized.js');

const outPath = path.join(__dirname, '..', 'data', 'route-geometries.json');

require('fs').writeFileSync(
    outPath,
    JSON.stringify(data.ROUTE_GEOMETRIES, null, 0),
    'utf-8'
);

console.log(`Extracted ROUTE_GEOMETRIES to ${outPath}`);
console.log(`Keys: ${Object.keys(data.ROUTE_GEOMETRIES).join(', ')}`);
