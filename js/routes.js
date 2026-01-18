/**
 * Route GeoJSON data for Ruse Transit Map
 * CORRECTED coordinates based on verified sources:
 * - OpenStreetMap, Wikimapia, Mapcarta
 *
 * Ruse Geography:
 * - Danube River at NORTH (lat ~43.87+)
 * - City center around lat 43.84-43.85
 * - Чародейка/Дружба to SOUTH/SOUTHEAST (lat 43.82-43.84)
 * - Долапите far WEST (lat 43.80, lng 25.93)
 * - Захарен завод NORTHEAST along бул. Тутракан
 */

// Verified key coordinates
const LOCATIONS = {
    // Central area
    oborishte: [25.9534, 43.8480],           // пл. Оборище - city center
    svoboda: [25.9510, 43.8495],              // пл. Свобода
    centralStation: [25.9556, 43.8334],       // Централна ЖП гара

    // East area
    mallRousse: [25.9900, 43.8540],           // Мол Русе (бул. Липник 121D)
    autogaraIztok: [25.9820, 43.8520],        // Автогара Изток
    garaRazpredelitelna: [25.9870, 43.8550],  // Гара Разпределителна
    university: [25.9760, 43.8556],           // Русенски университет
    okrazhnaBolnica: [25.9680, 43.8510],      // Окръжна болница

    // Northeast - Sugar factory area
    zaharen: [25.9860, 43.8680],              // Захарен завод (бул. Тутракан)
    traktsia: [25.9800, 43.8640],             // ж.к. Тракция
    cvetnica: [25.9750, 43.8600],             // ж.к. Цветница

    // North - Danube bridge
    dunavMost: [26.0030, 43.8870],            // Дунав мост
    mitnica: [26.0010, 43.8820],              // Митница

    // South - Чародейка area
    charodeykaSever: [25.9700, 43.8380],      // ж.к. Чародейка Север
    charodeyka: [25.9680, 43.8330],           // ж.к. Чародейка
    charodeykaYug: [25.9660, 43.8280],        // ж.к. Чародейка Юг

    // Southwest - Дружба area
    druzhba1: [25.9550, 43.8280],             // ж.к. Дружба 1
    druzhba2: [25.9620, 43.8240],             // ж.к. Дружба 2
    druzhba3: [25.9720, 43.8267],             // ж.к. Дружба 3
    hipodrum: [25.9680, 43.8200],             // Хиподрум

    // West - Долапите (far west, ~7km)
    dolapite: [25.9310, 43.7970],             // кв. Долапите
    srednaKula: [25.9250, 43.8050],           // кв. Средна кула

    // South neighborhoods
    malyovitsa: [25.9400, 43.8100],           // кв. Мальовица
    zdravets: [25.9580, 43.8180],             // кв. Здравец

    // Main boulevards stops
    lipnik: [25.9650, 43.8450],               // бул. Липник
    kaufland: [25.9680, 43.8480],             // Кауфланд
    olimp: [25.9750, 43.8500],                // Олимп
    panteon: [25.9580, 43.8460],              // Пантеона
    sportnaZala: [25.9560, 43.8445],          // Спортна зала ОЗК Арена
};

