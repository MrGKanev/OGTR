/**
 * Route Planner - BFS-based A→B journey planner
 * Uses stop-level graph built from TRANSIT_DATA
 */
(function() {
    'use strict';

    const MAX_TRANSFERS = 2;

    /**
     * Build adjacency: for each stop, which lines serve it and
     * for each line, which stops are adjacent.
     */
    function buildGraph() {
        const stopLines = {}; // stopId -> [lineId, ...]
        const lineStops = {}; // lineId -> [stopId, ...]

        const allLines = TRANSIT_DATA.getAllLines();
        for (const line of allLines) {
            lineStops[line.id] = line.stops;
            for (const stopId of line.stops) {
                if (!stopLines[stopId]) stopLines[stopId] = [];
                if (!stopLines[stopId].includes(line.id)) {
                    stopLines[stopId].push(line.id);
                }
            }
        }
        return { stopLines, lineStops };
    }

    /**
     * Find routes from origin to destination.
     * Returns array of route options, each with segments.
     * Priority: fewer transfers, then fewer total hops.
     */
    function findRoutes(fromStopId, toStopId) {
        if (fromStopId === toStopId) return [];

        const { stopLines, lineStops } = buildGraph();

        // BFS state: { stopId, lineId (current line), transfers, path }
        // path: array of { lineId, stops: [stopId, ...] }
        const queue = [];
        // visited: stopId + transfer count to prune
        const visited = new Map(); // key: `${stopId}:${transfers}` -> true

        // Seed: start from fromStopId on each line that serves it
        const startLines = stopLines[fromStopId] || [];
        for (const lineId of startLines) {
            const key = `${fromStopId}:0:${lineId}`;
            visited.set(key, true);
            queue.push({
                stopId: fromStopId,
                lineId: lineId,
                transfers: 0,
                path: [{ lineId, stops: [fromStopId] }]
            });
        }

        const results = [];
        let maxResults = 5;

        while (queue.length > 0 && results.length < maxResults) {
            const current = queue.shift();

            // Get adjacent stops on current line
            const stops = lineStops[current.lineId];
            if (!stops) continue;

            const idx = stops.indexOf(current.stopId);
            if (idx === -1) continue;

            // Try both directions on the line
            const neighbors = [];
            if (idx > 0) neighbors.push(stops[idx - 1]);
            if (idx < stops.length - 1) neighbors.push(stops[idx + 1]);

            for (const nextStop of neighbors) {
                // Check if we reached destination
                if (nextStop === toStopId) {
                    const finalPath = current.path.map(seg => ({ ...seg, stops: [...seg.stops] }));
                    finalPath[finalPath.length - 1].stops.push(nextStop);
                    results.push({
                        segments: finalPath,
                        transfers: current.transfers,
                        totalStops: finalPath.reduce((sum, seg) => sum + seg.stops.length - 1, 0)
                    });
                    continue;
                }

                // Continue on same line
                const sameKey = `${nextStop}:${current.transfers}:${current.lineId}`;
                if (!visited.has(sameKey)) {
                    visited.set(sameKey, true);
                    const newPath = current.path.map(seg => ({ ...seg, stops: [...seg.stops] }));
                    newPath[newPath.length - 1].stops.push(nextStop);
                    queue.push({
                        stopId: nextStop,
                        lineId: current.lineId,
                        transfers: current.transfers,
                        path: newPath
                    });
                }

                // Transfer to other lines at this stop
                if (current.transfers < MAX_TRANSFERS) {
                    const otherLines = (stopLines[nextStop] || []).filter(l => l !== current.lineId);
                    for (const otherLine of otherLines) {
                        const transKey = `${nextStop}:${current.transfers + 1}:${otherLine}`;
                        if (!visited.has(transKey)) {
                            visited.set(transKey, true);
                            const newPath = current.path.map(seg => ({ ...seg, stops: [...seg.stops] }));
                            newPath[newPath.length - 1].stops.push(nextStop);
                            newPath.push({ lineId: otherLine, stops: [nextStop] });
                            queue.push({
                                stopId: nextStop,
                                lineId: otherLine,
                                transfers: current.transfers + 1,
                                path: newPath
                            });
                        }
                    }
                }
            }
        }

        // Sort: fewer transfers first, then fewer stops
        results.sort((a, b) => {
            if (a.transfers !== b.transfers) return a.transfers - b.transfers;
            return a.totalStops - b.totalStops;
        });

        // Deduplicate by segment line sequence
        const seen = new Set();
        return results.filter(r => {
            const key = r.segments.map(s => s.lineId).join(',');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 3);
    }

    /**
     * Estimate travel time for a route.
     * ~2 min per stop, ~5 min per transfer wait.
     */
    function estimateTime(route) {
        const stopMinutes = route.totalStops * 2;
        const transferMinutes = route.transfers * 5;
        return stopMinutes + transferMinutes;
    }

    window.RoutePlanner = {
        findRoutes,
        estimateTime
    };
})();
