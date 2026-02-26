/**
 * Internationalization (i18n) module for OGTR
 * Supports Bulgarian (bg) and English (en)
 */
(function() {
    'use strict';

    const TRANSLATIONS = {
        bg: {
            // Header
            'app.title': 'Транспорт Русе',
            'dark_mode': 'Тъмен режим',
            'menu': 'Меню',

            // Sidebar
            'lines': 'Линии',
            'all': 'Всички',
            'trolleybuses': 'Тролейбуси',
            'buses': 'Автобуси',
            'search_placeholder': 'Търси линия или спирка...',
            'search_label': 'Търсене',
            'clear_search': 'Изчисти търсенето',

            // Nearby
            'nearby_stops': 'Най-близки спирки',
            'determining_location': 'Определяне на локация...',
            'geolocation_not_supported': 'Геолокацията не се поддържа',
            'location_denied': 'Достъпът до местоположението е отказан',
            'location_failed': 'Неуспешно определяне на локацията',
            'location_unavailable': 'Информацията за местоположението не е достъпна.',
            'location_timeout': 'Заявката за местоположение изтече.',
            'location_error': 'Не може да се определи локацията.',

            // Favorites
            'favorites': 'Любими',
            'no_favorites': 'Нямате любими линии',
            'added_to_favorites': 'Добавено в любими',
            'removed_from_favorites': 'Премахнато от любими',
            'stop_added_fav': 'Спирката е добавена в любими',
            'stop_removed_fav': 'Спирката е премахната от любими',
            'add_to_favorites': 'Добави в любими',
            'remove_from_favorites': 'Премахни от любими',

            // Line details
            'back': '← Назад',
            'print_schedule': 'Принтирай разписание',
            'share_line': 'Сподели линия',
            'trolleybus': 'Тролейбус',
            'bus': 'Автобус',
            'schedule': 'Разписание',
            'weekday': 'Делник:',
            'interval': 'Интервал:',
            'weekend': 'Почивен ден:',

            // Map
            'map_label': 'Интерактивна карта на градския транспорт в Русе',
            'my_location': 'Моята локация',
            'show_location': 'Покажи моята локация на картата',
            'reset_view': 'Покажи целия град',
            'reset_view_label': 'Нулирай изгледа на картата',
            'legend': 'Легенда',
            'legend_trolleybus': 'Тролейбус (червена линия)',
            'legend_bus': 'Автобус (зелена линия)',
            'legend_stop': 'Спирка',
            'map_controls': 'Контроли на картата',
            'map_legend': 'Легенда на картата',

            // Route planner
            'route_planner': 'Планиране на маршрут',
            'from': 'От:',
            'to': 'До:',
            'from_placeholder': 'Начална спирка...',
            'to_placeholder': 'Крайна спирка...',
            'swap': 'Размени',
            'search_route': 'Търси маршрут',
            'no_route_found': 'Не е намерен маршрут. Опитайте с други спирки.',
            'select_stops': 'Моля изберете начална и крайна спирка',
            'minutes': 'мин',
            'stops_count': 'спирки',
            'transfer': 'пресядане',
            'transfers': 'пресядания',

            // Toast / Status
            'dark_mode_on': 'Тъмен режим включен',
            'light_mode_on': 'Светъл режим включен',
            'link_copied': 'Линкът е копиран',
            'copy_failed': 'Неуспешно копиране',
            'share_failed': 'Споделянето не успя',
            'app_installed': 'Приложението е инсталирано!',
            'offline_mode': 'Офлайн режим',
            'install_app': 'Инсталирай приложението',
            'install_subtitle': 'За бърз достъп от началния екран',
            'install': 'Инсталирай',
            'your_location': 'Вашата локация',
            'not_supported': 'Браузърът не поддържа геолокация.',

            // Loading
            'loading_map': 'Зареждане на картата...',

            // Shortcuts
            'keyboard_shortcuts': 'Клавишни комбинации',
            'shortcut_search': 'Търсене',
            'shortcut_close': 'Затвори / Назад',
            'shortcut_dark': 'Тъмен режим',
            'shortcut_fav': 'Любими',
            'shortcut_nearby': 'Най-близки спирки',
            'shortcut_reset': 'Нулирай изгледа',
            'shortcut_location': 'Моята локация',
            'shortcut_help': 'Покажи помощ',
            'shortcut_planner': 'Планиране на маршрут',

            // Stop popup
            'lines_arrival': 'Линии и ориентировъчно време:',
            'click_details': 'Кликни за детайли',
            'stops_results': 'Спирки:',

            // About
            'about_title': 'За проекта',
            'skip_to_map': 'Прескочи към картата',

            // Walking
            'walk': 'Пеша',
            'walking_time': '{min} мин пеша',

            // Cached badge
            'cached': 'Кеширано',

            // Language
            'language': 'Език'
        },
        en: {
            'app.title': 'Ruse Transit',
            'dark_mode': 'Dark mode',
            'menu': 'Menu',

            'lines': 'Lines',
            'all': 'All',
            'trolleybuses': 'Trolleybuses',
            'buses': 'Buses',
            'search_placeholder': 'Search line or stop...',
            'search_label': 'Search',
            'clear_search': 'Clear search',

            'nearby_stops': 'Nearby stops',
            'determining_location': 'Determining location...',
            'geolocation_not_supported': 'Geolocation not supported',
            'location_denied': 'Location access denied',
            'location_failed': 'Could not determine location',
            'location_unavailable': 'Location information is unavailable.',
            'location_timeout': 'Location request timed out.',
            'location_error': 'Could not determine location.',

            'favorites': 'Favorites',
            'no_favorites': 'No favorite lines',
            'added_to_favorites': 'Added to favorites',
            'removed_from_favorites': 'Removed from favorites',
            'stop_added_fav': 'Stop added to favorites',
            'stop_removed_fav': 'Stop removed from favorites',
            'add_to_favorites': 'Add to favorites',
            'remove_from_favorites': 'Remove from favorites',

            'back': '← Back',
            'print_schedule': 'Print schedule',
            'share_line': 'Share line',
            'trolleybus': 'Trolleybus',
            'bus': 'Bus',
            'schedule': 'Schedule',
            'weekday': 'Weekday:',
            'interval': 'Interval:',
            'weekend': 'Weekend:',

            'map_label': 'Interactive public transit map of Ruse',
            'my_location': 'My location',
            'show_location': 'Show my location on map',
            'reset_view': 'Show entire city',
            'reset_view_label': 'Reset map view',
            'legend': 'Legend',
            'legend_trolleybus': 'Trolleybus (red line)',
            'legend_bus': 'Bus (green line)',
            'legend_stop': 'Stop',
            'map_controls': 'Map controls',
            'map_legend': 'Map legend',

            'route_planner': 'Route planner',
            'from': 'From:',
            'to': 'To:',
            'from_placeholder': 'Start stop...',
            'to_placeholder': 'End stop...',
            'swap': 'Swap',
            'search_route': 'Find route',
            'no_route_found': 'No route found. Try different stops.',
            'select_stops': 'Please select start and end stops',
            'minutes': 'min',
            'stops_count': 'stops',
            'transfer': 'transfer',
            'transfers': 'transfers',

            'dark_mode_on': 'Dark mode enabled',
            'light_mode_on': 'Light mode enabled',
            'link_copied': 'Link copied',
            'copy_failed': 'Copy failed',
            'share_failed': 'Share failed',
            'app_installed': 'App installed!',
            'offline_mode': 'Offline mode',
            'install_app': 'Install app',
            'install_subtitle': 'Quick access from home screen',
            'install': 'Install',
            'your_location': 'Your location',
            'not_supported': 'Browser does not support geolocation.',

            'loading_map': 'Loading map...',

            'keyboard_shortcuts': 'Keyboard shortcuts',
            'shortcut_search': 'Search',
            'shortcut_close': 'Close / Back',
            'shortcut_dark': 'Dark mode',
            'shortcut_fav': 'Favorites',
            'shortcut_nearby': 'Nearby stops',
            'shortcut_reset': 'Reset view',
            'shortcut_location': 'My location',
            'shortcut_help': 'Show help',
            'shortcut_planner': 'Route planner',

            'lines_arrival': 'Lines and estimated times:',
            'click_details': 'Click for details',
            'stops_results': 'Stops:',

            'about_title': 'About',
            'skip_to_map': 'Skip to map',

            'walk': 'Walk',
            'walking_time': '{min} min walk',

            'cached': 'Cached',

            'language': 'Language'
        }
    };

    let currentLang = 'bg';

    function t(key, params) {
        let str = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS.bg[key] || key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                str = str.replace('{' + k + '}', v);
            }
        }
        return str;
    }

    function setLanguage(lang) {
        if (!TRANSLATIONS[lang]) return;
        currentLang = lang;
        try { localStorage.setItem('lang', lang); } catch(e) {}
        document.documentElement.setAttribute('lang', lang);
        applyTranslations();
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    function getLanguage() {
        return currentLang;
    }

    function initLanguage() {
        try {
            const saved = localStorage.getItem('lang');
            if (saved && TRANSLATIONS[saved]) {
                currentLang = saved;
            }
        } catch(e) {}
        document.documentElement.setAttribute('lang', currentLang);
        applyTranslations();
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });
    }

    window.I18n = { t, setLanguage, getLanguage, initLanguage };
})();