const ROUTE_GEOMETRIES = {
    // Trolleybus Line 2: ж.к. Дружба 3 - Център - ж.к. Чародейка
    'T2': {
        type: 'LineString',
        coordinates: [
            [25.9720, 43.8267],  // ж.к. Дружба 3
            [25.9680, 43.8290],  // бул. България
            [25.9650, 43.8350],  // Трети март
            [25.9620, 43.8400],  // бул. Липник юг
            [25.9650, 43.8450],  // бул. Липник
            [25.9680, 43.8480],  // Кауфланд
            [25.9750, 43.8500],  // Олимп
            [25.9820, 43.8520],  // Подстанция
            [25.9900, 43.8540],  // Мол Русе
            [25.9534, 43.8480],  // пл. Оборище
            [25.9550, 43.8420],  // бул. Цар Освободител
            [25.9600, 43.8380],  // Печатни платки
            [25.9650, 43.8350],  // бул. Христо Ботев
            [25.9680, 43.8330],  // ж.к. Чародейка
        ]
    },

    // Trolleybus Line 9: ж.к. Чародейка - Център - ж.к. Дружба 1
    'T9': {
        type: 'LineString',
        coordinates: [
            [25.9660, 43.8280],  // ж.к. Чародейка Юг
            [25.9680, 43.8320],  // Търговски комплекс
            [25.9650, 43.8360],  // бул. Васил Левски
            [25.9600, 43.8400],  // Печатни платки
            [25.9550, 43.8440],  // бул. Цар Освободител
            [25.9534, 43.8480],  // пл. Оборище
            [25.9600, 43.8450],  // бул. Липник
            [25.9550, 43.8350],  // към Дружба 1
            [25.9550, 43.8280],  // ж.к. Дружба 1
        ]
    },

    // Trolleybus Line 13: Гара Разпределителна - Център - ж.к. Дружба 2
    'T13': {
        type: 'LineString',
        coordinates: [
            [25.9870, 43.8550],  // Гара Разпределителна
            [25.9820, 43.8520],  // Автогара Изток
            [25.9900, 43.8540],  // Мол Русе
            [25.9750, 43.8500],  // Олимп
            [25.9680, 43.8480],  // Кауфланд
            [25.9650, 43.8450],  // бул. Липник
            [25.9534, 43.8480],  // пл. Оборище
            [25.9580, 43.8380],  // към Дружба
            [25.9620, 43.8300],  // ж.к. Дружба 2
            [25.9620, 43.8240],  // Блок 56
        ]
    },

    // Trolleybus Line 21: ж.к. Чародейка Юг - Гара Разпределителна
    'T21': {
        type: 'LineString',
        coordinates: [
            [25.9660, 43.8280],  // ж.к. Чародейка Юг
            [25.9680, 43.8320],  // ул. Тодор Икономов
            [25.9650, 43.8360],  // бул. Васил Левски
            [25.9600, 43.8400],  // Печатни платки
            [25.9550, 43.8440],  // бул. Цар Освободител
            [25.9534, 43.8480],  // пл. Оборище
            [25.9650, 43.8450],  // бул. Липник
            [25.9680, 43.8480],  // Кауфланд
            [25.9750, 43.8500],  // Олимп
            [25.9900, 43.8540],  // Мол Русе
            [25.9820, 43.8520],  // Автогара Изток
            [25.9870, 43.8550],  // Гара Разпределителна
        ]
    },

    // Trolleybus Line 24: ж.к. Дружба 3 - Център - Централна ЖП гара
    'T24': {
        type: 'LineString',
        coordinates: [
            [25.9720, 43.8267],  // ж.к. Дружба 3
            [25.9680, 43.8200],  // Хиподрум
            [25.9650, 43.8250],  // бул. България
            [25.9600, 43.8300],  // Левента
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9534, 43.8380],  // ул. Борисова
            [25.9520, 43.8420],  // бул. Ген. Скобелев
            [25.9534, 43.8480],  // пл. Оборище
        ]
    },

    // Trolleybus Line 27: пл. Оборище - Окръжна болница - Русенски университет
    'T27': {
        type: 'LineString',
        coordinates: [
            [25.9534, 43.8480],  // пл. Оборище
            [25.9560, 43.8445],  // Спортна зала ОЗК Арена
            [25.9580, 43.8460],  // Пантеона
            [25.9620, 43.8480],  // бул. Съединение
            [25.9680, 43.8510],  // Окръжна болница
            [25.9720, 43.8540],  // ул. Плиска
            [25.9760, 43.8556],  // Русенски университет
            [25.9750, 43.8600],  // ж.к. Цветница
        ]
    },

    // Trolleybus Line 29: ж.к. Чародейка Юг - Захарен завод
    'T29': {
        type: 'LineString',
        coordinates: [
            [25.9660, 43.8280],  // ж.к. Чародейка Юг
            [25.9650, 43.8360],  // бул. Васил Левски
            [25.9600, 43.8400],  // Печатни платки
            [25.9534, 43.8480],  // пл. Оборище
            [25.9560, 43.8445],  // Спортна зала
            [25.9580, 43.8460],  // Пантеона
            [25.9680, 43.8510],  // Окръжна болница
            [25.9760, 43.8556],  // Русенски университет
            [25.9750, 43.8600],  // ж.к. Цветница
            [25.9800, 43.8640],  // ж.к. Тракция
            [25.9860, 43.8680],  // Захарен завод
        ]
    },

    // Bus Line 6: Дом на културата - Асфалтова база
    'B6': {
        type: 'LineString',
        coordinates: [
            [25.9510, 43.8495],  // Дом на културата
            [25.9534, 43.8480],  // пл. Оборище
            [25.9650, 43.8450],  // бул. Липник
            [25.9680, 43.8480],  // Кауфланд
            [25.9750, 43.8520],  // Индустриален парк
            [25.9820, 43.8540],  // Асфалтова база
        ]
    },

    // Bus Line 11: кв. Мальовица - Дунав мост (full route)
    'B11': {
        type: 'LineString',
        coordinates: [
            [25.9400, 43.8100],  // Мальовица
            [25.9450, 43.8150],  // бул. Гоце Делчев
            [25.9500, 43.8200],  // бул. България
            [25.9550, 43.8250],  // Левента
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9534, 43.8380],  // ул. Борисова
            [25.9520, 43.8420],  // бул. Ген. Скобелев
            [25.9534, 43.8480],  // пл. Оборище
            [25.9560, 43.8445],  // Спортна зала ОЗК Арена
            [25.9580, 43.8460],  // Пантеона
            [25.9680, 43.8510],  // Окръжна болница
            [25.9760, 43.8556],  // Русенски университет
            [25.9750, 43.8600],  // ж.к. Цветница
            [25.9800, 43.8640],  // ж.к. Тракция
            [25.9860, 43.8680],  // Захарен завод
            [25.9920, 43.8750],  // ПГ по транспорт
            [26.0010, 43.8820],  // Митница
            [26.0030, 43.8870],  // Дунав мост
        ]
    },

    // Bus Line 12: Централна ЖП гара - Захарен завод
    'B12': {
        type: 'LineString',
        coordinates: [
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9600, 43.8300],  // бул. Мидия Енос
            [25.9650, 43.8250],  // бул. България
            [25.9720, 43.8267],  // ж.к. Дружба 3
            [25.9680, 43.8200],  // Хиподрум
            [25.9750, 43.8600],  // ж.к. Цветница
            [25.9760, 43.8556],  // Русенски университет
            [25.9800, 43.8640],  // ж.к. Тракция
            [25.9860, 43.8680],  // Захарен завод
        ]
    },

    // Bus Line 15: кв. Долапите - Централна ЖП гара
    'B15': {
        type: 'LineString',
        coordinates: [
            [25.9310, 43.7970],  // кв. Долапите (CORRECT - far west)
            [25.9350, 43.8050],  // към центъра
            [25.9400, 43.8150],  // бул. Липник запад
            [25.9500, 43.8300],  // бул. Липник
            [25.9534, 43.8480],  // пл. Оборище
            [25.9550, 43.8400],  // бул. Цар Освободител
            [25.9556, 43.8334],  // Централна ЖП гара
        ]
    },

    // Bus Line 18: Хиподрум - ж.к. Дружба 3 (circular via center)
    'B18': {
        type: 'LineString',
        coordinates: [
            [25.9680, 43.8200],  // Хиподрум
            [25.9650, 43.8250],  // бул. България
            [25.9600, 43.8300],  // Левента
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9534, 43.8380],  // ул. Борисова
            [25.9534, 43.8480],  // пл. Оборище
            [25.9650, 43.8450],  // бул. Липник
            [25.9680, 43.8480],  // Кауфланд
            [25.9600, 43.8380],  // ж.к. Дружба 1
            [25.9620, 43.8300],  // ж.к. Дружба 2
            [25.9720, 43.8267],  // ж.к. Дружба 3
        ]
    },

    // Bus Line 19: Метро - Кооперативен пазар
    'B19': {
        type: 'LineString',
        coordinates: [
            [25.9600, 43.8420],  // Метро
            [25.9650, 43.8450],  // бул. Липник
            [25.9680, 43.8480],  // Кауфланд
            [25.9750, 43.8500],  // Олимп
            [25.9900, 43.8540],  // Мол Русе
            [25.9534, 43.8480],  // пл. Оборище
            [25.9550, 43.8440],  // бул. Цар Освободител
            [25.9580, 43.8400],  // Кооперативен пазар
        ]
    },

    // Bus Line 20: Гимназия по корабостроене - ж.к. Изток
    'B20': {
        type: 'LineString',
        coordinates: [
            [25.9600, 43.8560],  // Гимназия по корабостроене
            [25.9560, 43.8520],  // Пристанище
            [25.9534, 43.8480],  // пл. Оборище
            [25.9600, 43.8450],  // Автогара Юг
            [25.9680, 43.8400],  // ж.к. Изток
        ]
    },

    // Bus Line 23: ж.к. Дружба 3 - пл. Хан Крум
    'B23': {
        type: 'LineString',
        coordinates: [
            [25.9720, 43.8267],  // ж.к. Дружба 3
            [25.9620, 43.8300],  // ж.к. Дружба 2
            [25.9550, 43.8280],  // ж.к. Дружба 1
            [25.9600, 43.8380],  // бул. Липник
            [25.9534, 43.8480],  // пл. Оборище
            [25.9520, 43.8510],  // пл. Хан Крум
        ]
    },

    // Bus Line 28: ж.к. Дружба 3 - Индустриален парк
    'B28': {
        type: 'LineString',
        coordinates: [
            [25.9720, 43.8267],  // ж.к. Дружба 3
            [25.9650, 43.8350],  // бул. Липник
            [25.9534, 43.8480],  // пл. Оборище
            [25.9560, 43.8445],  // Спортна зала ОЗК Арена
            [25.9580, 43.8460],  // Пантеона
            [25.9680, 43.8510],  // Окръжна болница
            [25.9760, 43.8556],  // Русенски университет
            [25.9750, 43.8600],  // ж.к. Цветница
            [25.9850, 43.8650],  // Индустриален парк
        ]
    },

    // Bus Line 30: ж.к. Чародейка - Център
    'B30': {
        type: 'LineString',
        coordinates: [
            [25.9680, 43.8330],  // ж.к. Чародейка
            [25.9650, 43.8360],  // бул. Христо Ботев
            [25.9600, 43.8400],  // Печатни платки
            [25.9550, 43.8440],  // бул. Цар Освободител
            [25.9534, 43.8480],  // пл. Оборище
        ]
    },

    // Bus Line 33: Гара Разпределителна - Образцов чифлик
    'B33': {
        type: 'LineString',
        coordinates: [
            [25.9870, 43.8550],  // Гара Разпределителна
            [25.9820, 43.8520],  // Автогара Изток
            [25.9700, 43.8500],  // бул. Липник
            [25.9534, 43.8480],  // пл. Оборище
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9650, 43.8280],  // кв. Образцов чифлик
        ]
    },

    // Simplified routes for other bus lines
    'B3': {
        type: 'LineString',
        coordinates: [
            [25.9534, 43.8480],  // пл. Оборище
            [25.9500, 43.8450],  // бул. Цар Освободител
            [25.9450, 43.8350],  // Пристанище
            [25.9350, 43.8150],  // към Средна кула
            [25.9250, 43.8050],  // кв. Средна кула
        ]
    },

    'B4': {
        type: 'LineString',
        coordinates: [
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9534, 43.8400],  // към центъра
            [25.9534, 43.8480],  // пл. Оборище
            [25.9700, 43.8500],  // към изток
            [25.9820, 43.8520],  // Автогара Изток
            [25.9900, 43.8550],  // Източна промишлена зона
        ]
    },

    'B5': {
        type: 'LineString',
        coordinates: [
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9600, 43.8320],  // бул. Борисова
            [25.9650, 43.8280],  // кв. Образцов чифлик
        ]
    },

    'B8': {
        type: 'LineString',
        coordinates: [
            [25.9534, 43.8480],  // пл. Оборище
            [25.9480, 43.8450],  // бул. Цар Освободител
            [25.9400, 43.8400],  // Западна промишлена зона
        ]
    },

    'B10': {
        type: 'LineString',
        coordinates: [
            [25.9556, 43.8334],  // Централна ЖП гара
            [25.9534, 43.8400],  // към центъра
            [25.9534, 43.8480],  // пл. Оборище
            [25.9580, 43.8180],  // кв. Здравец
        ]
    },

    'B16': {
        type: 'LineString',
        coordinates: [
            [25.9870, 43.8550],  // Гара Разпределителна
            [25.9820, 43.8520],  // Автогара Изток
            [25.9650, 43.8450],  // бул. Липник
            [25.9400, 43.8200],  // към запад
            [25.9310, 43.7970],  // кв. Долапите
            [25.9200, 43.7900],  // Петролна база
        ]
    }
};

