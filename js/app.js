/**
 * Ruse Transit Map Application
 * Interactive public transit map for Ruse, Bulgaria
 *
 * Note: innerHTML usage is safe here as all content comes from
 * hardcoded transit data, not user input.
 */

(function() {
    'use strict';

    // Application state
    const state = {
        map: null,
        routeLayers: {},
        stopMarkers: [],
        activeFilter: 'all',
        selectedLine: null,
        sidebarOpen: false
    };

    // DOM Elements
    const elements = {
        map: document.getElementById('map'),
        sidebar: document.getElementById('sidebar'),
        menuToggle: document.getElementById('menuToggle'),
        linesList: document.getElementById('linesList'),
        lineDetails: document.getElementById('lineDetails'),
        searchInput: document.getElementById('searchInput'),
        filterTabs: document.querySelectorAll('.filter-tab'),
        backBtn: document.getElementById('backBtn'),
        locateBtn: document.getElementById('locateBtn'),
        resetBtn: document.getElementById('resetBtn'),
        legendToggle: document.getElementById('legendToggle'),
        mapLegend: document.getElementById('mapLegend'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        infoModal: document.getElementById('infoModal'),
        modalClose: document.getElementById('modalClose')
    };

    // Colors
    const COLORS = {
        trolleybus: '#dc2626',
        trolleybusHover: '#ef4444',
        bus: '#059669',
        busHover: '#10b981',
        selected: '#facc15',      // Bright yellow for selected line
        selectedWeight: 7,
        stopMajor: '#2563eb',
        stopRegular: '#3b82f6',
        stopTerminal: '#1d4ed8'
    };

    /**
     * Initialize the map
     */
    function initMap() {
        // Create map centered on Ruse
        state.map = L.map('map', {
            center: TRANSIT_DATA.center,
            zoom: TRANSIT_DATA.defaultZoom,
            zoomControl: true,
            attributionControl: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(state.map);

        // Position zoom control
        state.map.zoomControl.setPosition('topright');

        // Add routes and stops
        addRoutesToMap();
        addStopsToMap();

        // Hide loading overlay
        setTimeout(() => {
            elements.loadingOverlay.classList.add('hidden');
        }, 500);
    }

    /**
     * Add transit routes to the map
     */
    function addRoutesToMap() {
        const routesGeoJSON = createRoutesGeoJSON();

        routesGeoJSON.features.forEach(feature => {
            const lineId = feature.properties.id;
            const type = feature.properties.type;
            const color = type === 'trolleybus' ? COLORS.trolleybus : COLORS.bus;
            const hoverColor = type === 'trolleybus' ? COLORS.trolleybusHover : COLORS.busHover;

            const layer = L.geoJSON(feature, {
                style: {
                    color: color,
                    weight: 4,
                    opacity: 0.8,
                    lineCap: 'round',
                    lineJoin: 'round'
                }
            });

            // Add hover effects
            layer.on('mouseover', function(e) {
                e.target.setStyle({
                    weight: 6,
                    color: hoverColor,
                    opacity: 1
                });
            });

            layer.on('mouseout', function(e) {
                if (state.selectedLine === lineId) {
                    // Keep selected style (bright yellow)
                    e.target.setStyle({
                        weight: COLORS.selectedWeight,
                        color: COLORS.selected,
                        opacity: 1
                    });
                } else {
                    // Reset to normal style
                    e.target.setStyle({
                        weight: 4,
                        color: color,
                        opacity: 0.8
                    });
                }
            });

            // Add click handler
            layer.on('click', function() {
                selectLine(lineId);
            });

            // Add popup
            layer.bindPopup(createRoutePopup(feature.properties));

            // Store layer reference
            state.routeLayers[lineId] = layer;
            layer.addTo(state.map);
        });
    }

    /**
     * Add stop markers to the map
     */
    function addStopsToMap() {
        const stopsGeoJSON = createStopsGeoJSON();

        stopsGeoJSON.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;

            // Determine marker size based on stop type
            let radius = 6;
            let color = COLORS.stopRegular;
            if (props.type === 'major') {
                radius = 8;
                color = COLORS.stopMajor;
            } else if (props.type === 'terminal') {
                radius = 7;
                color = COLORS.stopTerminal;
            }

            const marker = L.circleMarker([coords[1], coords[0]], {
                radius: radius,
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });

            // Create popup content
            marker.bindPopup(createStopPopup(props));

            marker.addTo(state.map);
            state.stopMarkers.push({
                marker: marker,
                data: props
            });
        });
    }

    /**
     * Create popup content for a route
     * Note: Content is from hardcoded data, safe from XSS
     */
    function createRoutePopup(props) {
        const typeLabel = props.type === 'trolleybus' ? 'Тролейбус' : 'Автобус';
        const badgeClass = props.type === 'trolleybus' ? 'trolleybus' : 'bus';

        const container = document.createElement('div');
        container.className = 'popup-content';

        const title = document.createElement('div');
        title.className = 'popup-title';

        const badge = document.createElement('span');
        badge.className = 'popup-line-badge ' + badgeClass;
        badge.textContent = props.number;

        title.appendChild(badge);
        title.appendChild(document.createTextNode(' ' + typeLabel));

        const route = document.createElement('div');
        route.className = 'popup-route';
        route.textContent = props.route;

        container.appendChild(title);
        container.appendChild(route);

        return container;
    }

    /**
     * Create popup content for a stop with estimated arrival times
     * Note: Content is from hardcoded data, safe from XSS
     */
    function createStopPopup(props) {
        const container = document.createElement('div');
        container.className = 'popup-content stop-popup';

        const title = document.createElement('div');
        title.className = 'popup-title';
        title.textContent = props.name;

        const subtitle = document.createElement('div');
        subtitle.className = 'popup-subtitle';
        subtitle.textContent = 'Линии и ориентировъчно време:';
        subtitle.style.cssText = 'font-size: 0.75rem; color: #64748b; margin: 4px 0 8px;';

        const linesDiv = document.createElement('div');
        linesDiv.className = 'popup-lines-arrivals';
        linesDiv.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

        props.lines.forEach(lineId => {
            const isTrolley = lineId.startsWith('T');
            const number = lineId.substring(1);
            const line = getLineById(lineId);

            const lineRow = document.createElement('div');
            lineRow.className = 'popup-line-row';
            lineRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px;';

            const badge = document.createElement('span');
            badge.className = 'popup-line-badge ' + (isTrolley ? 'trolleybus' : 'bus');
            badge.textContent = number;
            badge.style.cssText = 'cursor: pointer;';
            badge.title = 'Кликни за детайли';
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                selectLine(lineId);
            });

            const arrivalInfo = document.createElement('span');
            arrivalInfo.className = 'arrival-info';
            arrivalInfo.style.cssText = 'font-size: 0.75rem; color: #059669; font-weight: 500;';

            if (line && typeof calculateEstimatedArrival === 'function') {
                const arrival = calculateEstimatedArrival(line, props.name);
                arrivalInfo.textContent = arrival.message;
                if (!arrival.available) {
                    arrivalInfo.style.color = '#dc2626';
                } else if (arrival.minutesUntil <= 3) {
                    arrivalInfo.style.color = '#059669';
                    arrivalInfo.style.fontWeight = '700';
                }
            } else {
                arrivalInfo.textContent = line ? line.schedule.weekday.frequency : '';
            }

            lineRow.appendChild(badge);
            lineRow.appendChild(arrivalInfo);
            linesDiv.appendChild(lineRow);
        });

        container.appendChild(title);
        container.appendChild(subtitle);
        container.appendChild(linesDiv);

        return container;
    }

    /**
     * Populate the lines list in the sidebar
     * Uses DOM methods for safe element creation
     */
    function populateLinesList() {
        // Clear existing content
        elements.linesList.textContent = '';

        // Trolleybus section
        const trolleyGroup = createLineGroup('trolleybus', 'Тролейбуси', TRANSIT_DATA.trolleybusLines);
        elements.linesList.appendChild(trolleyGroup);

        // Bus section
        const busGroup = createLineGroup('bus', 'Автобуси', TRANSIT_DATA.busLines);
        elements.linesList.appendChild(busGroup);
    }

    /**
     * Create a line group element
     */
    function createLineGroup(type, title, lines) {
        const group = document.createElement('div');
        group.className = 'line-group';
        group.dataset.type = type;

        const groupTitle = document.createElement('div');
        groupTitle.className = 'line-group-title';
        groupTitle.textContent = title;
        group.appendChild(groupTitle);

        lines.forEach(line => {
            const item = createLineItemElement(line);
            group.appendChild(item);
        });

        return group;
    }

    /**
     * Create a line item element
     */
    function createLineItemElement(line) {
        const item = document.createElement('div');
        item.className = 'line-item';
        item.dataset.lineId = line.id;
        item.dataset.type = line.type;

        const badge = document.createElement('span');
        badge.className = 'line-badge ' + (line.type === 'trolleybus' ? 'trolleybus' : 'bus');
        badge.textContent = line.number;

        const info = document.createElement('div');
        info.className = 'line-item-info';

        const name = document.createElement('div');
        name.className = 'line-item-name';
        name.textContent = line.name;

        const route = document.createElement('div');
        route.className = 'line-item-route';
        route.textContent = line.route;

        info.appendChild(name);
        info.appendChild(route);

        item.appendChild(badge);
        item.appendChild(info);

        // Add click handler
        item.addEventListener('click', () => {
            selectLine(line.id);
        });

        return item;
    }

    /**
     * Select and highlight a line
     */
    function selectLine(lineId) {
        // Reset previous selection
        if (state.selectedLine && state.routeLayers[state.selectedLine]) {
            const prevLine = getLineById(state.selectedLine);
            if (prevLine) {
                const color = prevLine.type === 'trolleybus' ? COLORS.trolleybus : COLORS.bus;
                state.routeLayers[state.selectedLine].setStyle({
                    weight: 4,
                    color: color,
                    opacity: 0.8
                });
            }
        }

        // Update state
        state.selectedLine = lineId;

        // Highlight new selection with bright yellow color
        if (state.routeLayers[lineId]) {
            state.routeLayers[lineId].setStyle({
                weight: COLORS.selectedWeight,
                color: COLORS.selected,
                opacity: 1
            });
            state.routeLayers[lineId].bringToFront();

            // Fit map to route bounds
            const bounds = state.routeLayers[lineId].getBounds();
            state.map.fitBounds(bounds, { padding: [50, 50] });
        }

        // Update sidebar
        showLineDetails(lineId);

        // Update active state in list
        elements.linesList.querySelectorAll('.line-item').forEach(item => {
            item.classList.toggle('active', item.dataset.lineId === lineId);
        });

        // On mobile, close sidebar after selection
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                closeSidebar();
            }, 300);
        }
    }

    /**
     * Show line details in sidebar
     */
    function showLineDetails(lineId) {
        const line = getLineById(lineId);
        if (!line) return;

        const badgeClass = line.type === 'trolleybus' ? 'trolleybus' : 'bus';
        const typeLabel = line.type === 'trolleybus' ? 'Тролейбус' : 'Автобус';

        // Update header
        const detailBadge = document.getElementById('detailBadge');
        detailBadge.textContent = line.number;
        detailBadge.className = 'line-badge ' + badgeClass;

        document.getElementById('detailName').textContent = line.name;
        document.getElementById('detailType').textContent = typeLabel;

        // Update route stops
        const routeContainer = document.getElementById('detailRoute');
        routeContainer.textContent = '';

        line.stops.forEach(stop => {
            const stopEl = document.createElement('div');
            stopEl.className = 'route-stop';

            const marker = document.createElement('div');
            marker.className = 'stop-marker';

            const nameEl = document.createElement('div');
            nameEl.className = 'stop-name';
            nameEl.textContent = stop;

            stopEl.appendChild(marker);
            stopEl.appendChild(nameEl);
            routeContainer.appendChild(stopEl);
        });

        // Update schedule
        const scheduleContent = document.querySelector('.schedule-content');
        scheduleContent.textContent = '';

        if (line.schedule) {
            // Weekday row
            const weekdayRow = document.createElement('div');
            weekdayRow.className = 'schedule-row';
            const weekdayLabel = document.createElement('span');
            weekdayLabel.textContent = 'Делник:';
            const weekdayValue = document.createElement('span');
            weekdayValue.textContent = line.schedule.weekday.first + ' - ' + line.schedule.weekday.last;
            weekdayRow.appendChild(weekdayLabel);
            weekdayRow.appendChild(weekdayValue);
            scheduleContent.appendChild(weekdayRow);

            // Frequency row
            const freqRow = document.createElement('div');
            freqRow.className = 'schedule-row';
            const freqLabel = document.createElement('span');
            freqLabel.textContent = 'Интервал:';
            const freqValue = document.createElement('span');
            freqValue.textContent = line.schedule.weekday.frequency;
            freqRow.appendChild(freqLabel);
            freqRow.appendChild(freqValue);
            scheduleContent.appendChild(freqRow);

            // Weekend row
            if (line.schedule.weekend.first) {
                const weekendRow = document.createElement('div');
                weekendRow.className = 'schedule-row';
                const weekendLabel = document.createElement('span');
                weekendLabel.textContent = 'Почивен ден:';
                const weekendValue = document.createElement('span');
                weekendValue.textContent = line.schedule.weekend.first + ' - ' + line.schedule.weekend.last;
                weekendRow.appendChild(weekendLabel);
                weekendRow.appendChild(weekendValue);
                scheduleContent.appendChild(weekendRow);
            }

            // Departures (if available)
            if (line.schedule.weekday.departures) {
                const depsDiv = document.createElement('div');
                depsDiv.className = 'schedule-departures';
                depsDiv.style.marginTop = '8px';
                depsDiv.style.fontSize = '0.75rem';

                const depsLabel = document.createElement('strong');
                depsLabel.textContent = 'Тръгвания:';
                depsDiv.appendChild(depsLabel);
                depsDiv.appendChild(document.createElement('br'));
                depsDiv.appendChild(document.createTextNode(line.schedule.weekday.departures));

                scheduleContent.appendChild(depsDiv);
            }
        }

        // Show details panel, hide list
        elements.lineDetails.classList.add('active');
        elements.linesList.classList.add('hidden');
    }

    /**
     * Hide line details and show list
     */
    function hideLineDetails() {
        elements.lineDetails.classList.remove('active');
        elements.linesList.classList.remove('hidden');

        // Reset line highlight
        if (state.selectedLine && state.routeLayers[state.selectedLine]) {
            const line = getLineById(state.selectedLine);
            if (line) {
                const color = line.type === 'trolleybus' ? COLORS.trolleybus : COLORS.bus;
                state.routeLayers[state.selectedLine].setStyle({
                    weight: 4,
                    color: color,
                    opacity: 0.8
                });
            }
        }
        state.selectedLine = null;

        // Remove active state from list items
        elements.linesList.querySelectorAll('.line-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    /**
     * Get line data by ID
     */
    function getLineById(lineId) {
        const allLines = [...TRANSIT_DATA.trolleybusLines, ...TRANSIT_DATA.busLines];
        return allLines.find(line => line.id === lineId);
    }

    /**
     * Filter lines by type
     */
    function filterLines(filterType) {
        state.activeFilter = filterType;

        // Update filter tabs
        elements.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filterType);
        });

        // Filter line items
        elements.linesList.querySelectorAll('.line-group').forEach(group => {
            const groupType = group.dataset.type;
            if (filterType === 'all') {
                group.style.display = 'block';
            } else {
                group.style.display = groupType === filterType ? 'block' : 'none';
            }
        });

        // Filter map layers
        Object.keys(state.routeLayers).forEach(lineId => {
            const layer = state.routeLayers[lineId];
            const line = getLineById(lineId);
            if (line) {
                if (filterType === 'all' || line.type === filterType) {
                    layer.addTo(state.map);
                } else {
                    state.map.removeLayer(layer);
                }
            }
        });
    }

    /**
     * Search lines and stops
     */
    function searchLines(query) {
        const normalizedQuery = query.toLowerCase().trim();

        elements.linesList.querySelectorAll('.line-item').forEach(item => {
            const lineId = item.dataset.lineId;
            const line = getLineById(lineId);

            if (normalizedQuery === '') {
                item.style.display = 'flex';
            } else {
                const matchesNumber = line.number.includes(normalizedQuery);
                const matchesRoute = line.route.toLowerCase().includes(normalizedQuery);
                const matchesStops = line.stops.some(stop =>
                    stop.toLowerCase().includes(normalizedQuery)
                );

                item.style.display = (matchesNumber || matchesRoute || matchesStops) ? 'flex' : 'none';
            }
        });

        // Show/hide group titles based on visible items
        elements.linesList.querySelectorAll('.line-group').forEach(group => {
            const visibleItems = group.querySelectorAll('.line-item[style*="flex"]').length;
            const hiddenItems = group.querySelectorAll('.line-item[style*="none"]').length;
            const allHidden = hiddenItems > 0 && visibleItems === 0;
            group.style.display = allHidden ? 'none' : 'block';
        });
    }

    /**
     * Toggle sidebar on mobile
     */
    function toggleSidebar() {
        state.sidebarOpen = !state.sidebarOpen;
        elements.sidebar.classList.toggle('open', state.sidebarOpen);
        elements.menuToggle.classList.toggle('active', state.sidebarOpen);
    }

    /**
     * Close sidebar
     */
    function closeSidebar() {
        state.sidebarOpen = false;
        elements.sidebar.classList.remove('open');
        elements.menuToggle.classList.remove('active');
    }

    /**
     * Locate user on map
     */
    function locateUser() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    state.map.setView([latitude, longitude], 16);

                    // Add user marker
                    const markerIcon = L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="width: 16px; height: 16px; background: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    L.marker([latitude, longitude], { icon: markerIcon })
                        .addTo(state.map)
                        .bindPopup('Вашата локация')
                        .openPopup();
                },
                error => {
                    console.error('Geolocation error:', error);
                    alert('Не може да се определи локацията. Моля, разрешете достъп до местоположението.');
                }
            );
        } else {
            alert('Браузърът не поддържа геолокация.');
        }
    }

    /**
     * Reset map to default view
     */
    function resetMapView() {
        state.map.setView(TRANSIT_DATA.center, TRANSIT_DATA.defaultZoom);
        hideLineDetails();
        filterLines('all');
        elements.searchInput.value = '';
        searchLines('');
    }

    /**
     * Toggle legend visibility on mobile
     */
    function toggleLegend() {
        elements.mapLegend.classList.toggle('expanded');
        const btn = elements.legendToggle;
        btn.textContent = elements.mapLegend.classList.contains('expanded')
            ? 'Легенда ▲'
            : 'Легенда ▼';
    }

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Menu toggle
        elements.menuToggle.addEventListener('click', toggleSidebar);

        // Filter tabs
        elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterLines(tab.dataset.filter);
            });
        });

        // Search input
        elements.searchInput.addEventListener('input', (e) => {
            searchLines(e.target.value);
        });

        // Back button
        elements.backBtn.addEventListener('click', hideLineDetails);

        // Map controls
        elements.locateBtn.addEventListener('click', locateUser);
        elements.resetBtn.addEventListener('click', resetMapView);

        // Legend toggle
        elements.legendToggle.addEventListener('click', toggleLegend);

        // Modal close
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', () => {
                elements.infoModal.classList.remove('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        elements.map.addEventListener('click', () => {
            if (window.innerWidth <= 768 && state.sidebarOpen) {
                closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
            state.map.invalidateSize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (elements.infoModal.classList.contains('active')) {
                    elements.infoModal.classList.remove('active');
                } else if (state.selectedLine) {
                    hideLineDetails();
                } else if (state.sidebarOpen) {
                    closeSidebar();
                }
            }
        });
    }

    /**
     * Initialize the application
     */
    function init() {
        console.log('Initializing Ruse Transit Map...');

        // Check for required data
        if (typeof TRANSIT_DATA === 'undefined') {
            console.error('Transit data not loaded');
            return;
        }

        // Initialize map
        initMap();

        // Populate sidebar
        populateLinesList();

        // Set up event listeners
        initEventListeners();

        console.log('Ruse Transit Map initialized successfully');
    }

    // Start application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
