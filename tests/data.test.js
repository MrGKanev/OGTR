const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/data-normalized.js');

describe('validateData', () => {
    it('should return valid with no errors', () => {
        const result = data.validateData();
        assert.equal(result.valid, true, `Errors: ${result.errors.join(', ')}`);
        assert.equal(result.errors.length, 0);
    });
});

describe('searchStops', () => {
    it('should find stops by name', () => {
        const results = data.searchStops('оборище');
        assert.ok(results.length > 0, 'Should find пл. Оборище');
        assert.ok(results.some(s => s.id === 'S001'));
    });

    it('should find stops by alias', () => {
        const results = data.searchStops('гарата');
        assert.ok(results.length > 0, 'Should find ЖП гара via alias');
        assert.ok(results.some(s => s.id === 'S002'));
    });

    it('should return empty for nonsense query', () => {
        const results = data.searchStops('xyznonexistent');
        assert.equal(results.length, 0);
    });
});

describe('calculateEstimatedArrival', () => {
    it('should return an object with message and available', () => {
        const result = data.calculateEstimatedArrival('T2', 'S001');
        assert.ok('message' in result);
        assert.ok('available' in result);
    });

    it('should handle invalid line gracefully', () => {
        const result = data.calculateEstimatedArrival('INVALID', 'S001');
        assert.equal(result.available, false);
    });

    it('should handle invalid stop gracefully', () => {
        const result = data.calculateEstimatedArrival('T2', 'INVALID');
        assert.ok('message' in result);
        assert.ok('available' in result);
    });
});

describe('getLineStops', () => {
    it('should return stops array for T2', () => {
        const stops = data.getLineStops('T2');
        assert.ok(Array.isArray(stops));
        assert.ok(stops.length > 0);
        assert.ok(stops[0].name, 'Each stop should have a name');
    });

    it('should return empty array for invalid line', () => {
        const stops = data.getLineStops('INVALID');
        assert.ok(Array.isArray(stops));
        assert.equal(stops.length, 0);
    });
});

describe('getLine', () => {
    it('should return line data for T2', () => {
        const line = data.getLine('T2');
        assert.ok(line);
        assert.equal(line.type, 'trolleybus');
        assert.equal(line.number, '2');
    });

    it('should return null for invalid line', () => {
        const line = data.getLine('INVALID');
        assert.equal(line, null);
    });
});

describe('getLinesForStop', () => {
    it('should return lines for S001 (пл. Оборище)', () => {
        const lines = data.getLinesForStop('S001');
        assert.ok(Array.isArray(lines));
        assert.ok(lines.length > 0, 'Major hub should have lines');
    });

    it('should return empty for invalid stop', () => {
        const lines = data.getLinesForStop('INVALID');
        assert.ok(Array.isArray(lines));
        assert.equal(lines.length, 0);
    });
});

describe('Data integrity', () => {
    it('all line stop references should point to valid stops', () => {
        const lines = data.getAllLines();
        for (const line of lines) {
            for (const stopId of line.stops) {
                const stop = data.getStop(stopId);
                assert.ok(stop, `Line ${line.id} references non-existent stop ${stopId}`);
            }
        }
    });

    it('all stop coordinates should be within Ruse range', () => {
        const stops = data.getAllStops();
        for (const stop of stops) {
            assert.ok(stop.lat >= 43.7 && stop.lat <= 43.95,
                `Stop ${stop.id} (${stop.name}) lat ${stop.lat} outside Ruse range`);
            assert.ok(stop.lng >= 25.85 && stop.lng <= 26.15,
                `Stop ${stop.id} (${stop.name}) lng ${stop.lng} outside Ruse range`);
        }
    });

    it('each line should have at least 2 stops', () => {
        const lines = data.getAllLines();
        for (const line of lines) {
            assert.ok(line.stops.length >= 2,
                `Line ${line.id} has fewer than 2 stops`);
        }
    });

    it('each line should have a schedule', () => {
        const lines = data.getAllLines();
        for (const line of lines) {
            assert.ok(line.schedule, `Line ${line.id} missing schedule`);
            assert.ok(line.schedule.weekday, `Line ${line.id} missing weekday schedule`);
        }
    });
});