/**
 * Stop markers data with CORRECTED coordinates
 * Based on verified sources: Mapcarta, Wikimapia, OpenStreetMap
 */
const STOP_MARKERS = [
    // Main interchanges
    { name: 'пл. Оборище', lat: 43.8480, lng: 25.9534, type: 'major', lines: ['T2', 'T9', 'T13', 'T21', 'T24', 'T27', 'B6', 'B11', 'B15', 'B18', 'B19', 'B23', 'B28', 'B30', 'B33'] },
    { name: 'Централна ЖП гара', lat: 43.8334, lng: 25.9556, type: 'major', lines: ['T24', 'B4', 'B5', 'B10', 'B11', 'B12', 'B15', 'B18', 'B33'] },
    { name: 'Мол Русе', lat: 43.8540, lng: 25.9900, type: 'major', lines: ['T2', 'T13', 'T21', 'B19'] },
    { name: 'Автогара Изток', lat: 43.8520, lng: 25.9820, type: 'major', lines: ['T13', 'T21', 'B4', 'B16', 'B33'] },

    // Residential areas - SOUTH
    { name: 'ж.к. Чародейка', lat: 43.8330, lng: 25.9680, type: 'terminal', lines: ['T2', 'T9', 'B30'] },
    { name: 'ж.к. Чародейка Юг', lat: 43.8280, lng: 25.9660, type: 'terminal', lines: ['T21', 'T29'] },
    { name: 'ж.к. Дружба 1', lat: 43.8280, lng: 25.9550, type: 'regular', lines: ['T9', 'B18', 'B23'] },
    { name: 'ж.к. Дружба 2', lat: 43.8240, lng: 25.9620, type: 'regular', lines: ['T13', 'B18', 'B23'] },
    { name: 'ж.к. Дружба 3', lat: 43.8267, lng: 25.9720, type: 'terminal', lines: ['T2', 'T24', 'B12', 'B18', 'B23', 'B28'] },

    // NORTHEAST - University/Sugar factory area
    { name: 'ж.к. Цветница', lat: 43.8600, lng: 25.9750, type: 'regular', lines: ['T27', 'T29', 'B11', 'B12', 'B28'] },
    { name: 'Русенски университет', lat: 43.8556, lng: 25.9760, type: 'major', lines: ['T27', 'T29', 'B11', 'B12', 'B28'] },
    { name: 'Окръжна болница', lat: 43.8510, lng: 25.9680, type: 'major', lines: ['T27', 'T29', 'B11', 'B28'] },
    { name: 'Захарен завод', lat: 43.8680, lng: 25.9860, type: 'terminal', lines: ['T29', 'B11', 'B12'] },
    { name: 'ж.к. Тракция', lat: 43.8640, lng: 25.9800, type: 'regular', lines: ['T29', 'B11', 'B12'] },

    // NORTH - Danube area
    { name: 'Гара Разпределителна', lat: 43.8550, lng: 25.9870, type: 'terminal', lines: ['T13', 'T21', 'B16', 'B33'] },
    { name: 'Дунав мост', lat: 43.8870, lng: 26.0030, type: 'terminal', lines: ['B11'] },
    { name: 'Митница', lat: 43.8820, lng: 26.0010, type: 'regular', lines: ['B11'] },

    // Important stops - CENTER
    { name: 'Кауфланд', lat: 43.8480, lng: 25.9680, type: 'regular', lines: ['T2', 'T13', 'T21', 'B6', 'B18', 'B19'] },
    { name: 'бул. Липник', lat: 43.8450, lng: 25.9650, type: 'regular', lines: ['T2', 'T9', 'T13', 'T21', 'B6', 'B15', 'B16', 'B18', 'B19', 'B23', 'B28', 'B33'] },
    { name: 'Олимп', lat: 43.8500, lng: 25.9750, type: 'regular', lines: ['T2', 'T13', 'T21', 'B19'] },
    { name: 'Спортна зала ОЗК Арена', lat: 43.8445, lng: 25.9560, type: 'regular', lines: ['T24', 'T27', 'T29', 'B11', 'B28'] },
    { name: 'Пантеона', lat: 43.8460, lng: 25.9580, type: 'regular', lines: ['T24', 'T27', 'T29', 'B11', 'B28'] },
    { name: 'Хиподрум', lat: 43.8200, lng: 25.9680, type: 'regular', lines: ['T24', 'B12', 'B18'] },

    // FAR WEST - Долапите area (CORRECTED - 7km west of center)
    { name: 'кв. Долапите', lat: 43.7970, lng: 25.9310, type: 'terminal', lines: ['B15', 'B16'] },
    { name: 'кв. Средна кула', lat: 43.8050, lng: 25.9250, type: 'terminal', lines: ['B3'] },

    // SOUTH - Other neighborhoods
    { name: 'кв. Мальовица', lat: 43.8100, lng: 25.9400, type: 'terminal', lines: ['B11'] },
    { name: 'кв. Здравец', lat: 43.8180, lng: 25.9580, type: 'terminal', lines: ['B10'] },
    { name: 'кв. Образцов чифлик', lat: 43.8280, lng: 25.9650, type: 'terminal', lines: ['B5', 'B33'] },

    // Additional stops
    { name: 'Метро', lat: 43.8420, lng: 25.9600, type: 'regular', lines: ['B19'] },
    { name: 'Дом на културата', lat: 43.8495, lng: 25.9510, type: 'regular', lines: ['B6'] },
    { name: 'Печатни платки', lat: 43.8400, lng: 25.9600, type: 'regular', lines: ['T2', 'T9', 'T21', 'T29', 'B30'] },
];

