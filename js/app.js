/**
 * Ruse Transit Map Application
 * Interactive public transit map for Ruse, Bulgaria
 *
 * Uses normalized data structure with stop IDs for reliable lookups
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
        sidebarOpen: false,
        darkMode: localStorage.getItem('darkMode') === 'true',
        favorites: JSON.parse(localStorage.getItem('favorites') || '{"lines":[],"stops":[]}'),
        deferredInstallPrompt: null,
        userLocation: null,
        nearbyPanelOpen: false
    };

    // DOM Elements
    const elements = {
        map: document.getElementById('map'),
        sidebar: document.getElementById('sidebar'),
        menuToggle: document.getElementById('menuToggle'),
        linesList: document.getElementById('linesList'),
        lineDetails: document.getElementById('lineDetails'),
        searchInput: document.getElementById('searchInput'),
        searchClear: document.getElementById('searchClear'),
        filterTabs: document.querySelectorAll('.filter-tab'),
        backBtn: document.getElementById('backBtn'),
        locateBtn: document.getElementById('locateBtn'),
        resetBtn: document.getElementById('resetBtn'),
        legendToggle: document.getElementById('legendToggle'),
        mapLegend: document.getElementById('mapLegend'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        infoModal: document.getElementById('infoModal'),
        modalClose: document.getElementById('modalClose'),
        // New elements
        darkModeToggle: document.getElementById('darkModeToggle'),
        offlineIndicator: document.getElementById('offlineIndicator'),
        installPrompt: document.getElementById('installPrompt'),
        installBtn: document.getElementById('installBtn'),
        installClose: document.getElementById('installClose'),
        nearbyBtn: document.getElementById('nearbyBtn'),
        favoritesBtn: document.getElementById('favoritesBtn'),
        nearbyPanel: document.getElementById('nearbyPanel'),
        nearbyContent: document.getElementById('nearbyContent'),
        nearbyClose: document.getElementById('nearbyClose'),
        favoriteLineBtn: document.getElementById('favoriteLineBtn'),
        exportScheduleBtn: document.getElementById('exportScheduleBtn'),
        shareLineBtn: document.getElementById('shareLineBtn'),
        shortcutsModal: document.getElementById('shortcutsModal'),
        shortcutsClose: document.getElementById('shortcutsClose')
    };

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
    function initMap() {
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

        addRoutesToMap();
        addStopsToMap();

        setTimeout(() => {
            elements.loadingOverlay.classList.add('hidden');
        }, 500);
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
     * Add stop markers to the map
     */
    function addStopsToMap() {
        const stopsGeoJSON = TRANSIT_DATA.createStopsGeoJSON();

        stopsGeoJSON.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;

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
            const line = TRANSIT_DATA.getLine(lineId);
            if (!line) return;

            const lineRow = document.createElement('div');
            lineRow.className = 'popup-line-row';
            lineRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px;';

            const badge = document.createElement('span');
            badge.className = 'popup-line-badge ' + (isTrolley ? 'trolleybus' : 'bus');
            badge.textContent = line.number;
            badge.style.cssText = 'cursor: pointer;';
            badge.title = 'Кликни за детайли';
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                selectLine(lineId);
            });

            const arrivalInfo = document.createElement('span');
            arrivalInfo.className = 'arrival-info';
            arrivalInfo.style.cssText = 'font-size: 0.75rem; color: #059669; font-weight: 500;';

            const arrival = TRANSIT_DATA.calculateEstimatedArrival(lineId, props.id);
            arrivalInfo.textContent = arrival.message;
            if (!arrival.available) {
                arrivalInfo.style.color = '#dc2626';
            } else if (arrival.minutesUntil <= 3) {
                arrivalInfo.style.color = '#059669';
                arrivalInfo.style.fontWeight = '700';
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
            }, 300);
        }
    }

    /**
     * Show line details in sidebar
     */
    function showLineDetails(lineId) {
        const line = TRANSIT_DATA.getLine(lineId);
        if (!line) return;

        const badgeClass = line.type === 'trolleybus' ? 'trolleybus' : 'bus';
        const typeLabel = line.type === 'trolleybus' ? 'Тролейбус' : 'Автобус';

        const detailBadge = document.getElementById('detailBadge');
        detailBadge.textContent = line.number;
        detailBadge.className = 'line-badge ' + badgeClass;

        document.getElementById('detailName').textContent = line.name;
        document.getElementById('detailType').textContent = typeLabel;

        const routeContainer = document.getElementById('detailRoute');
        routeContainer.textContent = '';

        // Get stops with full data using the new helper
        const lineStops = TRANSIT_DATA.getLineStops(lineId);
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
            weekdayLabel.textContent = 'Делник:';
            const weekdayValue = document.createElement('span');
            weekdayValue.textContent = line.schedule.weekday.first + ' - ' + line.schedule.weekday.last;
            weekdayRow.appendChild(weekdayLabel);
            weekdayRow.appendChild(weekdayValue);
            scheduleContent.appendChild(weekdayRow);

            const freqRow = document.createElement('div');
            freqRow.className = 'schedule-row';
            const freqLabel = document.createElement('span');
            freqLabel.textContent = 'Интервал:';
            const freqValue = document.createElement('span');
            freqValue.textContent = line.schedule.weekday.frequency;
            freqRow.appendChild(freqLabel);
            freqRow.appendChild(freqValue);
            scheduleContent.appendChild(freqRow);

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
    }

    /**
     * Filter lines by type
     */
    function filterLines(filterType) {
        state.activeFilter = filterType;

        elements.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filterType);
        });

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

        let stopResultsContainer = document.getElementById('stopSearchResults');
        if (!stopResultsContainer) {
            stopResultsContainer = document.createElement('div');
            stopResultsContainer.id = 'stopSearchResults';
            stopResultsContainer.className = 'stop-search-results';
            elements.linesList.parentNode.insertBefore(stopResultsContainer, elements.linesList);
        }

        stopResultsContainer.textContent = '';
        stopResultsContainer.style.display = 'none';

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
            stopResultsContainer.style.display = 'block';

            const title = document.createElement('div');
            title.className = 'stop-results-title';
            title.textContent = 'Спирки:';
            title.style.cssText = 'font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 0.875rem;';
            stopResultsContainer.appendChild(title);

            matchingStops.forEach(stop => {
                const stopCard = createStopSearchResult(stop);
                stopResultsContainer.appendChild(stopCard);
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
        card.style.cssText = 'background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer;';

        const header = document.createElement('div');
        header.className = 'stop-card-header';
        header.style.cssText = 'font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;';

        const icon = document.createElement('span');
        icon.textContent = '\ud83d\udccd';
        header.appendChild(icon);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = stop.name;
        header.appendChild(nameSpan);

        card.appendChild(header);

        const linesContainer = document.createElement('div');
        linesContainer.className = 'stop-lines-container';
        linesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

        stop.lines.forEach(lineId => {
            const line = TRANSIT_DATA.getLine(lineId);
            if (!line) return;

            const isTrolley = lineId.startsWith('T');
            const lineRow = document.createElement('div');
            lineRow.className = 'stop-line-row';
            lineRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 4px 0;';

            const lineInfo = document.createElement('div');
            lineInfo.style.cssText = 'display: flex; align-items: center; gap: 8px;';

            const badge = document.createElement('span');
            badge.className = 'line-badge ' + (isTrolley ? 'trolleybus' : 'bus');
            badge.textContent = line.number;
            badge.style.cssText = 'cursor: pointer; font-size: 0.75rem; padding: 2px 6px;';
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                selectLine(lineId);
            });

            const routeName = document.createElement('span');
            routeName.textContent = line.route;
            routeName.style.cssText = 'font-size: 0.75rem; color: #64748b; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';

            lineInfo.appendChild(badge);
            lineInfo.appendChild(routeName);

            const arrivalTime = document.createElement('span');
            arrivalTime.className = 'arrival-time';

            const arrival = TRANSIT_DATA.calculateEstimatedArrival(lineId, stop.id);
            arrivalTime.textContent = arrival.message;

            if (!arrival.available) {
                arrivalTime.style.cssText = 'font-size: 0.75rem; color: #dc2626; font-weight: 500;';
            } else if (arrival.minutesUntil <= 3) {
                arrivalTime.style.cssText = 'font-size: 0.75rem; color: #059669; font-weight: 700;';
            } else {
                arrivalTime.style.cssText = 'font-size: 0.75rem; color: #059669; font-weight: 500;';
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
    function initDarkMode() {
        if (state.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        localStorage.setItem('darkMode', state.darkMode);
        document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
        showToast(state.darkMode ? 'Тъмен режим включен' : 'Светъл режим включен');
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

            // Show prompt after 30 seconds if not already installed
            const dismissed = localStorage.getItem('installPromptDismissed');
            if (!dismissed) {
                setTimeout(() => {
                    if (state.deferredInstallPrompt) {
                        elements.installPrompt.classList.add('visible');
                    }
                }, 30000);
            }
        });

        window.addEventListener('appinstalled', () => {
            state.deferredInstallPrompt = null;
            elements.installPrompt.classList.remove('visible');
            showToast('Приложението е инсталирано!');
        });
    }

    function handleInstallClick() {
        if (!state.deferredInstallPrompt) return;

        state.deferredInstallPrompt.prompt();
        state.deferredInstallPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted install');
            }
            state.deferredInstallPrompt = null;
            elements.installPrompt.classList.remove('visible');
        });
    }

    function dismissInstallPrompt() {
        elements.installPrompt.classList.remove('visible');
        localStorage.setItem('installPromptDismissed', 'true');
    }

    // ================================
    // Toast Notifications
    // ================================
    function showToast(message, duration = 3000) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
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
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
    }

    function toggleFavoriteLine(lineId) {
        const index = state.favorites.lines.indexOf(lineId);
        if (index > -1) {
            state.favorites.lines.splice(index, 1);
            showToast('Премахнато от любими');
        } else {
            state.favorites.lines.push(lineId);
            showToast('Добавено в любими');
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
            showToast('Спирката е премахната от любими');
        } else {
            state.favorites.stops.push(stopId);
            showToast('Спирката е добавена в любими');
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
            showToast('Нямате любими линии');
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
        elements.nearbyContent.innerHTML = '<p class="nearby-loading">Определяне на локация...</p>';

        if (!('geolocation' in navigator)) {
            elements.nearbyContent.innerHTML = '<p class="nearby-loading">Геолокацията не се поддържа</p>';
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
                console.error('Geolocation error:', error);
                elements.nearbyContent.innerHTML = '<p class="nearby-loading">Неуспешно определяне на локацията</p>';
            },
            { enableHighAccuracy: true, timeout: 10000 }
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
        if (!state.userLocation) return;

        const stopsWithDistance = Object.values(TRANSIT_DATA.STOPS).map(stop => ({
            ...stop,
            distance: calculateDistance(
                state.userLocation.lat, state.userLocation.lng,
                stop.lat, stop.lng
            )
        }));

        stopsWithDistance.sort((a, b) => a.distance - b.distance);
        const nearestStops = stopsWithDistance.slice(0, 5);

        elements.nearbyContent.innerHTML = '';

        nearestStops.forEach(stop => {
            const card = document.createElement('div');
            card.className = 'nearby-stop-card';

            const distanceText = stop.distance < 1000
                ? `${Math.round(stop.distance)} м`
                : `${(stop.distance / 1000).toFixed(1)} км`;

            card.innerHTML = `
                <div class="nearby-stop-header">
                    <span class="nearby-stop-name">${stop.name}</span>
                    <span class="nearby-stop-distance">${distanceText}</span>
                </div>
                <div class="nearby-stop-lines"></div>
            `;

            const linesContainer = card.querySelector('.nearby-stop-lines');
            stop.lines.forEach(lineId => {
                const line = TRANSIT_DATA.getLine(lineId);
                if (!line) return;

                const badge = document.createElement('span');
                badge.className = `line-badge ${line.type}`;
                badge.textContent = line.number;
                badge.style.cssText = 'min-width: 28px; height: 22px; font-size: 0.75rem; padding: 0 6px; cursor: pointer;';
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectLine(lineId);
                    closeNearbyPanel();
                });
                linesContainer.appendChild(badge);
            });

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

            elements.nearbyContent.appendChild(card);
        });
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
            setTimeout(() => selectLine(id), 500);
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
            }, 500);
        }
    }

    function updateUrl(type, id) {
        const newHash = `#${type}/${id}`;
        if (window.location.hash !== newHash) {
            history.pushState(null, '', newHash);
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
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                showToast('Линкът е копиран');
            }).catch(() => {
                showToast('Неуспешно копиране');
            });
        }
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
        }, 1000);
    }

    // ================================
    // Keyboard Shortcuts
    // ================================
    function handleKeyboardShortcuts(e) {
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

        elements.searchInput.addEventListener('input', (e) => {
            searchLines(e.target.value);
            elements.searchClear.classList.toggle('visible', e.target.value.length > 0);
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
        console.log('Initializing Ruse Transit Map...');

        if (typeof TRANSIT_DATA === 'undefined') {
            console.error('Transit data not loaded');
            return;
        }

        // Run validation in development
        const validation = TRANSIT_DATA.validateData();
        if (!validation.valid) {
            console.error('Data validation errors:', validation.errors);
        }
        if (validation.warnings.length > 0) {
            console.warn('Data validation warnings:', validation.warnings);
        }

        // Initialize features
        initDarkMode();
        initInstallPrompt();

        initMap();
        populateLinesList();
        initEventListeners();

        // Handle deep linking after map is ready
        initDeepLinking();

        console.log('Ruse Transit Map initialized successfully');
        console.log('Stops:', Object.keys(TRANSIT_DATA.STOPS).length);
        console.log('Lines:', Object.keys(TRANSIT_DATA.LINES).length);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
