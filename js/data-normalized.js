/**
 * NORMALIZED Transit Data Structure for Ruse, Bulgaria
 *
 * Key improvements:
 * 1. Each stop has a unique ID (S001, S002, etc.)
 * 2. Lines reference stops by ID, not by name
 * 3. Stop names stored in ONE place only
 * 4. Aliases handle name variations for search
 */

// ============================================================
// STOPS REGISTRY - Single source of truth (104 stops → ~70 unique)
// ============================================================
const STOPS = {
    // ═══════════════════════════════════════════════════════════
    // MAJOR HUBS
    // ═══════════════════════════════════════════════════════════
    'S001': {
        name: 'пл. Оборище',
        lat: 43.8459702,
        lng: 25.9602767,
        type: 'major',
        aliases: ['Площад Оборище', 'Оборище', 'Център']
    },
    'S002': {
        name: 'Централна ЖП гара',
        lat: 43.8339791,
        lng: 25.9558116,
        type: 'major',
        aliases: ['ЖП гара', 'Гарата', 'Централна гара', 'Централна ЖП гара (ул. Николаевска)']
    },
    'S003': {
        name: 'Мол Русе',
        lat: 43.8521146,
        lng: 25.9903358,
        type: 'major',
        aliases: ['Mall Ruse', 'Мол', 'Мол Русе (Трета поликлиника)', 'Трета поликлиника']
    },
    'S004': {
        name: 'Автогара Изток',
        lat: 43.8555034,
        lng: 25.9980769,
        type: 'major',
        aliases: ['Източна автогара']
    },
    'S005': {
        name: 'Автогара Юг',
        lat: 43.8349282,
        lng: 25.9579841,
        type: 'major',
        aliases: ['Южна автогара']
    },

    // ═══════════════════════════════════════════════════════════
    // RESIDENTIAL - SOUTH (Чародейка)
    // ═══════════════════════════════════════════════════════════
    'S010': {
        name: 'ж.к. Чародейка',
        lat: 43.8400142,
        lng: 25.9723021,
        type: 'terminal',
        aliases: ['Чародейка']
    },
    'S011': {
        name: 'ж.к. Чародейка Юг',
        lat: 43.8319765,
        lng: 25.9774869,
        type: 'terminal',
        aliases: ['Чародейка Юг', 'ж.к. Чародейка Юг (Търговски комплекс)']
    },
    'S012': {
        name: 'Търговски комплекс',
        lat: 43.8320675,
        lng: 25.977283,
        type: 'regular',
        aliases: []
    },
    'S013': {
        name: 'ул. Тодор Икономов',
        lat: 43.8321677,
        lng: 25.9772772,
        type: 'regular',
        aliases: ['Тодор Икономов']
    },
    'S014': {
        name: 'бул. Васил Левски',
        lat: 43.8284917,
        lng: 25.9668596,
        type: 'regular',
        aliases: ['Васил Левски']
    },
    'S015': {
        name: 'Блок 115',
        lat: 43.8245327,
        lng: 25.9752719,
        type: 'regular',
        aliases: []
    },

    // ═══════════════════════════════════════════════════════════
    // RESIDENTIAL - SOUTH (Дружба)
    // ═══════════════════════════════════════════════════════════
    'S020': {
        name: 'ж.к. Дружба 1',
        lat: 43.8311741,
        lng: 25.9655516,
        type: 'regular',
        aliases: ['Дружба 1']
    },
    'S021': {
        name: 'ж.к. Дружба 2',
        lat: 43.8287546,
        lng: 25.9593004,
        type: 'regular',
        aliases: ['Дружба 2']
    },
    'S022': {
        name: 'ж.к. Дружба 3',
        lat: 43.8267258,
        lng: 25.9720696,
        type: 'terminal',
        aliases: ['Дружба 3', 'ж.к. Дружба 3 (Блок 45)']
    },
    'S023': {
        name: 'Блок 18',
        lat: 43.8305847,
        lng: 25.9704323,
        type: 'regular',
        aliases: []
    },
    'S024': {
        name: 'Блок 45',
        lat: 43.8260,
        lng: 25.9730,
        type: 'regular',
        aliases: []
    },
    'S025': {
        name: 'Блок 56',
        lat: 43.8240,
        lng: 25.9625,
        type: 'regular',
        aliases: []
    },
    'S026': {
        name: 'Трети март',
        lat: 43.8290,
        lng: 25.9685,
        type: 'regular',
        aliases: ['3-ти март']
    },
    'S027': {
        name: 'Св. Георги',
        lat: 43.8360956,
        lng: 25.9552387,
        type: 'regular',
        aliases: ['Свети Георги']
    },
    'S028': {
        name: 'Спортна зала',
        lat: 43.8530353,
        lng: 25.9734478,
        type: 'regular',
        aliases: ['Спортна зала Дружба']
    },

    // ═══════════════════════════════════════════════════════════
    // CENTRAL - бул. Липник corridor
    // ═══════════════════════════════════════════════════════════
    'S030': {
        name: 'бул. Липник',
        lat: 43.8532456,
        lng: 25.9997852,
        type: 'regular',
        aliases: ['Липник']
    },
    'S031': {
        name: 'Мосю Бриколаж',
        lat: 43.8460496,
        lng: 25.9616165,
        type: 'regular',
        aliases: ['Mr. Bricolage']
    },
    'S032': {
        name: 'Кауфланд',
        lat: 43.8452163,
        lng: 25.9662276,
        type: 'regular',
        aliases: ['Kaufland']
    },
    'S033': {
        name: 'Найден Киров',
        lat: 43.84903,
        lng: 25.9735677,
        type: 'regular',
        aliases: []
    },
    'S034': {
        name: 'Олимп',
        lat: 43.850244,
        lng: 25.977918,
        type: 'regular',
        aliases: ['Стадион Олимп']
    },
    'S035': {
        name: 'Подстанция',
        lat: 43.8508515,
        lng: 25.9827452,
        type: 'regular',
        aliases: []
    },

    // ═══════════════════════════════════════════════════════════
    // CENTRAL - бул. Цар Освободител corridor
    // ═══════════════════════════════════════════════════════════
    'S040': {
        name: 'бул. Цар Освободител',
        lat: 43.8426417,
        lng: 25.9602403,
        type: 'regular',
        aliases: ['Цар Освободител']
    },
    'S041': {
        name: 'Печатни платки',
        lat: 43.8333381,
        lng: 25.9693878,
        type: 'regular',
        aliases: []
    },
    'S042': {
        name: 'бул. Христо Ботев',
        lat: 43.809142,
        lng: 25.9834221,
        type: 'regular',
        aliases: ['Христо Ботев']
    },
    'S043': {
        name: 'Хотел Рига',
        lat: 43.8533271,
        lng: 25.9518848,
        type: 'regular',
        aliases: ['Рига']
    },
    'S044': {
        name: 'Училище Йордан Йовков',
        lat: 43.8407041,
        lng: 25.9604963,
        type: 'regular',
        aliases: ['Й. Йовков', 'Училище Й. Йовков', 'Кооперативен пазар', 'Кооперативен пазар (ЖП прелез)']
    },
    'S045': {
        name: 'Пристанище',
        lat: 43.84016,
        lng: 25.93975,
        type: 'regular',
        aliases: ['Пристанището']
    },

    // ═══════════════════════════════════════════════════════════
    // NORTHEAST - Спортна зала / Болница / Университет corridor
    // ═══════════════════════════════════════════════════════════
    'S050': {
        name: 'Спортна зала ОЗК Арена',
        lat: 43.8463935,
        lng: 25.9620279,
        type: 'regular',
        aliases: ['ОЗК Арена', 'Спортна зала ОЗК']
    },
    'S051': {
        name: 'Пантеона',
        lat: 43.8496903,
        lng: 25.9591298,
        type: 'regular',
        aliases: ['Пантеон']
    },
    'S052': {
        name: 'бул. Съединение',
        lat: 43.8544551,
        lng: 25.9626163,
        type: 'regular',
        aliases: ['Съединение']
    },
    'S053': {
        name: 'ул. Св. Наум',
        lat: 43.8539678,
        lng: 25.9634421,
        type: 'regular',
        aliases: ['Св. Наум']
    },
    'S054': {
        name: 'Парк на Възрожденците',
        lat: 43.8519602,
        lng: 25.9626969,
        type: 'regular',
        aliases: ['Възрожденци']
    },
    'S055': {
        name: 'Окръжна болница',
        lat: 43.8537299,
        lng: 25.9627048,
        type: 'major',
        aliases: ['Болницата', 'УМБАЛ']
    },
    'S056': {
        name: 'ул. Плиска',
        lat: 43.8594112,
        lng: 25.9753331,
        type: 'regular',
        aliases: ['Плиска']
    },
    'S057': {
        name: 'Първа пролет',
        lat: 43.8546432,
        lng: 25.9657783,
        type: 'regular',
        aliases: []
    },
    'S058': {
        name: 'Русенски университет',
        lat: 43.8567,
        lng: 25.9952,
        type: 'major',
        aliases: ['Университет', 'РУ Ангел Кънчев']
    },
    'S059': {
        name: 'кв. Париж',
        lat: 43.858828,
        lng: 25.9744117,
        type: 'regular',
        aliases: ['Париж']
    },
    'S060': {
        name: 'ж.к. Цветница',
        lat: 43.8601176,
        lng: 25.979543,
        type: 'regular',
        aliases: ['Цветница']
    },

    // ═══════════════════════════════════════════════════════════
    // FAR NORTHEAST - Захарен завод corridor
    // ═══════════════════════════════════════════════════════════
    'S065': {
        name: 'бул. Тутракан',
        lat: 43.8671856,
        lng: 25.9889152,
        type: 'regular',
        aliases: ['Тутракан']
    },
    'S066': {
        name: 'ж.к. Тракция',
        lat: 43.8643889,
        lng: 25.9862451,
        type: 'regular',
        aliases: ['Тракция', 'ЛВЗ', 'ж.к. Тракция (ЛВЗ)']
    },
    'S067': {
        name: 'Психодиспансер',
        lat: 43.8650046,
        lng: 25.9882167,
        type: 'regular',
        aliases: []
    },
    'S068': {
        name: 'Захарен завод',
        lat: 43.866042,
        lng: 25.994195,
        type: 'terminal',
        aliases: ['Захарния', 'Захарен завод (Тутракан №25)']
    },
    'S069': {
        name: 'ПГ по транспорт',
        lat: 43.8722581,
        lng: 26.0035767,
        type: 'regular',
        aliases: ['Гимназия по транспорт']
    },
    'S070': {
        name: 'Еконт Експрес',
        lat: 43.8736737,
        lng: 26.0114126,
        type: 'regular',
        aliases: ['Еконт Експрес (Домостроене АД)', 'Домостроене АД']
    },
    'S071': {
        name: 'Митница (Дунав мост)',
        lat: 43.8752996,
        lng: 26.0156611,
        type: 'terminal',
        aliases: ['Дунав мост', 'Митница']
    },
    'S072': {
        name: 'Кероес',
        lat: 43.8700,
        lng: 25.9920,
        type: 'regular',
        aliases: ['Индустриален парк']
    },

    // ═══════════════════════════════════════════════════════════
    // NORTH - Гара Разпределителна area
    // ═══════════════════════════════════════════════════════════
    'S075': {
        name: 'Гара Разпределителна',
        lat: 43.8576557,
        lng: 25.997469,
        type: 'terminal',
        aliases: ['Разпределителна']
    },
    'S076': {
        name: 'ул. Иван Ведър',
        lat: 43.8587855,
        lng: 25.9941759,
        type: 'regular',
        aliases: ['Иван Ведър']
    },
    'S077': {
        name: 'Печатница Дунав',
        lat: 43.8545,
        lng: 25.9790,
        type: 'regular',
        aliases: ['Дунав прес']
    },

    // ═══════════════════════════════════════════════════════════
    // WEST - ЖП гара / Хиподрум corridor
    // ═══════════════════════════════════════════════════════════
    'S080': {
        name: 'ул. Борисова',
        lat: 43.8425548,
        lng: 25.9544909,
        type: 'regular',
        aliases: ['Борисова', 'бул. Борисова']
    },
    'S081': {
        name: 'Лермонтов',
        lat: 43.838226,
        lng: 25.9553586,
        type: 'regular',
        aliases: []
    },
    'S082': {
        name: 'Орхидея',
        lat: 43.8409082,
        lng: 25.9548277,
        type: 'regular',
        aliases: []
    },
    'S083': {
        name: 'Медицински център',
        lat: 43.8440251,
        lng: 25.9543539,
        type: 'regular',
        aliases: ['Поликлиника']
    },
    'S084': {
        name: 'бул. Ген. Скобелев',
        lat: 43.8425721,
        lng: 25.9484956,
        type: 'regular',
        aliases: ['Скобелев']
    },
    'S085': {
        name: 'СБА',
        lat: 43.8452796,
        lng: 25.9569194,
        type: 'regular',
        aliases: ['СБА (Скобелев)', 'Скобелев (СБА)']
    },
    'S086': {
        name: 'Хиподрум',
        lat: 43.8594895,
        lng: 26.0264954,
        type: 'regular',
        aliases: []
    },
    'S087': {
        name: 'бул. България',
        lat: 43.8093031,
        lng: 25.9248013,
        type: 'regular',
        aliases: ['България']
    },
    'S088': {
        name: 'Левента',
        lat: 43.8245405,
        lng: 25.9576434,
        type: 'regular',
        aliases: []
    },
    'S089': {
        name: 'Верила',
        lat: 43.8341989,
        lng: 25.9621243,
        type: 'regular',
        aliases: []
    },
    'S090': {
        name: 'Алеко Константинов',
        lat: 43.8519884,
        lng: 25.9556689,
        type: 'regular',
        aliases: ['Училище Алеко Константинов']
    },
    'S091': {
        name: 'п.в. Охлюва',
        lat: 43.8300,
        lng: 25.9530,
        type: 'regular',
        aliases: ['Охлюва']
    },
    'S092': {
        name: 'ул. Стефан Стамболов',
        lat: 43.8365453,
        lng: 25.9494551,
        type: 'regular',
        aliases: ['Стефан Стамболов']
    },
    'S093': {
        name: 'бул. Мидия Енос',
        lat: 43.8327518,
        lng: 25.9533624,
        type: 'regular',
        aliases: ['Мидия Енос']
    },
    'S094': {
        name: 'ж.к. Мидия Енос',
        lat: 43.833512,
        lng: 25.951944,
        type: 'regular',
        aliases: []
    },

    // ═══════════════════════════════════════════════════════════
    // FAR WEST - кв. Долапите / Мальовица
    // ═══════════════════════════════════════════════════════════
    'S100': {
        name: 'кв. Долапите',
        lat: 43.7970036,
        lng: 25.9312298,
        type: 'terminal',
        aliases: ['Долапите']
    },
    'S101': {
        name: 'ул. Димитър Басарбовски',
        lat: 43.823562,
        lng: 25.9389966,
        type: 'regular',
        aliases: ['Димитър Басарбовски']
    },
    'S102': {
        name: 'Петролна база',
        lat: 43.7642742,
        lng: 25.8728951,
        type: 'terminal',
        aliases: []
    },
    'S103': {
        name: 'кв. Средна кула',
        lat: 43.8113164,
        lng: 25.937739,
        type: 'terminal',
        aliases: ['Средна кула']
    },
    'S104': {
        name: 'Мальовица',
        lat: 43.8268973,
        lng: 25.9530839,
        type: 'terminal',
        aliases: ['кв. Мальовица', 'Мальовица (Помощно училище)', 'Помощно училище']
    },
    'S105': {
        name: 'ул. Мальовица',
        lat: 43.8238804,
        lng: 25.9479688,
        type: 'regular',
        aliases: []
    },
    'S106': {
        name: 'ул. Тинтява',
        lat: 43.8277408,
        lng: 25.9577822,
        type: 'regular',
        aliases: ['Тинтява']
    },
    'S107': {
        name: 'бул. Гоце Делчев',
        lat: 43.8266274,
        lng: 25.9648105,
        type: 'regular',
        aliases: ['Гоце Делчев']
    },
    'S108': {
        name: 'Помпена станция',
        lat: 43.8180,
        lng: 25.9450,
        type: 'regular',
        aliases: []
    },

    // ═══════════════════════════════════════════════════════════
    // OTHER NEIGHBORHOODS
    // ═══════════════════════════════════════════════════════════
    'S110': {
        name: 'кв. Здравец',
        lat: 43.8348698,
        lng: 25.9645232,
        type: 'terminal',
        aliases: ['Здравец']
    },
    'S111': {
        name: 'кв. Образцов чифлик',
        lat: 43.8084686,
        lng: 26.0389035,
        type: 'terminal',
        aliases: ['Образцов чифлик']
    },
    'S112': {
        name: 'ж.к. Изток',
        lat: 43.8554235,
        lng: 25.9993781,
        type: 'regular',
        aliases: ['Изток']
    },
    'S113': {
        name: 'пл. Прага',
        lat: 43.8507809,
        lng: 25.9957974,
        type: 'regular',
        aliases: ['пл. Прага - Юг', 'Прага']
    },
    'S114': {
        name: 'пл. Хан Крум',
        lat: 43.8467353,
        lng: 25.9568053,
        type: 'regular',
        aliases: ['Хан Крум']
    },
    'S115': {
        name: 'Западна промишлена зона',
        lat: 43.8310606,
        lng: 25.9373802,
        type: 'terminal',
        aliases: ['ЗПЗ']
    },
    'S116': {
        name: 'Източна промишлена зона',
        lat: 43.8691169,
        lng: 26.0023467,
        type: 'terminal',
        aliases: ['ИПЗ']
    },

    // ═══════════════════════════════════════════════════════════
    // SPECIAL STOPS
    // ═══════════════════════════════════════════════════════════
    'S120': {
        name: 'Метро',
        lat: 43.8146947,
        lng: 25.9273513,
        type: 'regular',
        aliases: ['Metro']
    },
    'S121': {
        name: 'Дом на културата',
        lat: 43.855869,
        lng: 25.9621797,
        type: 'regular',
        aliases: []
    },
    'S122': {
        name: 'Асфалтова база',
        lat: 43.8042695,
        lng: 25.9459789,
        type: 'terminal',
        aliases: ['Асфалтова база - Запад']
    },
    'S123': {
        name: 'Гимназия по корабостроене',
        lat: 43.8379029,
        lng: 25.9510177,
        type: 'regular',
        aliases: ['Корабостроене']
    },
};