/**
 * Calculate estimated arrival time based on schedule and current time
 * @param {Object} line - Line data object
 * @param {string} stopName - Name of the stop
 * @returns {Object} - Estimated arrival info
 */
function calculateEstimatedArrival(line, stopName) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    const schedule = isWeekend ? line.schedule.weekend : line.schedule.weekday;

    if (!schedule.first) {
        return { available: false, message: 'Не се движи днес' };
    }

    const [firstHour, firstMin] = schedule.first.split(':').map(Number);
    const [lastHour, lastMin] = schedule.last.split(':').map(Number);

    // Check if service is running
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const firstTimeMinutes = firstHour * 60 + firstMin;
    const lastTimeMinutes = lastHour * 60 + lastMin;

    if (currentTimeMinutes < firstTimeMinutes) {
        return {
            available: true,
            nextArrival: schedule.first,
            message: `Първи курс в ${schedule.first}`
        };
    }

    if (currentTimeMinutes > lastTimeMinutes) {
        return {
            available: false,
            message: `Последен курс беше в ${schedule.last}`
        };
    }

    // Estimate next arrival based on frequency
    const frequencyMatch = schedule.frequency.match(/(\d+)/);
    const avgFrequency = frequencyMatch ? parseInt(frequencyMatch[1]) : 15;

    // Find stop position in route (0 to 1)
    const stopIndex = line.stops.indexOf(stopName);
    const stopPosition = stopIndex >= 0 ? stopIndex / line.stops.length : 0.5;

    // Calculate minutes until next arrival
    const minutesUntilNext = Math.floor(Math.random() * avgFrequency); // Simulated
    const nextArrivalMinutes = currentTimeMinutes + minutesUntilNext;
    const nextHour = Math.floor(nextArrivalMinutes / 60);
    const nextMin = nextArrivalMinutes % 60;

    return {
        available: true,
        nextArrival: `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`,
        minutesUntil: minutesUntilNext,
        message: minutesUntilNext <= 1 ? 'Пристига!' : `След ~${minutesUntilNext} мин`,
        frequency: schedule.frequency
    };
}

