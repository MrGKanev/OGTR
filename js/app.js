/**
 * Ruse Transit Map Application
 * Interactive public transit map for Ruse, Bulgaria
 *
 * Uses normalized data structure with stop IDs for reliable lookups
 */

(function() {
    'use strict';

    // ================================
    // Constants
    // ================================
    const TIMING = {
        LOADING_OVERLAY_DELAY: 500,
        MOBILE_CLOSE_DELAY: 300,
        DEEP_LINK_DELAY: 500,
        TOAST_DURATION: 3000,
        PRINT_TITLE_RESTORE: 1000,
        INSTALL_PROMPT_DELAY: 30000,
        GEOLOCATION_TIMEOUT: 10000,
        SEARCH_DEBOUNCE: 300
    };

    // ================================
    // i18n helper
    // ================================
    function t(key, params) {
        return typeof I18n !== 'undefined' ? I18n.t(key, params) : key;
    }

    // ================================
    // Safe localStorage helpers
    // ================================
    function safeGetItem(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? item : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            return false;
        }
    }

    function safeGetJSON(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    // ================================
    // Debounce utility
    // ================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Application state
    const state = {
        map: null,
        routeLayers: {},
        stopMarkers: [],
        activeFilter: 'all',
        selectedLine: null,
        sidebarOpen: false,
        darkMode: safeGetItem('darkMode', 'false') === 'true',
        favorites: safeGetJSON('favorites', { lines: [], stops: [] }),
        deferredInstallPrompt: null,
        userLocation: null,
        userLocationMarker: null,
        nearbyPanelOpen: false,
        routePlannerOpen: false,
        routeFromStopId: null,
        routeToStopId: null,
        routePlannerLayers: [],
        walkingLine: null
    };

    // DOM Elements with validation
    function getElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Element with id "${id}" not found`);
        }
        return el;
    }

    const elements = {
        map: getElement('map'),
        sidebar: getElement('sidebar'),
        menuToggle: getElement('menuToggle'),
        linesList: getElement('linesList'),
        lineDetails: getElement('lineDetails'),
        searchInput: getElement('searchInput'),
        searchClear: getElement('searchClear'),
        filterTabs: document.querySelectorAll('.filter-tab'),
        backBtn: getElement('backBtn'),
        locateBtn: getElement('locateBtn'),
        resetBtn: getElement('resetBtn'),
        legendToggle: getElement('legendToggle'),
        mapLegend: getElement('mapLegend'),
        loadingOverlay: getElement('loadingOverlay'),
        infoModal: getElement('infoModal'),
        modalClose: getElement('modalClose'),
        // New elements
        darkModeToggle: getElement('darkModeToggle'),
        offlineIndicator: getElement('offlineIndicator'),
        installPrompt: getElement('installPrompt'),
        installBtn: getElement('installBtn'),
        installClose: getElement('installClose'),
        nearbyBtn: getElement('nearbyBtn'),
        favoritesBtn: getElement('favoritesBtn'),
        nearbyPanel: getElement('nearbyPanel'),
        nearbyContent: getElement('nearbyContent'),
        nearbyClose: getElement('nearbyClose'),
        favoriteLineBtn: getElement('favoriteLineBtn'),
        exportScheduleBtn: getElement('exportScheduleBtn'),
        shareLineBtn: getElement('shareLineBtn'),
        shortcutsModal: getElement('shortcutsModal'),
        shortcutsClose: getElement('shortcutsClose'),
        routePlannerPanel: getElement('routePlannerPanel'),
        routePlannerBtn: getElement('routePlannerBtn'),
        routePlannerClose: getElement('routePlannerClose'),
        routeFrom: getElement('routeFrom'),
        routeTo: getElement('routeTo'),
        routeFromSuggestions: getElement('routeFromSuggestions'),
        routeToSuggestions: getElement('routeToSuggestions'),
        routeSwapBtn: getElement('routeSwapBtn'),
        routeSearchBtn: getElement('routeSearchBtn'),
        routeResults: getElement('routeResults'),
        stopSearchResults: null // Created during init
    };

    // Validate critical elements
    function validateElements() {
        const critical = ['map', 'sidebar', 'linesList'];
        const missing = critical.filter(id => !elements[id]);
        if (missing.length > 0) {
            throw new Error(`Critical elements missing: ${missing.join(', ')}`);
        }
    }

    // Colors
    const COLORS = {
        trolleybus: '#dc2626',
        trolleybusHover: '#ef4444',
        bus: '#059669',
        busHover: '#10b981',
        selected: '#facc15',
        selectedWeight: 7,
        stopMajor: '#2563eb',
        stopRegular: '#3b82f6',
        stopTerminal: '#1d4ed8'
    };

    /**
     * Initialize the map
     */
    async function initMap() {
        state.map = L.map('map', {
            center: TRANSIT_DATA.center,
            zoom: TRANSIT_DATA.defaultZoom,
            zoomControl: true,
            attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(state.map);

        state.map.zoomControl.setPosition('topright');

        // Add stops immediately (no async dependency)
        addStopsToMap();

        // Fetch route geometries async, then add routes
        await TRANSIT_DATA.loadRouteGeometries();
        addRoutesToMap();

        setTimeout(() => {
            if (elements.loadingOverlay) {
                elements.loadingOverlay.classList.add('hidden');
            }
        }, TIMING.LOADING_OVERLAY_DELAY);
    }

    /**
     * Add transit routes to the map
     */
    function addRoutesToMap() {
        const routesGeoJSON = TRANSIT_DATA.createRoutesGeoJSON();

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

            layer.on('mouseover', function(e) {
                e.target.setStyle({
                    weight: 6,
                    color: hoverColor,
                    opacity: 1
                });
            });

            layer.on('mouseout', function(e) {
                if (state.selectedLine === lineId) {
                    e.target.setStyle({
                        weight: COLORS.selectedWeight,
                        color: COLORS.selected,
                        opacity: 1
                    });
                } else {
                    e.target.setStyle({
                        weight: 4,
                        color: color,
                        opacity: 0.8
                    });
                }
            });

            layer.on('click', function() {
                selectLine(lineId);
            });

            layer.bindPopup(createRoutePopup(feature.properties));

            state.routeLayers[lineId] = layer;
            layer.addTo(state.map);
        });
    }

    /**
     * Add stop markers to the map (with clustering)
     */
    function addStopsToMap() {
        const stopsGeoJSON = TRANSIT_DATA.createStopsGeoJSON();

        const clusterGroup = L.markerClusterGroup({
            maxClusterRadius: 40,
            disableClusteringAtZoom: 15,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: '<div class="stop-cluster-icon">' + count + '</div>',
                    className: 'stop-cluster',
                    iconSize: [32, 32]
                });
            }
        });

        stopsGeoJSON.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;

            let dotClass = 'regular';
            if (props.type === 'major') dotClass = 'major';
            else if (props.type === 'terminal') dotClass = 'terminal';

            const icon = L.divIcon({
                html: '<div class="stop-dot ' + dotClass + '"></div>',
                className: 'stop-marker-wrapper',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            const marker = L.marker([coords[1], coords[0]], { icon: icon });
            marker.bindPopup(createStopPopup(props));

            clusterGroup.addLayer(marker);
            state.stopMarkers.push({
                marker: marker,
                data: props
            });
        });

        state.stopClusterGroup = clusterGroup;
        state.map.addLayer(clusterGroup);
    }

    /**
     * Create popup content for a route
     */
    function createRoutePopup(props) {
        const typeLabel = props.type === 'trolleybus' ? t('trolleybus') : t('bus');
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
     */
    function createStopPopup(props) {
        const container = document.createElement('div');
        container.className = 'popup-content stop-popup';

        const title = document.createElement('div');
        title.className = 'popup-title';
        title.textContent = props.name;

        const subtitle = document.createElement('div');
        subtitle.className = 'popup-subtitle';
        subtitle.textContent = t('lines_arrival');

        const linesDiv = document.createElement('div');
        linesDiv.className = 'popup-lines-arrivals';

        props.lines.forEach(lineId => {
            const isTrolley = lineId.startsWith('T');
            const line = TRANSIT_DATA.getLine(lineId);
            if (!line) return;

            const lineRow = document.createElement('div');
            lineRow.className = 'popup-line-row';

            const badge = document.createElement('span');
            badge.className = 'popup-line-badge ' + (isTrolley ? 'trolleybus' : 'bus');
            badge.textContent = line.number;
            badge.style.cursor = 'pointer';
            badge.title = t('click_details');
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                selectLine(lineId);
            });

            const arrivalInfo = document.createElement('span');
            arrivalInfo.className = 'arrival-info';

            const arrival = TRANSIT_DATA.calculateEstimatedArrival(lineId, props.id);
            arrivalInfo.textContent = arrival.message;
            if (!arrival.available) {
                arrivalInfo.classList.add('not-available');
            } else if (arrival.minutesUntil <= 3) {
                arrivalInfo.classList.add('arriving-soon');
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
     */
    function populateLinesList() {
        elements.linesList.textContent = '';

        // Create stop search results container once
        if (!elements.stopSearchResults) {
            const container = document.createElement('div');
            container.id = 'stopSearchResults';
            container.className = 'stop-search-results';
            container.style.display = 'none';
            elements.linesList.parentNode.insertBefore(container, elements.linesList);
            elements.stopSearchResults = container;
        }

        const trolleyGroup = createLineGroup('trolleybus', 'Тролейбуси', TRANSIT_DATA.getTrolleybusLines());
        elements.linesList.appendChild(trolleyGroup);

        const busGroup = createLineGroup('bus', 'Автобуси', TRANSIT_DATA.getBusLines());
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

        item.addEventListener('click', () => {
            selectLine(line.id);
        });

        return item;
    }

    /**
     * Select and highlight a line
     */
    function selectLine(lineId) {
        if (state.selectedLine && state.routeLayers[state.selectedLine]) {
            const prevLine = TRANSIT_DATA.getLine(state.selectedLine);
            if (prevLine) {
                const color = prevLine.type === 'trolleybus' ? COLORS.trolleybus : COLORS.bus;
                state.routeLayers[state.selectedLine].setStyle({
                    weight: 4,
                    color: color,
                    opacity: 0.8
                });
            }
        }

        state.selectedLine = lineId;

        if (state.routeLayers[lineId]) {
            state.routeLayers[lineId].setStyle({
                weight: COLORS.selectedWeight,
                color: COLORS.selected,
                opacity: 1
            });
            state.routeLayers[lineId].bringToFront();

            const bounds = state.routeLayers[lineId].getBounds();
            state.map.fitBounds(bounds, { padding: [50, 50] });
        }

        showLineDetails(lineId);
        updateFavoriteButton();
        updateUrl('line', lineId);

        elements.linesList.querySelectorAll('.line-item').forEach(item => {
            item.classList.toggle('active', item.dataset.lineId === lineId);
        });

        if (window.innerWidth <= 768) {
            setTimeout(() => {
                closeSidebar();
            }, TIMING.MOBILE_CLOSE_DELAY);
        }
    }

    /**
     * Show line details in sidebar
     */
    function showLineDetails(lineId) {
        let line = TRANSIT_DATA.getLine(lineId);
        let isCached = false;

        // Fallback to cached data when offline
        if (!line && !navigator.onLine) {
            const cached = getCachedLine(lineId);
            if (cached) {
                line = cached;
                isCached = true;
            }
        }
        if (!line) return;

        // Cache for offline use
        if (!isCached) {
            cacheLineForOffline(lineId);
        }

        const badgeClass = line.type === 'trolleybus' ? 'trolleybus' : 'bus';
        const typeLabel = line.type === 'trolleybus' ? t('trolleybus') : t('bus');

        const detailBadge = document.getElementById('detailBadge');
        detailBadge.textContent = line.number;
        detailBadge.className = 'line-badge ' + badgeClass;

        document.getElementById('detailName').textContent = line.name;
        const detailTypeEl = document.getElementById('detailType');
        detailTypeEl.textContent = typeLabel;

        // Show cached badge
        const existingBadge = detailTypeEl.parentNode.querySelector('.cached-badge');
        if (existingBadge) existingBadge.remove();
        if (isCached) {
            const cachedBadge = document.createElement('span');
            cachedBadge.className = 'cached-badge';
            cachedBadge.textContent = t('cached');
            detailTypeEl.parentNode.appendChild(cachedBadge);
        }

        const routeContainer = document.getElementById('detailRoute');
        routeContainer.textContent = '';

        // Get stops - use cached data if available
        const lineStops = isCached && line.stopsData ? line.stopsData : TRANSIT_DATA.getLineStops(lineId);
        lineStops.forEach(stop => {
            const stopEl = document.createElement('div');
            stopEl.className = 'route-stop';

            const marker = document.createElement('div');
            marker.className = 'stop-marker';

            const nameEl = document.createElement('div');
            nameEl.className = 'stop-name';
            nameEl.textContent = stop.name;

            stopEl.appendChild(marker);
            stopEl.appendChild(nameEl);
            routeContainer.appendChild(stopEl);
        });

        const scheduleContent = document.querySelector('.schedule-content');
        scheduleContent.textContent = '';

        if (line.schedule) {
            const weekdayRow = document.createElement('div');
            weekdayRow.className = 'schedule-row';
            const weekdayLabel = document.createElement('span');
            weekdayLabel.textContent = t('weekday');
            const weekdayValue = document.createElement('span');
            weekdayValue.textContent = line.schedule.weekday.first + ' - ' + line.schedule.weekday.last;
            weekdayRow.appendChild(weekdayLabel);
            weekdayRow.appendChild(weekdayValue);
            scheduleContent.appendChild(weekdayRow);

            const freqRow = document.createElement('div');
            freqRow.className = 'schedule-row';
            const freqLabel = document.createElement('span');
            freqLabel.textContent = t('interval');
            const freqValue = document.createElement('span');
            freqValue.textContent = line.schedule.weekday.frequency;
            freqRow.appendChild(freqLabel);
            freqRow.appendChild(freqValue);
            scheduleContent.appendChild(freqRow);

            if (line.schedule.weekend.first) {
                const weekendRow = document.createElement('div');
                weekendRow.className = 'schedule-row';
                const weekendLabel = document.createElement('span');
                weekendLabel.textContent = t('weekend');
                const weekendValue = document.createElement('span');
                weekendValue.textContent = line.schedule.weekend.first + ' - ' + line.schedule.weekend.last;
                weekendRow.appendChild(weekendLabel);
                weekendRow.appendChild(weekendValue);
                scheduleContent.appendChild(weekendRow);
            }
        }

        elements.lineDetails.classList.add('active');
        elements.linesList.classList.add('hidden');
    }

    /**
     * Hide line details and show list
     */
    function hideLineDetails() {
        elements.lineDetails.classList.remove('active');
        elements.linesList.classList.remove('hidden');

        if (state.selectedLine && state.routeLayers[state.selectedLine]) {
            const line = TRANSIT_DATA.getLine(state.selectedLine);
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

        // Clear URL hash
        if (window.location.hash) {
            history.pushState(null, '', window.location.pathname);
        }

        elements.linesList.querySelectorAll('.line-item').forEach(item => {
            item.classList.remove('active');
        });

        // Re-apply current filter (preserves favorites, type filters, etc.)
        if (state.activeFilter === 'favorites') {
            filterFavorites();
        } else {
            filterLines(state.activeFilter);
        }
    }

    /**
     * Read ?filter= from URL and apply
     */
    function initFilterFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const filter = params.get('filter');
        if (filter && ['all', 'trolleybus', 'bus', 'favorites'].includes(filter)) {
            if (filter === 'favorites') {
                state.activeFilter = 'favorites';
                elements.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'favorites'));
                filterFavorites();
            } else {
                filterLines(filter);
            }
        }
    }

    /**
     * Filter lines by type
     */
    function filterLines(filterType) {
        state.activeFilter = filterType;

        // Persist filter in URL
        const url = new URL(window.location);
        if (filterType === 'all') {
            url.searchParams.delete('filter');
        } else {
            url.searchParams.set('filter', filterType);
        }
        history.replaceState(null, '', url);

        elements.filterTabs.forEach(tab => {
            const isActive = tab.dataset.filter === filterType;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
        elements.linesList.setAttribute('aria-labelledby', 'tab-' + filterType);

        elements.linesList.querySelectorAll('.line-group').forEach(group => {
            const groupType = group.dataset.type;
            if (filterType === 'all') {
                group.style.display = 'block';
            } else {
                group.style.display = groupType === filterType ? 'block' : 'none';
            }
        });

        Object.keys(state.routeLayers).forEach(lineId => {
            const layer = state.routeLayers[lineId];
            const line = TRANSIT_DATA.getLine(lineId);
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

        elements.stopSearchResults.textContent = '';
        elements.stopSearchResults.style.display = 'none';

        if (normalizedQuery === '') {
            elements.linesList.querySelectorAll('.line-item').forEach(item => {
                item.style.display = 'flex';
            });
            elements.linesList.querySelectorAll('.line-group').forEach(group => {
                group.style.display = 'block';
            });
            return;
        }

        // Use the new searchStops function which also searches aliases
        const matchingStops = TRANSIT_DATA.searchStops(normalizedQuery);

        if (matchingStops.length > 0) {
            elements.stopSearchResults.style.display = 'block';

            const title = document.createElement('div');
            title.className = 'stop-results-title';
            title.textContent = t('stops_results');
            elements.stopSearchResults.appendChild(title);

            matchingStops.forEach(stop => {
                const stopCard = createStopSearchResult(stop);
                elements.stopSearchResults.appendChild(stopCard);
            });
        }

        // Also filter lines
        elements.linesList.querySelectorAll('.line-item').forEach(item => {
            const lineId = item.dataset.lineId;
            const line = TRANSIT_DATA.getLine(lineId);

            const matchesNumber = line.number.includes(normalizedQuery);
            const matchesRoute = line.route.toLowerCase().includes(normalizedQuery);

            // Check if any stop name matches
            const lineStops = TRANSIT_DATA.getLineStops(lineId);
            const matchesStops = lineStops.some(stop =>
                stop.name.toLowerCase().includes(normalizedQuery)
            );

            item.style.display = (matchesNumber || matchesRoute || matchesStops) ? 'flex' : 'none';
        });

        elements.linesList.querySelectorAll('.line-group').forEach(group => {
            const visibleItems = group.querySelectorAll('.line-item[style*="flex"]').length;
            const hiddenItems = group.querySelectorAll('.line-item[style*="none"]').length;
            const allHidden = hiddenItems > 0 && visibleItems === 0;
            group.style.display = allHidden ? 'none' : 'block';
        });
    }

    /**
     * Create a stop search result card
     */
    function createStopSearchResult(stop) {
        const card = document.createElement('div');
        card.className = 'stop-search-card';

        const header = document.createElement('div');
        header.className = 'stop-card-header';

        const icon = document.createElement('span');
        icon.textContent = '\ud83d\udccd';
        header.appendChild(icon);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = stop.name;
        header.appendChild(nameSpan);

        card.appendChild(header);

        const linesContainer = document.createElement('div');
        linesContainer.className = 'stop-lines-container';

        stop.lines.forEach(lineId => {
            const line = TRANSIT_DATA.getLine(lineId);
            if (!line) return;

            const isTrolley = lineId.startsWith('T');
            const lineRow = document.createElement('div');
            lineRow.className = 'stop-line-row';

            const lineInfo = document.createElement('div');
            lineInfo.className = 'stop-line-info';

            const badge = document.createElement('span');
            badge.className = 'line-badge stop-line-badge-small ' + (isTrolley ? 'trolleybus' : 'bus');
            badge.textContent = line.number;
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                selectLine(lineId);
            });

            const routeName = document.createElement('span');
            routeName.className = 'stop-line-route-name';
            routeName.textContent = line.route;

            lineInfo.appendChild(badge);
            lineInfo.appendChild(routeName);

            const arrivalTime = document.createElement('span');
            arrivalTime.className = 'arrival-time';

            const arrival = TRANSIT_DATA.calculateEstimatedArrival(lineId, stop.id);
            arrivalTime.textContent = arrival.message;

            if (!arrival.available) {
                arrivalTime.classList.add('not-running');
            } else if (arrival.minutesUntil <= 3) {
                arrivalTime.classList.add('arriving-soon');
            } else {
                arrivalTime.classList.add('running');
            }

            lineRow.appendChild(lineInfo);
            lineRow.appendChild(arrivalTime);
            linesContainer.appendChild(lineRow);
        });

        card.appendChild(linesContainer);

        card.addEventListener('click', () => {
            state.map.setView([stop.lat, stop.lng], 16);

            const stopMarker = state.stopMarkers.find(m => m.data.id === stop.id);
            if (stopMarker) {
                stopMarker.marker.openPopup();
            }

            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });

        return card;
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

                    // Remove previous location marker if exists
                    if (state.userLocationMarker) {
                        state.map.removeLayer(state.userLocationMarker);
                    }

                    const markerIcon = L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="width: 16px; height: 16px; background: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    state.userLocationMarker = L.marker([latitude, longitude], { icon: markerIcon })
                        .addTo(state.map)
                        .bindPopup(t('your_location'))
                        .openPopup();
                },
                error => {
                    let message = t('location_error');
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = t('location_denied');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = t('location_unavailable');
                            break;
                        case error.TIMEOUT:
                            message = t('location_timeout');
                            break;
                    }
                    showGeolocationError(message, locateUser);
                },
                { enableHighAccuracy: true, timeout: TIMING.GEOLOCATION_TIMEOUT }
            );
        } else {
            showGeolocationError(t('not_supported'), null);
        }
    }

    /**
     * Reset map to default view
     */
    function resetMapView() {
        state.map.setView(TRANSIT_DATA.center, TRANSIT_DATA.defaultZoom);
        hideLineDetails();
        state.activeFilter = 'all';
        elements.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === 'all');
        });
        filterLines('all');
        elements.searchInput.value = '';
        elements.searchClear.classList.remove('visible');
        searchLines('');
    }

    /**
     * Toggle legend visibility on mobile
     */
    function toggleLegend() {
        elements.mapLegend.classList.toggle('expanded');
        const btn = elements.legendToggle;
        btn.textContent = elements.mapLegend.classList.contains('expanded')
            ? 'Легенда \u25b2'
            : 'Легенда \u25bc';
    }

    // ================================
    // Dark Mode
    // ================================
    function updateThemeColor(isDark) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', isDark ? '#1e293b' : '#2563eb');
        }
    }

    function initDarkMode() {
        const saved = safeGetItem('darkMode', null);
        if (saved === null) {
            // No saved preference - detect OS preference
            state.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
        updateThemeColor(state.darkMode);
    }

    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        safeSetItem('darkMode', state.darkMode);
        document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
        updateThemeColor(state.darkMode);
        showToast(state.darkMode ? t('dark_mode_on') : t('light_mode_on'));
    }

    // ================================
    // Geolocation Error Banner
    // ================================
    function showGeolocationError(message, retryFn) {
        // Remove existing banner
        const existing = document.querySelector('.geo-error-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.className = 'geo-error-banner';
        banner.setAttribute('role', 'alert');

        const text = document.createElement('span');
        text.className = 'geo-error-text';
        text.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'geo-error-actions';

        if (retryFn) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'geo-error-retry';
            retryBtn.textContent = '↻';
            retryBtn.addEventListener('click', () => {
                banner.remove();
                retryFn();
            });
            actions.appendChild(retryBtn);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'geo-error-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => banner.remove());
        actions.appendChild(closeBtn);

        banner.appendChild(text);
        banner.appendChild(actions);

        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.insertBefore(banner, mapContainer.firstChild);
        }

        // Auto-dismiss after 10s
        setTimeout(() => {
            if (banner.parentNode) banner.remove();
        }, 10000);
    }

    // ================================
    // Offline Indicator
    // ================================
    function updateOnlineStatus() {
        const isOffline = !navigator.onLine;
        elements.offlineIndicator.classList.toggle('visible', isOffline);
        document.body.classList.toggle('is-offline', isOffline);
    }

    // ================================
    // PWA Install Prompt
    // ================================
    function initInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            state.deferredInstallPrompt = e;

            // Show prompt after delay if not already dismissed
            const dismissed = safeGetItem('installPromptDismissed', null);
            if (!dismissed) {
                setTimeout(() => {
                    if (state.deferredInstallPrompt && elements.installPrompt) {
                        elements.installPrompt.classList.add('visible');
                    }
                }, TIMING.INSTALL_PROMPT_DELAY);
            }
        });

        window.addEventListener('appinstalled', () => {
            state.deferredInstallPrompt = null;
            if (elements.installPrompt) {
                elements.installPrompt.classList.remove('visible');
            }
            showToast(t('app_installed'));
        });
    }

    function handleInstallClick() {
        if (!state.deferredInstallPrompt) return;

        state.deferredInstallPrompt.prompt();
        state.deferredInstallPrompt.userChoice.then(() => {
            state.deferredInstallPrompt = null;
            if (elements.installPrompt) {
                elements.installPrompt.classList.remove('visible');
            }
        });
    }

    function dismissInstallPrompt() {
        if (elements.installPrompt) {
            elements.installPrompt.classList.remove('visible');
        }
        safeSetItem('installPromptDismissed', 'true');
    }

    // ================================
    // Toast Notifications
    // ================================
    function showToast(message, duration = TIMING.TOAST_DURATION) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
        }, duration);
    }

    // ================================
    // Favorites
    // ================================
    function saveFavorites() {
        safeSetItem('favorites', JSON.stringify(state.favorites));
    }

    function toggleFavoriteLine(lineId) {
        const index = state.favorites.lines.indexOf(lineId);
        if (index > -1) {
            state.favorites.lines.splice(index, 1);
            showToast(t('removed_from_favorites'));
        } else {
            state.favorites.lines.push(lineId);
            showToast(t('added_to_favorites'));
        }
        saveFavorites();
        updateFavoriteButton();

        // Update line item in list
        const lineItem = elements.linesList.querySelector(`[data-line-id="${lineId}"]`);
        if (lineItem) {
            lineItem.classList.toggle('is-favorite', state.favorites.lines.includes(lineId));
        }
    }

    function toggleFavoriteStop(stopId) {
        const index = state.favorites.stops.indexOf(stopId);
        if (index > -1) {
            state.favorites.stops.splice(index, 1);
            showToast(t('stop_removed_fav'));
        } else {
            state.favorites.stops.push(stopId);
            showToast(t('stop_added_fav'));
        }
        saveFavorites();
    }

    function updateFavoriteButton() {
        if (!state.selectedLine) return;
        const isFavorite = state.favorites.lines.includes(state.selectedLine);
        elements.favoriteLineBtn.classList.toggle('is-favorite', isFavorite);
        elements.favoriteLineBtn.title = isFavorite ? 'Премахни от любими' : 'Добави в любими';
    }

    function filterFavorites() {
        if (state.favorites.lines.length === 0) {
            showToast(t('no_favorites'));
            return;
        }

        elements.linesList.querySelectorAll('.line-item').forEach(item => {
            const lineId = item.dataset.lineId;
            item.style.display = state.favorites.lines.includes(lineId) ? 'flex' : 'none';
        });

        elements.linesList.querySelectorAll('.line-group').forEach(group => {
            const visibleItems = group.querySelectorAll('.line-item[style*="flex"]').length;
            group.style.display = visibleItems > 0 ? 'block' : 'none';
        });

        // Update map
        Object.keys(state.routeLayers).forEach(lineId => {
            const layer = state.routeLayers[lineId];
            if (state.favorites.lines.includes(lineId)) {
                layer.addTo(state.map);
            } else {
                state.map.removeLayer(layer);
            }
        });
    }

    // ================================
    // Nearby Stops
    // ================================
    function toggleNearbyPanel() {
        state.nearbyPanelOpen = !state.nearbyPanelOpen;
        elements.nearbyPanel.classList.toggle('active', state.nearbyPanelOpen);
        elements.nearbyBtn.classList.toggle('active', state.nearbyPanelOpen);

        if (state.nearbyPanelOpen) {
            findNearbyStops();
        }
    }

    function closeNearbyPanel() {
        state.nearbyPanelOpen = false;
        elements.nearbyPanel.classList.remove('active');
        elements.nearbyBtn.classList.remove('active');
    }

    function findNearbyStops() {
        if (!elements.nearbyContent) return;

        // Use textContent for safer rendering
        const loadingP = document.createElement('p');
        loadingP.className = 'nearby-loading';
        loadingP.textContent = t('determining_location');
        elements.nearbyContent.textContent = '';
        elements.nearbyContent.appendChild(loadingP);

        if (!('geolocation' in navigator)) {
            loadingP.textContent = t('geolocation_not_supported');
            showGeolocationError(t('geolocation_not_supported'), null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                state.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                displayNearbyStops();
            },
            (error) => {
                let message = t('location_failed');
                if (error.code === error.PERMISSION_DENIED) {
                    message = t('location_denied');
                }
                loadingP.textContent = message;
                showGeolocationError(message, findNearbyStops);
            },
            { enableHighAccuracy: true, timeout: TIMING.GEOLOCATION_TIMEOUT }
        );
    }

    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function displayNearbyStops() {
        if (!state.userLocation || !elements.nearbyContent) return;

        const stopsWithDistance = Object.values(TRANSIT_DATA.STOPS).map(stop => ({
            ...stop,
            distance: calculateDistance(
                state.userLocation.lat, state.userLocation.lng,
                stop.lat, stop.lng
            )
        }));

        stopsWithDistance.sort((a, b) => a.distance - b.distance);
        const nearestStops = stopsWithDistance.slice(0, 5);

        elements.nearbyContent.textContent = '';

        nearestStops.forEach(stop => {
            const card = document.createElement('div');
            card.className = 'nearby-stop-card';

            const distanceText = stop.distance < 1000
                ? `${Math.round(stop.distance)} м`
                : `${(stop.distance / 1000).toFixed(1)} км`;

            // Build card content safely
            const header = document.createElement('div');
            header.className = 'nearby-stop-header';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'nearby-stop-name';
            nameSpan.textContent = stop.name;

            const distanceSpan = document.createElement('span');
            distanceSpan.className = 'nearby-stop-distance';
            distanceSpan.textContent = distanceText;

            header.appendChild(nameSpan);
            header.appendChild(distanceSpan);
            card.appendChild(header);

            const linesContainer = document.createElement('div');
            linesContainer.className = 'nearby-stop-lines';

            stop.lines.forEach(lineId => {
                const line = TRANSIT_DATA.getLine(lineId);
                if (!line) return;

                const badge = document.createElement('span');
                badge.className = `line-badge stop-line-badge-small ${line.type}`;
                badge.textContent = line.number;
                badge.setAttribute('role', 'button');
                badge.setAttribute('aria-label', `Линия ${line.number}`);
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectLine(lineId);
                    closeNearbyPanel();
                });
                linesContainer.appendChild(badge);
            });

            card.appendChild(linesContainer);

            card.addEventListener('click', () => {
                state.map.setView([stop.lat, stop.lng], 17);
                const marker = state.stopMarkers.find(m => m.data.id === stop.id);
                if (marker) {
                    marker.marker.openPopup();
                }
                closeNearbyPanel();
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });

            // Walk button
            const walkBtn = document.createElement('button');
            walkBtn.className = 'walk-btn';
            walkBtn.textContent = t('walk');
            walkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showWalkingDirection(stop);
            });
            card.appendChild(walkBtn);

            elements.nearbyContent.appendChild(card);
        });
    }

    function showWalkingDirection(stop) {
        if (!state.userLocation) return;

        // Remove previous walking line
        if (state.walkingLine) {
            state.map.removeLayer(state.walkingLine);
        }

        const from = [state.userLocation.lat, state.userLocation.lng];
        const to = [stop.lat, stop.lng];

        state.walkingLine = L.polyline([from, to], {
            color: '#2563eb',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 8'
        }).addTo(state.map);

        // Walking speed ~83m/min (5 km/h)
        const walkMinutes = Math.ceil(stop.distance / 83);
        state.walkingLine.bindPopup(t('walking_time', { min: walkMinutes })).openPopup();

        state.map.fitBounds(L.latLngBounds([from, to]), { padding: [60, 60] });

        closeNearbyPanel();
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }

    // ================================
    // Route Planner
    // ================================
    function toggleRoutePlannerPanel() {
        state.routePlannerOpen = !state.routePlannerOpen;
        if (elements.routePlannerPanel) {
            elements.routePlannerPanel.classList.toggle('active', state.routePlannerOpen);
        }
        if (elements.routePlannerBtn) {
            elements.routePlannerBtn.classList.toggle('active', state.routePlannerOpen);
        }
        if (state.routePlannerOpen && elements.routeFrom) {
            elements.routeFrom.focus();
        }
    }

    function closeRoutePlannerPanel() {
        state.routePlannerOpen = false;
        if (elements.routePlannerPanel) {
            elements.routePlannerPanel.classList.remove('active');
        }
        if (elements.routePlannerBtn) {
            elements.routePlannerBtn.classList.remove('active');
        }
        clearRoutePlannerLayers();
    }

    function setupRouteAutocomplete(inputEl, suggestionsEl, onSelect) {
        if (!inputEl || !suggestionsEl) return;

        const debouncedSuggest = debounce((query) => {
            suggestionsEl.textContent = '';
            if (query.length < 2) {
                suggestionsEl.style.display = 'none';
                return;
            }
            const stops = TRANSIT_DATA.searchStops(query).slice(0, 6);
            if (stops.length === 0) {
                suggestionsEl.style.display = 'none';
                return;
            }
            suggestionsEl.style.display = 'block';
            stops.forEach(stop => {
                const item = document.createElement('div');
                item.className = 'route-suggestion-item';
                item.textContent = stop.name;
                item.addEventListener('click', () => {
                    inputEl.value = stop.name;
                    suggestionsEl.style.display = 'none';
                    onSelect(stop.id);
                });
                suggestionsEl.appendChild(item);
            });
        }, 200);

        inputEl.addEventListener('input', (e) => debouncedSuggest(e.target.value));
        inputEl.addEventListener('blur', () => {
            setTimeout(() => { suggestionsEl.style.display = 'none'; }, 200);
        });
    }

    function searchRoute() {
        if (!state.routeFromStopId || !state.routeToStopId) {
            showToast(t('select_stops'));
            return;
        }
        if (typeof RoutePlanner === 'undefined') return;

        const departureInput = document.getElementById('routeDepartureTime');
        const departureTime = departureInput && departureInput.value ? departureInput.value : null;

        const routes = RoutePlanner.findRoutes(state.routeFromStopId, state.routeToStopId);
        displayRouteResults(routes, departureTime);
    }

    function displayRouteResults(routes, departureTime) {
        if (!elements.routeResults) return;
        elements.routeResults.textContent = '';
        clearRoutePlannerLayers();

        if (routes.length === 0) {
            const noResults = document.createElement('p');
            noResults.className = 'route-no-results';
            noResults.textContent = t('no_route_found');
            elements.routeResults.appendChild(noResults);
            return;
        }

        routes.forEach((route, idx) => {
            const card = document.createElement('div');
            card.className = 'route-result-card';

            const header = document.createElement('div');
            header.className = 'route-result-header';

            const badges = document.createElement('div');
            badges.className = 'route-result-badges';
            route.segments.forEach((seg, i) => {
                if (i > 0) {
                    const arrow = document.createElement('span');
                    arrow.className = 'route-transfer-arrow';
                    arrow.textContent = '→';
                    badges.appendChild(arrow);
                }
                const line = TRANSIT_DATA.getLine(seg.lineId);
                if (line) {
                    const badge = document.createElement('span');
                    badge.className = 'line-badge ' + (line.type === 'trolleybus' ? 'trolleybus' : 'bus');
                    badge.textContent = line.number;
                    badges.appendChild(badge);
                }
            });

            const meta = document.createElement('div');
            meta.className = 'route-result-meta';
            const time = RoutePlanner.estimateTime(route);
            let metaText = `~${time} мин · ${route.totalStops} спирки` +
                (route.transfers > 0 ? ` · ${route.transfers} пресядан${route.transfers === 1 ? 'е' : 'ия'}` : '');

            if (departureTime) {
                const [hours, minutes] = departureTime.split(':').map(Number);
                const arrival = new Date();
                arrival.setHours(hours, minutes + time, 0, 0);
                const arrH = String(arrival.getHours()).padStart(2, '0');
                const arrM = String(arrival.getMinutes()).padStart(2, '0');
                metaText += ` · пристигане ~${arrH}:${arrM}`;
            }

            meta.textContent = metaText;

            header.appendChild(badges);
            header.appendChild(meta);
            card.appendChild(header);

            // Segment details
            route.segments.forEach(seg => {
                const segEl = document.createElement('div');
                segEl.className = 'route-segment';
                const line = TRANSIT_DATA.getLine(seg.lineId);
                const fromStop = TRANSIT_DATA.getStop(seg.stops[0]);
                const toStop = TRANSIT_DATA.getStop(seg.stops[seg.stops.length - 1]);
                if (line && fromStop && toStop) {
                    segEl.textContent = `${line.number}: ${fromStop.name} → ${toStop.name} (${seg.stops.length - 1} спирки)`;
                }
                card.appendChild(segEl);
            });

            card.addEventListener('click', () => drawRouteOnMap(route));
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            elements.routeResults.appendChild(card);
        });
    }

    function drawRouteOnMap(route) {
        clearRoutePlannerLayers();

        const allCoords = [];
        const colors = ['#2563eb', '#dc2626', '#059669'];

        route.segments.forEach((seg, i) => {
            const segCoords = [];
            seg.stops.forEach(stopId => {
                const stop = TRANSIT_DATA.getStop(stopId);
                if (stop) segCoords.push([stop.lat, stop.lng]);
            });

            if (segCoords.length > 1) {
                const polyline = L.polyline(segCoords, {
                    color: colors[i % colors.length],
                    weight: 6,
                    opacity: 0.8,
                    dashArray: i > 0 ? '10, 8' : null
                }).addTo(state.map);
                state.routePlannerLayers.push(polyline);
                allCoords.push(...segCoords);
            }
        });

        if (allCoords.length > 0) {
            state.map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
        }
    }

    function clearRoutePlannerLayers() {
        state.routePlannerLayers.forEach(layer => state.map.removeLayer(layer));
        state.routePlannerLayers = [];
    }

    // ================================
    // Deep Linking (URL Routing)
    // ================================
    function initDeepLinking() {
        // Handle initial URL
        handleUrlChange();

        // Listen for URL changes
        window.addEventListener('popstate', handleUrlChange);
    }

    function handleUrlChange() {
        const hash = window.location.hash.slice(1);
        if (!hash) return;

        const [type, id] = hash.split('/');

        if (type === 'line' && id) {
            setTimeout(() => selectLine(id), TIMING.DEEP_LINK_DELAY);
        } else if (type === 'stop' && id) {
            setTimeout(() => {
                const stop = TRANSIT_DATA.STOPS[id];
                if (stop) {
                    state.map.setView([stop.lat, stop.lng], 17);
                    const marker = state.stopMarkers.find(m => m.data.id === id);
                    if (marker) {
                        marker.marker.openPopup();
                    }
                }
            }, TIMING.DEEP_LINK_DELAY);
        }
    }

    function updateUrl(type, id) {
        const newHash = `#${type}/${id}`;
        if (window.location.hash !== newHash) {
            history.replaceState(null, '', newHash);
        }
    }

    function shareCurrentLine() {
        if (!state.selectedLine) return;

        const url = `${window.location.origin}${window.location.pathname}#line/${state.selectedLine}`;

        if (navigator.share) {
            const line = TRANSIT_DATA.getLine(state.selectedLine);
            navigator.share({
                title: `Линия ${line.number} - Транспорт Русе`,
                text: line.route,
                url: url
            }).catch((error) => {
                // Only show error if not user cancellation
                if (error.name !== 'AbortError') {
                    showToast(t('share_failed'));
                }
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                showToast(t('link_copied'));
            }).catch(() => {
                showToast(t('copy_failed'));
            });
        }
    }

    // ================================
    // Enhanced Offline (Line Caching)
    // ================================
    function cacheLineForOffline(lineId) {
        const line = TRANSIT_DATA.getLine(lineId);
        if (!line) return;

        const cached = safeGetJSON('cachedLines', {});
        const lineStops = TRANSIT_DATA.getLineStops(lineId);

        cached[lineId] = {
            ...line,
            id: lineId,
            stopsData: lineStops,
            cachedAt: Date.now()
        };

        // Keep only last 10
        const keys = Object.keys(cached);
        if (keys.length > 10) {
            const sorted = keys.sort((a, b) => cached[a].cachedAt - cached[b].cachedAt);
            delete cached[sorted[0]];
        }

        safeSetItem('cachedLines', JSON.stringify(cached));
    }

    function getCachedLine(lineId) {
        const cached = safeGetJSON('cachedLines', {});
        return cached[lineId] || null;
    }

    // ================================
    // Schedule Export
    // ================================
    function exportSchedule() {
        if (!state.selectedLine) return;

        const line = TRANSIT_DATA.getLine(state.selectedLine);
        if (!line) return;

        // Set title for printing
        const originalTitle = document.title;
        document.title = `Линия ${line.number} - ${line.route} | Транспорт Русе`;

        window.print();

        // Restore title after print
        setTimeout(() => {
            document.title = originalTitle;
        }, TIMING.PRINT_TITLE_RESTORE);
    }

    // ================================
    // Keyboard Shortcuts
    // ================================
    function handleKeyboardShortcuts(e) {
        // Focus trap for open modals
        if (e.key === 'Tab') {
            if (elements.shortcutsModal.classList.contains('active')) {
                trapFocus(elements.shortcutsModal, e);
                return;
            }
            if (elements.infoModal.classList.contains('active')) {
                trapFocus(elements.infoModal, e);
                return;
            }
        }

        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        switch (e.key.toLowerCase()) {
            case '/':
                e.preventDefault();
                elements.searchInput.focus();
                if (window.innerWidth <= 768) {
                    toggleSidebar();
                }
                break;
            case 'escape':
                if (elements.shortcutsModal.classList.contains('active')) {
                    elements.shortcutsModal.classList.remove('active');
                } else if (elements.infoModal.classList.contains('active')) {
                    elements.infoModal.classList.remove('active');
                } else if (state.routePlannerOpen) {
                    closeRoutePlannerPanel();
                } else if (state.nearbyPanelOpen) {
                    closeNearbyPanel();
                } else if (state.selectedLine) {
                    hideLineDetails();
                } else if (state.sidebarOpen) {
                    closeSidebar();
                }
                break;
            case 'd':
                toggleDarkMode();
                break;
            case 'f':
                if (state.selectedLine) {
                    toggleFavoriteLine(state.selectedLine);
                } else {
                    filterFavorites();
                }
                break;
            case 'p':
                toggleRoutePlannerPanel();
                if (window.innerWidth <= 768 && !state.sidebarOpen) {
                    toggleSidebar();
                }
                break;
            case 'n':
                toggleNearbyPanel();
                if (window.innerWidth <= 768 && !state.sidebarOpen) {
                    toggleSidebar();
                }
                break;
            case 'r':
                resetMapView();
                break;
            case 'l':
                locateUser();
                break;
            case '?':
                elements.shortcutsModal.classList.add('active');
                break;
        }
    }

    function showShortcutsModal() {
        elements.shortcutsModal.classList.add('active');
    }

    /**
     * Trap focus inside a modal element
     */
    function trapFocus(modal, e) {
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        elements.menuToggle.addEventListener('click', toggleSidebar);

        elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                if (filter === 'favorites') {
                    state.activeFilter = 'favorites';
                    elements.filterTabs.forEach(t => t.classList.toggle('active', t === tab));
                    filterFavorites();
                } else {
                    filterLines(filter);
                }
            });
        });

        // Debounced search for better performance
        const debouncedSearch = debounce((value) => {
            searchLines(value);
        }, TIMING.SEARCH_DEBOUNCE);

        elements.searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
            if (elements.searchClear) {
                elements.searchClear.classList.toggle('visible', e.target.value.length > 0);
            }
        });

        elements.searchClear.addEventListener('click', () => {
            elements.searchInput.value = '';
            searchLines('');
            elements.searchClear.classList.remove('visible');
            elements.searchInput.focus();
        });

        elements.backBtn.addEventListener('click', hideLineDetails);

        elements.locateBtn.addEventListener('click', locateUser);
        elements.resetBtn.addEventListener('click', resetMapView);

        elements.legendToggle.addEventListener('click', toggleLegend);

        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', () => {
                elements.infoModal.classList.remove('active');
            });
        }

        elements.map.addEventListener('click', () => {
            if (window.innerWidth <= 768 && state.sidebarOpen) {
                closeSidebar();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
            state.map.invalidateSize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Language toggle
        const langToggle = document.getElementById('langToggle');
        if (langToggle && typeof I18n !== 'undefined') {
            langToggle.addEventListener('click', () => {
                const next = I18n.getLanguage() === 'bg' ? 'en' : 'bg';
                I18n.setLanguage(next);
                langToggle.querySelector('.lang-label').textContent = next === 'bg' ? 'EN' : 'BG';
                document.documentElement.lang = next;
            });
            // Set initial label
            langToggle.querySelector('.lang-label').textContent = I18n.getLanguage() === 'bg' ? 'EN' : 'BG';
        }

        // Listen for language changes to re-render dynamic content
        window.addEventListener('languageChanged', () => {
            // Re-render sidebar line groups
            populateLinesList();
            initFilterFromUrl();
        });

        // Dark mode toggle
        if (elements.darkModeToggle) {
            elements.darkModeToggle.addEventListener('click', toggleDarkMode);
        }

        // Online/Offline status
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        // PWA Install
        if (elements.installBtn) {
            elements.installBtn.addEventListener('click', handleInstallClick);
        }
        if (elements.installClose) {
            elements.installClose.addEventListener('click', dismissInstallPrompt);
        }

        // Nearby stops
        if (elements.nearbyBtn) {
            elements.nearbyBtn.addEventListener('click', toggleNearbyPanel);
        }
        if (elements.nearbyClose) {
            elements.nearbyClose.addEventListener('click', closeNearbyPanel);
        }

        // Favorites button in sidebar
        if (elements.favoritesBtn) {
            elements.favoritesBtn.addEventListener('click', () => {
                state.activeFilter = 'favorites';
                elements.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'favorites'));
                filterFavorites();
            });
        }

        // Line details actions
        if (elements.favoriteLineBtn) {
            elements.favoriteLineBtn.addEventListener('click', () => {
                if (state.selectedLine) {
                    toggleFavoriteLine(state.selectedLine);
                }
            });
        }
        if (elements.exportScheduleBtn) {
            elements.exportScheduleBtn.addEventListener('click', exportSchedule);
        }
        if (elements.shareLineBtn) {
            elements.shareLineBtn.addEventListener('click', shareCurrentLine);
        }

        // Route planner
        if (elements.routePlannerBtn) {
            elements.routePlannerBtn.addEventListener('click', toggleRoutePlannerPanel);
        }
        if (elements.routePlannerClose) {
            elements.routePlannerClose.addEventListener('click', closeRoutePlannerPanel);
        }
        if (elements.routeSwapBtn) {
            elements.routeSwapBtn.addEventListener('click', () => {
                const tmp = elements.routeFrom.value;
                elements.routeFrom.value = elements.routeTo.value;
                elements.routeTo.value = tmp;
                const tmpId = state.routeFromStopId;
                state.routeFromStopId = state.routeToStopId;
                state.routeToStopId = tmpId;
            });
        }
        if (elements.routeSearchBtn) {
            elements.routeSearchBtn.addEventListener('click', searchRoute);
        }
        setupRouteAutocomplete(elements.routeFrom, elements.routeFromSuggestions, (id) => { state.routeFromStopId = id; });
        setupRouteAutocomplete(elements.routeTo, elements.routeToSuggestions, (id) => { state.routeToStopId = id; });

        // Shortcuts modal
        if (elements.shortcutsClose) {
            elements.shortcutsClose.addEventListener('click', () => {
                elements.shortcutsModal.classList.remove('active');
            });
        }
    }

    /**
     * Initialize the application
     */
    function init() {
        // Check for required dependencies
        if (typeof L === 'undefined') {
            showErrorState('Библиотеката за карти не е заредена. Моля, опреснете страницата.');
            return;
        }

        // Check for required data
        if (typeof TRANSIT_DATA === 'undefined') {
            showErrorState('Данните за транспорта не са заредени. Моля, опреснете страницата.');
            return;
        }

        // Validate DOM elements
        try {
            validateElements();
        } catch (error) {
            showErrorState('Грешка при зареждане на страницата. Моля, опреснете.');
            return;
        }

        // Run data validation - fail fast on errors
        const validation = TRANSIT_DATA.validateData();
        if (!validation.valid) {
            showErrorState('Грешка в данните за транспорта. Моля, опреснете страницата.');
            return;
        }

        // Initialize features
        if (typeof I18n !== 'undefined') {
            I18n.initLanguage();
        }
        initDarkMode();
        initInstallPrompt();

        // initMap is async (loads route geometries)
        initMap().then(() => {
            // Deep linking needs routes on map for fitBounds
            initDeepLinking();
        });

        populateLinesList();
        initFilterFromUrl();
        initEventListeners();
    }

    /**
     * Show error state to user
     */
    function showErrorState(message) {
        const overlay = elements.loadingOverlay;
        if (overlay) {
            const spinner = overlay.querySelector('.loading-spinner');
            const text = overlay.querySelector('p');
            if (spinner) spinner.style.display = 'none';
            if (text) {
                text.textContent = message;
                text.style.color = '#dc2626';
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