// ═══════════════════════════════════════════════════════════════
// LINES - Reference stops by ID
// ═══════════════════════════════════════════════════════════════
const LINES = {
    // ─────────────────────────────────────────────────────────────
    // TROLLEYBUS LINES (7)
    // ─────────────────────────────────────────────────────────────
    'T2': {
        number: '2',
        name: 'Линия 2',
        type: 'trolleybus',
        operator: 'gradski',
        route: 'ж.к. Дружба 3 - Център - ж.к. Чародейка',
        color: '#0891b2',
        stops: [
            'S022', // ж.к. Дружба 3
            'S023', // Блок 18
            'S026', // Трети март
            'S027', // Св. Георги
            'S030', // бул. Липник
            'S031', // Мосю Бриколаж
            'S032', // Кауфланд
            'S033', // Найден Киров
            'S034', // Олимп
            'S035', // Подстанция
            'S003', // Мол Русе
            'S001', // пл. Оборище
            'S040', // бул. Цар Освободител
            'S041', // Печатни платки
            'S042', // бул. Христо Ботев
            'S010'  // ж.к. Чародейка
        ],
        schedule: {
            weekday: { first: '05:30', last: '22:00', frequency: '10-15 мин' },
            weekend: { first: '06:00', last: '21:30', frequency: '15-20 мин' }
        }
    },
    'T9': {
        number: '9',
        name: 'Линия 9',
        type: 'trolleybus',
        operator: 'gradski',
        route: 'ж.к. Чародейка - Център - ж.к. Дружба 1',
        color: '#0891b2',
        stops: [
            'S011', // ж.к. Чародейка Юг
            'S012', // Търговски комплекс
            'S013', // ул. Тодор Икономов
            'S014', // бул. Васил Левски
            'S015', // Блок 115
            'S041', // Печатни платки
            'S040', // бул. Цар Освободител
            'S044', // Училище Йордан Йовков
            'S001', // пл. Оборище
            'S030', // бул. Липник
            'S020', // Дружба 1
            'S028'  // Спортна зала
        ],
        schedule: {
            weekday: { first: '05:45', last: '21:30', frequency: '12-18 мин' },
            weekend: { first: '06:15', last: '21:00', frequency: '18-25 мин' }
        }
    },
    'T13': {
        number: '13',
        name: 'Линия 13',
        type: 'trolleybus',
        operator: 'gradski',
        route: 'Гара Разпределителна - Център - ж.к. Дружба 2',
        color: '#0891b2',
        stops: [
            'S075', // Гара Разпределителна
            'S004', // Автогара Изток
            'S076', // ул. Иван Ведър
            'S077', // Печатница Дунав
            'S003', // Мол Русе
            'S035', // Подстанция
            'S034', // Олимп
            'S033', // Найден Киров
            'S032', // Кауфланд
            'S030', // бул. Липник
            'S044', // Училище Йордан Йовков
            'S021', // ж.к. Дружба 2
            'S025'  // Блок 56
        ],
        schedule: {
            weekday: { first: '05:40', last: '21:45', frequency: '12-15 мин' },
            weekend: { first: '06:00', last: '21:00', frequency: '18-22 мин' }
        }
    },
    'T21': {
        number: '21',
        name: 'Линия 21',
        type: 'trolleybus',
        operator: 'gradski',
        route: 'ж.к. Чародейка Юг - Гара Разпределителна',
        color: '#0891b2',
        stops: [
            'S011', // ж.к. Чародейка Юг (Търговски комплекс)
            'S013', // ул. Тодор Икономов
            'S014', // бул. Васил Левски
            'S015', // Блок 115
            'S042', // бул. Христо Ботев
            'S041', // Печатни платки
            'S040', // бул. Цар Освободител
            'S044', // Училище Йордан Йовков
            'S001', // пл. Оборище
            'S030', // бул. Липник
            'S031', // Мосю Бриколаж
            'S032', // Кауфланд
            'S033', // Найден Киров
            'S034', // Олимп
            'S035', // Подстанция
            'S003', // Мол Русе (Трета поликлиника)
            'S077', // Печатница Дунав
            'S076', // ул. Иван Ведър
            'S004', // Автогара Изток
            'S075'  // Гара Разпределителна
        ],
        schedule: {
            weekday: { first: '05:45', last: '20:10', frequency: '15-20 мин' },
            weekend: { first: '06:30', last: '19:30', frequency: '20-30 мин' }
        }
    },
    'T24': {
        number: '24',
        name: 'Линия 24',
        type: 'trolleybus',
        operator: 'gradski',
        route: 'ж.к. Дружба 3 - Център - Централна ЖП гара',
        color: '#0891b2',
        stops: [
            'S022', // ж.к. Дружба 3 (Блок 45)
            'S086', // Хиподрум
            'S087', // бул. България
            'S088', // Левента
            'S090', // Алеко Константинов
            'S093', // бул. Мидия Енос
            'S002', // Централна ЖП гара
            'S080', // ул. Борисова
            'S081', // Лермонтов
            'S082', // Орхидея
            'S083', // Медицински център
            'S084', // бул. Ген. Скобелев
            'S085', // СБА (Скобелев)
            'S001', // пл. Оборище
            'S044'  // Училище Йордан Йовков
        ],
        schedule: {
            weekday: { first: '05:50', last: '21:15', frequency: '15-20 мин' },
            weekend: { first: '06:15', last: '20:30', frequency: '20-25 мин' }
        }
    },
    'T27': {
        number: '27',
        name: 'Линия 27',
        type: 'trolleybus',
        operator: 'gradski',
        route: 'пл. Оборище - Окръжна болница - Русенски университет',
        color: '#0891b2',
        stops: [
            'S001', // пл. Оборище
            'S044', // Училище Йордан Йовков
            'S041', // Печатни платки
            'S051', // Пантеона
            'S052', // бул. Съединение
            'S054', // Парк на Възрожденците
            'S055', // Окръжна болница
            'S056', // ул. Плиска
            'S057', // Първа пролет
            'S058', // Русенски университет
            'S059', // кв. Париж
            'S060'  // ж.к. Цветница
        ],
        schedule: {
            weekday: { first: '06:00', last: '20:30', frequency: '18-25 мин' },
            weekend: { first: '07:00', last: '19:30', frequency: '25-35 мин' }
        }
    },
    'T29': {
        number: '29',
        name: 'Линия 29',
        type: 'trolleybus',
        operator: 'gradski',
        route: 'ж.к. Чародейка Юг - Захарен завод',
        color: '#0891b2',
        stops: [
            'S011', // ж.к. Чародейка Юг
            'S014', // бул. Васил Левски
            'S041', // Печатни платки
            'S044', // Училище Йордан Йовков
            'S001', // пл. Оборище
            'S051', // Пантеона
            'S055', // Окръжна болница
            'S058', // Русенски университет
            'S060', // ж.к. Цветница
            'S065', // бул. Тутракан
            'S066', // ж.к. Тракция (ЛВЗ)
            'S067', // Психодиспансер
            'S068'  // Захарен завод
        ],
        schedule: {
            weekday: { first: '05:55', last: '20:45', frequency: '18-22 мин' },
            weekend: { first: '06:30', last: '19:45', frequency: '25-30 мин' }
        }
    },

    // ─────────────────────────────────────────────────────────────
    // BUS LINES (17)
    // ─────────────────────────────────────────────────────────────
    'B3': {
        number: '3',
        name: 'Линия 3',
        type: 'bus',
        operator: 'ogt',
        route: 'Център - кв. Средна кула',
        color: '#059669',
        stops: ['S001', 'S040', 'S045', 'S103'],
        schedule: {
            weekday: { first: '06:00', last: '20:00', frequency: '30-40 мин' },
            weekend: { first: '07:00', last: '19:00', frequency: '45-60 мин' }
        }
    },
    'B4': {
        number: '4',
        name: 'Линия 4',
        type: 'bus',
        operator: 'ogt',
        route: 'Център - кв. Източна промишлена зона',
        color: '#059669',
        stops: ['S002', 'S001', 'S004', 'S116'],
        schedule: {
            weekday: { first: '06:15', last: '19:30', frequency: '35-45 мин' },
            weekend: { first: '07:30', last: '18:30', frequency: '50-70 мин' }
        }
    },
    'B5': {
        number: '5',
        name: 'Линия 5',
        type: 'bus',
        operator: 'ogt',
        route: 'Център - кв. Образцов чифлик',
        color: '#059669',
        stops: ['S002', 'S080', 'S111'],
        schedule: {
            weekday: { first: '06:30', last: '19:00', frequency: '40-50 мин' },
            weekend: { first: '08:00', last: '18:00', frequency: '60-90 мин' }
        }
    },
    'B6': {
        number: '6',
        name: 'Линия 6',
        type: 'bus',
        operator: 'shans99',
        route: 'Дом на културата - Асфалтова база',
        color: '#059669',
        stops: ['S121', 'S001', 'S030', 'S032', 'S072', 'S122'],
        schedule: {
            weekday: { first: '06:00', last: '19:30', frequency: '25-35 мин' },
            weekend: { first: '07:00', last: '18:30', frequency: '40-50 мин' }
        }
    },
    'B8': {
        number: '8',
        name: 'Линия 8',
        type: 'bus',
        operator: 'ogt',
        route: 'Център - Западна промишлена зона',
        color: '#059669',
        stops: ['S001', 'S040', 'S115'],
        schedule: {
            weekday: { first: '06:20', last: '18:45', frequency: '35-50 мин' },
            weekend: { first: '08:00', last: '17:00', frequency: '60-90 мин' }
        }
    },
    'B10': {
        number: '10',
        name: 'Линия 10',
        type: 'bus',
        operator: 'ogt',
        route: 'Център - кв. Здравец',
        color: '#059669',
        stops: ['S002', 'S001', 'S110'],
        schedule: {
            weekday: { first: '06:30', last: '20:00', frequency: '30-40 мин' },
            weekend: { first: '07:30', last: '19:00', frequency: '45-60 мин' }
        }
    },
    'B11': {
        number: '11',
        name: 'Линия 11',
        type: 'bus',
        operator: 'ogt',
        route: 'кв. Мальовица (Помощно училище) - Дунав мост',
        color: '#059669',
        stops: [
            'S104', // Мальовица (Помощно училище)
            'S105', // ул. Мальовица
            'S106', // ул. Тинтява
            'S107', // бул. Гоце Делчев
            'S108', // Помпена станция
            'S087', // бул. България
            'S089', // Верила
            'S088', // Левента
            'S090', // Училище Алеко Константинов
            'S091', // п.в. Охлюва
            'S092', // ул. Стефан Стамболов
            'S093', // бул. Мидия Енос
            'S094', // ж.к. Мидия Енос
            'S002', // Централна ЖП гара
            'S080', // ул. Борисова
            'S081', // Лермонтов
            'S082', // Орхидея
            'S083', // Медицински център
            'S084', // бул. Ген. Скобелев
            'S085', // Скобелев (СБА)
            'S001', // пл. Оборище
            'S040', // бул. Цар Освободител
            'S050', // Спортна зала ОЗК Арена
            'S051', // Пантеона
            'S052', // бул. Съединение
            'S053', // ул. Св. Наум
            'S054', // Парк на Възрожденците
            'S055', // Окръжна болница
            'S056', // ул. Плиска
            'S057', // Първа пролет
            'S058', // Русенски университет
            'S059', // Париж
            'S060', // ж.к. Цветница
            'S065', // бул. Тутракан
            'S066', // ж.к. Тракция (ЛВЗ)
            'S067', // Психодиспансер
            'S068', // Захарен завод
            'S069', // ПГ по транспорт
            'S070', // Еконт Експрес (Домостроене АД)
            'S071'  // Митница (Дунав мост)
        ],
        schedule: {
            weekday: { first: '05:30', last: '21:15', frequency: '40-55 мин' },
            weekend: { first: '06:30', last: '20:00', frequency: '60-90 мин' }
        }
    },
    'B12': {
        number: '12',
        name: 'Линия 12',
        type: 'bus',
        operator: 'shans99',
        route: 'Централна ЖП гара - Захарен завод',
        color: '#059669',
        stops: [
            'S002', // Централна ЖП гара (ул. Николаевска)
            'S093', // бул. Мидия Енос
            'S092', // ул. Стефан Стамболов
            'S087', // бул. България
            'S088', // Левента
            'S022', // ж.к. Дружба 3
            'S086', // Хиподрум
            'S065', // бул. Тутракан
            'S060', // ж.к. Цветница
            'S058', // Русенски университет
            'S066', // ж.к. Тракция
            'S067', // Психодиспансер
            'S068'  // Захарен завод (Тутракан №25)
        ],
        schedule: {
            weekday: { first: '06:00', last: '20:30', frequency: '12-18 мин' },
            weekend: { first: '06:30', last: '19:30', frequency: '20-25 мин' }
        }
    },
    'B15': {
        number: '15',
        name: 'Линия 15',
        type: 'bus',
        operator: 'shans99',
        route: 'кв. Долапите - Централна ЖП гара',
        color: '#059669',
        stops: ['S100', 'S101', 'S030', 'S001', 'S040', 'S002'],
        schedule: {
            weekday: { first: '06:00', last: '19:30', frequency: '30-40 мин' },
            weekend: { first: '07:00', last: '18:30', frequency: '45-60 мин' }
        }
    },
    'B16': {
        number: '16',
        name: 'Линия 16',
        type: 'bus',
        operator: 'ogt',
        route: 'Гара Разпределителна - кв. Долапите - Петролна база',
        color: '#059669',
        stops: ['S075', 'S004', 'S030', 'S100', 'S102'],
        schedule: {
            weekday: { first: '06:15', last: '18:45', frequency: '40-60 мин' },
            weekend: { first: '08:00', last: '17:00', frequency: '70-90 мин' }
        }
    },
    'B18': {
        number: '18',
        name: 'Линия 18',
        type: 'bus',
        operator: 'ogt',
        route: 'Хиподрум - ж.к. Дружба 3 (Блок 45)',
        color: '#059669',
        stops: [
            'S086', // Хиподрум
            'S087', // бул. България
            'S088', // Левента
            'S090', // Алеко Константинов
            'S093', // бул. Мидия Енос
            'S002', // Централна ЖП гара
            'S080', // ул. Борисова
            'S081', // Лермонтов
            'S082', // Орхидея
            'S084', // бул. Ген. Скобелев
            'S001', // пл. Оборище
            'S030', // бул. Липник
            'S032', // Кауфланд
            'S031', // Мосю Бриколаж
            'S020', // ж.к. Дружба 1
            'S021', // ж.к. Дружба 2
            'S022', // ж.к. Дружба 3
            'S024'  // Блок 45
        ],
        schedule: {
            weekday: { first: '05:50', last: '19:20', frequency: '25-35 мин' },
            weekend: { first: '05:50', last: '18:30', frequency: '35-50 мин' }
        }
    },
    'B19': {
        number: '19',
        name: 'Линия 19',
        type: 'bus',
        operator: 'ogt',
        route: 'Метро - Кооперативен пазар (ЖП прелез)',
        color: '#059669',
        stops: ['S120', 'S030', 'S032', 'S034', 'S003', 'S001', 'S040', 'S044'],
        schedule: {
            weekday: { first: '07:00', last: '19:00', frequency: '35-50 мин' },
            weekend: { first: null, last: null, frequency: 'Не се движи' }
        }
    },
    'B20': {
        number: '20',
        name: 'Линия 20',
        type: 'bus',
        operator: 'ogt',
        route: 'Гимназия по корабостроене - ж.к. Изток (пл. Прага)',
        color: '#059669',
        stops: ['S123', 'S045', 'S040', 'S001', 'S005', 'S112', 'S113'],
        schedule: {
            weekday: { first: '06:05', last: '17:10', frequency: '40-60 мин' },
            weekend: { first: '07:30', last: '17:10', frequency: '70-90 мин' }
        }
    },
    'B23': {
        number: '23',
        name: 'Линия 23',
        type: 'bus',
        operator: 'ogt',
        route: 'ж.к. Дружба 3 - Център - пл. Хан Крум',
        color: '#059669',
        stops: ['S022', 'S021', 'S020', 'S030', 'S001', 'S114'],
        schedule: {
            weekday: { first: '06:00', last: '20:00', frequency: '30-40 мин' },
            weekend: { first: '07:00', last: '19:00', frequency: '45-60 мин' }
        }
    },
    'B28': {
        number: '28',
        name: 'Линия 28',
        type: 'bus',
        operator: 'ogt',
        route: 'ж.к. Дружба 3 - Център - Индустриален парк',
        color: '#059669',
        stops: ['S022', 'S030', 'S001', 'S044', 'S051', 'S055', 'S058', 'S060', 'S072'],
        schedule: {
            weekday: { first: '05:15', last: '20:30', frequency: '25-40 мин' },
            weekend: { first: '06:30', last: '19:00', frequency: '40-60 мин' }
        }
    },
    'B30': {
        number: '30',
        name: 'Линия 30',
        type: 'bus',
        operator: 'ogt',
        route: 'ж.к. Чародейка - Хотел Рига - Център',
        color: '#059669',
        stops: ['S010', 'S042', 'S041', 'S043', 'S040', 'S001'],
        schedule: {
            weekday: { first: '06:00', last: '20:00', frequency: '30-40 мин' },
            weekend: { first: '07:00', last: '19:00', frequency: '45-60 мин' }
        }
    },
    'B33': {
        number: '33',
        name: 'Линия 33',
        type: 'bus',
        operator: 'ogt',
        route: 'Гара Разпределителна - Образцов чифлик',
        color: '#059669',
        stops: ['S075', 'S004', 'S030', 'S001', 'S002', 'S111'],
        schedule: {
            weekday: { first: '05:55', last: '19:20', frequency: '60-120 мин' },
            weekend: { first: '07:00', last: '18:00', frequency: '90-150 мин' }
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// OPERATORS
// ═══════════════════════════════════════════════════════════════
const OPERATORS = {
    'gradski': {
        name: 'Градски транспорт АД',
        type: 'trolleybus',
        website: 'https://www.transport-ruse.com/'
    },
    'shans99': {
        name: 'ШАНС-99 ООД',
        type: 'bus',
        website: ''
    },
    'geocomers': {
        name: 'Геокомерс ООД',
        type: 'bus',
        website: ''
    },
    'ogt': {
        name: 'Общински градски транспорт ЕАД',
        type: 'bus',
        website: ''
    }
};

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
    center: [43.8356, 25.9657],
    defaultZoom: 13,
    fares: {
        singleRide: 1.60,
        currency: 'лв.',
        paymentMethods: ['Кеш при шофьора', 'Електронна карта', 'Абонаментна карта'],
        notes: 'Всички линии са с безкондукторно обслужване.'
    }
};


// ROUTE_GEOMETRIES loaded asynchronously from data/route-geometries.json
let ROUTE_GEOMETRIES = {};

async function loadRouteGeometries() {
    try {
        const response = await fetch('data/route-geometries.json');
        if (!response.ok) throw new Error('Failed to load route geometries');
        ROUTE_GEOMETRIES = await response.json();
        return ROUTE_GEOMETRIES;
    } catch (e) {
        console.error('Error loading route geometries:', e);
        return {};
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get stop by ID
 */
function getStop(stopId) {
    return STOPS[stopId] || null;
}

/**
 * Get stop name by ID
 */
function getStopName(stopId) {
    const stop = STOPS[stopId];
    return stop ? stop.name : 'Неизвестна спирка';
}

/**
 * Get line by ID
 */
function getLine(lineId) {
    return LINES[lineId] || null;
}

/**
 * Get all stops for a line (with full data)
 */
function getLineStops(lineId) {
    const line = LINES[lineId];
    if (!line) return [];

    return line.stops.map((stopId, index) => ({
        id: stopId,
        index: index,
        ...STOPS[stopId]
    }));
}

/**
 * Get stop position in line (0-based index)
 */
function getStopPositionInLine(lineId, stopId) {
    const line = LINES[lineId];
    if (!line) return -1;
    return line.stops.indexOf(stopId);
}

/**
 * Build reverse index: stopId -> [lineIds]
 */
function buildStopToLinesIndex() {
    const index = {};
    for (const [lineId, line] of Object.entries(LINES)) {
        for (const stopId of line.stops) {
            if (!index[stopId]) {
                index[stopId] = [];
            }
            if (!index[stopId].includes(lineId)) {
                index[stopId].push(lineId);
            }
        }
    }
    return index;
}

// Pre-compute the index
const STOP_LINES_INDEX = buildStopToLinesIndex();

/**
 * Get all lines that pass through a stop
 */
function getLinesForStop(stopId) {
    const lineIds = STOP_LINES_INDEX[stopId] || [];
    return lineIds.map(id => ({ id, ...LINES[id] }));
}

/**
 * Get line IDs for a stop (fast lookup)
 */
function getLineIdsForStop(stopId) {
    return STOP_LINES_INDEX[stopId] || [];
}

/**
 * Search stops by name or alias
 */
function searchStops(query) {
    const q = query.toLowerCase();
    const results = [];

    for (const [id, stop] of Object.entries(STOPS)) {
        const nameMatch = stop.name.toLowerCase().includes(q);
        const aliasMatch = stop.aliases.some(a => a.toLowerCase().includes(q));

        if (nameMatch || aliasMatch) {
            results.push({ id, ...stop, lines: getLineIdsForStop(id) });
        }
    }

    return results;
}

/**
 * Find stop ID by name (exact or alias match)
 */
function findStopIdByName(name) {
    const n = name.toLowerCase();
    for (const [id, stop] of Object.entries(STOPS)) {
        if (stop.name.toLowerCase() === n) return id;
        if (stop.aliases.some(a => a.toLowerCase() === n)) return id;
    }
    return null;
}

/**
 * Get all stops as array (for map rendering)
 */
function getAllStops() {
    return Object.entries(STOPS).map(([id, stop]) => ({
        id,
        ...stop,
        lines: getLineIdsForStop(id)
    }));
}

/**
 * Get all lines as array
 */
function getAllLines() {
    return Object.entries(LINES).map(([id, line]) => ({
        id,
        ...line
    }));
}

/**
 * Get trolleybus lines
 */
function getTrolleybusLines() {
    return getAllLines().filter(l => l.type === 'trolleybus');
}

/**
 * Get bus lines
 */
function getBusLines() {
    return getAllLines().filter(l => l.type === 'bus');
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

function validateData() {
    const errors = [];
    const warnings = [];

    // Check all line stop references
    for (const [lineId, line] of Object.entries(LINES)) {
        for (let i = 0; i < line.stops.length; i++) {
            const stopId = line.stops[i];
            if (!STOPS[stopId]) {
                errors.push(`Line ${lineId}: references non-existent stop "${stopId}" at position ${i}`);
            }
        }

        // Check for duplicate consecutive stops
        for (let i = 1; i < line.stops.length; i++) {
            if (line.stops[i] === line.stops[i-1]) {
                warnings.push(`Line ${lineId}: duplicate consecutive stop "${line.stops[i]}" at position ${i}`);
            }
        }
    }

    // Check for orphan stops
    for (const stopId of Object.keys(STOPS)) {
        if (!STOP_LINES_INDEX[stopId] || STOP_LINES_INDEX[stopId].length === 0) {
            warnings.push(`Stop ${stopId} (${STOPS[stopId].name}) is not used by any line`);
        }
    }

    return { errors, warnings, valid: errors.length === 0 };
}

// ═══════════════════════════════════════════════════════════════
// ESTIMATED ARRIVAL (improved)
// ═══════════════════════════════════════════════════════════════

function calculateEstimatedArrival(lineId, stopId) {
    const line = LINES[lineId];
    if (!line) return { available: false, message: 'Линията не съществува' };

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

    // Get frequency
    const frequencyMatch = schedule.frequency.match(/(\d+)/);
    const avgFrequency = frequencyMatch ? parseInt(frequencyMatch[1]) : 15;

    // Use stop position to adjust arrival time
    const stopIndex = getStopPositionInLine(lineId, stopId);
    const stopCount = line.stops.length;
    const positionRatio = stopIndex >= 0 ? stopIndex / stopCount : 0.5;

    // Calculate minutes until next arrival based on current time and frequency
    // This creates a consistent, time-based estimate instead of random
    const minutesSinceFirstService = currentTimeMinutes - firstTimeMinutes;
    const cyclePosition = minutesSinceFirstService % avgFrequency;
    const baseMinutes = avgFrequency - cyclePosition;
    const positionAdjustment = Math.floor(positionRatio * avgFrequency * 0.3);
    const minutesUntilNext = Math.max(1, Math.min(baseMinutes + positionAdjustment, avgFrequency));

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

// ═══════════════════════════════════════════════════════════════
// GEOJSON GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Create GeoJSON for stops (for Leaflet)
 */
function createStopsGeoJSON() {
    return {
        type: 'FeatureCollection',
        features: getAllStops().map(stop => ({
            type: 'Feature',
            properties: {
                id: stop.id,
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

/**
 * Create GeoJSON for routes (for Leaflet)
 */
function createRoutesGeoJSON() {
    return {
        type: 'FeatureCollection',
        features: getAllLines().map(line => ({
            type: 'Feature',
            properties: {
                id: line.id,
                number: line.number,
                name: line.name,
                type: line.type,
                route: line.route,
                color: line.color
            },
            geometry: ROUTE_GEOMETRIES[line.id] || { type: 'LineString', coordinates: [] }
        }))
    };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STOPS,
        LINES,
        OPERATORS,
        CONFIG,
        ROUTE_GEOMETRIES,
        getStop,
        getStopName,
        getLine,
        getLineStops,
        getStopPositionInLine,
        getLinesForStop,
        getLineIdsForStop,
        searchStops,
        findStopIdByName,
        getAllStops,
        getAllLines,
        getTrolleybusLines,
        getBusLines,
        validateData,
        calculateEstimatedArrival,
        createStopsGeoJSON,
        createRoutesGeoJSON,
        loadRouteGeometries
    };
}

// For browser global access
if (typeof window !== 'undefined') {
    window.TRANSIT_DATA = {
        STOPS,
        LINES,
        OPERATORS,
        CONFIG,
        ROUTE_GEOMETRIES,
        // Expose helper functions
        getStop,
        getStopName,
        getLine,
        getLineStops,
        getStopPositionInLine,
        getLinesForStop,
        getLineIdsForStop,
        searchStops,
        findStopIdByName,
        getAllStops,
        getAllLines,
        getTrolleybusLines,
        getBusLines,
        validateData,
        calculateEstimatedArrival,
        createStopsGeoJSON,
        createRoutesGeoJSON,
        loadRouteGeometries,
        // Compatibility aliases
        center: CONFIG.center,
        defaultZoom: CONFIG.defaultZoom,
        trolleybusLines: getTrolleybusLines(),
        busLines: getBusLines()
    };
}