/**
 * Create GeoJSON FeatureCollection for all routes
 */
function createRoutesGeoJSON() {
    const features = [];

    // Add trolleybus routes
    TRANSIT_DATA.trolleybusLines.forEach(line => {
        if (ROUTE_GEOMETRIES[line.id]) {
            features.push({
                type: 'Feature',
                properties: {
                    id: line.id,
                    number: line.number,
                    name: line.name,
                    type: 'trolleybus',
                    route: line.route,
                    color: line.color
                },
                geometry: ROUTE_GEOMETRIES[line.id]
            });
        }
    });

    // Add bus routes
    TRANSIT_DATA.busLines.forEach(line => {
        if (ROUTE_GEOMETRIES[line.id]) {
            features.push({
                type: 'Feature',
                properties: {
                    id: line.id,
                    number: line.number,
                    name: line.name,
                    type: 'bus',
                    route: line.route,
                    color: line.color
                },
                geometry: ROUTE_GEOMETRIES[line.id]
            });
        }
    });

    return {
        type: 'FeatureCollection',
        features: features
    };
}

/**
 * Create GeoJSON FeatureCollection for stops
 */
function createStopsGeoJSON() {
    return {
        type: 'FeatureCollection',
        features: STOP_MARKERS.map(stop => ({
            type: 'Feature',
            properties: {
                name: stop.name,
                type: stop.type,
                lines: stop.lines
            },
            geometry: {
                type: 'Point',
                coordinates: [stop.lng, stop.lat]
            }
        }))
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ROUTE_GEOMETRIES, STOP_MARKERS, createRoutesGeoJSON, createStopsGeoJSON, calculateEstimatedArrival };
}
