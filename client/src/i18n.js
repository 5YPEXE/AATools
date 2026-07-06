// i18n.js — Minimal bilingual translation helper (TR / EN)

const translations = {
  tr: {
    // Navigation
    dashboard: 'Dashboard',
    map: 'Harita',
    lines: 'Hatlar',
    stops: 'Duraklar',
    fares: 'Tarifeler',
    companies: 'Şirketler',
    transfer: 'Aktarma Analizi',
    excelLens: 'Excel Lens',
    dbComparator: 'DB Karşılaştırıcı',
    sqlPlayground: 'SQL Sorgu Sihirbazı',
    textCompare: 'Metin Karşılaştırıcı',
    dataCleaner: 'Veri Temizleyici',
    fileConverter: 'Evrensel Dönüştürücü',
    pdfToolbox: 'PDF Araç Kutusu',
    todoList: 'Görev Yöneticisi',
    language: 'Dil',

    // Dashboard
    overview: 'Genel Bakış',
    totalLines: 'Toplam Hat',
    totalStops: 'Toplam Durak',
    totalCompanies: 'Şirket Sayısı',
    totalZones: 'Tarife Bölgesi',
    totalCardTypes: 'Kart Tipi',
    totalFareRules: 'Tarife Kuralı',
    totalTransferRules: 'Transfer Kuralı',
    fareRange: 'Tarife Aralığı',
    minFare: 'En Düşük',
    maxFare: 'En Yüksek',
    avgFare: 'Ortalama',
    zoneDistribution: 'Zone Bazında Hat Dağılımı',
    companyDistribution: 'Şirket Bazında Hat Dağılımı',
    fareDistribution: 'Tarife Dağılımı',
    timeZoneRules: 'Zaman Dilimi Kural Sayısı',
    zone: 'Zone',
    lineCount: 'Hat Sayısı',
    count: 'Sayı',
    fareRange_label: 'Ücret Aralığı (TL)',

    // Lines
    lineId: 'Hat No',
    lineName: 'Hat Adı',
    zoneId: 'Zone',
    stopCount: 'Durak Sayısı',
    lineDetail: 'Hat Detayı',
    direction: 'Yön',
    forward: 'Gidiş',
    return: 'Dönüş',
    position: 'Sıra',
    stopType: 'Durak Tipi',
    companies_label: 'Şirketler',

    // Stops
    stopId: 'Durak No',
    stopName: 'Durak Adı',
    coordinates: 'Koordinatlar',
    lines_label: 'Hatlar',
    stopDetail: 'Durak Detayı',

    // Fares
    fareId: 'Tarife ID',
    fare: 'Ücret (TL)',
    cardTypeId: 'Kart Tipi',
    timeZoneId: 'Zaman Dilimi',
    stop_type: 'Durak Tipi',
    fareFilter: 'Filtrele',
    allCardTypes: 'Tüm Kart Tipleri',
    allTimeZones: 'Tüm Zaman Dilimleri',
    allStopTypes: 'Tüm Durak Tipleri',
    transferDiscounts: 'Transfer İndirimleri',
    bankCommission: 'Banka Komisyonları',
    range: 'Aralık (TL)',
    commission: 'Komisyon',

    // Companies
    companyId: 'Şirket No',
    companyDetail: 'Şirket Detayı',

    // Common
    search: 'Ara...',
    loading: 'Yükleniyor...',
    error: 'Hata',
    noData: 'Veri bulunamadı',
    page: 'Sayfa',
    of: '/',
    previous: 'Önceki',
    next: 'Sonraki',
    rows: 'kayıt',
    showingOf: 'gösteriliyor',
    filterByZone: 'Zone Filtrele',
    allZones: 'Tüm Zoneler',
    backToList: 'Listeye Dön',
    appTitle: 'AATools Ofis Paneli',
    appSubtitle: 'Akıllı Ofis ve Veri Analiz Platformu',
    dataVersion: 'Veri Versiyonu',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    map: 'Map',
    lines: 'Lines',
    stops: 'Stops',
    fares: 'Fares',
    companies: 'Companies',
    transfer: 'Transfer Analysis',
    excelLens: 'Excel Lens',
    dbComparator: 'DB Comparator',
    sqlPlayground: 'SQL Query Wizard',
    textCompare: 'Text Comparator',
    dataCleaner: 'Data Cleaner',
    fileConverter: 'Universal Converter',
    pdfToolbox: 'PDF Toolbox',
    todoList: 'Task Manager',
    language: 'Language',

    // Dashboard
    overview: 'Overview',
    totalLines: 'Total Lines',
    totalStops: 'Total Stops',
    totalCompanies: 'Companies',
    totalZones: 'Fare Zones',
    totalCardTypes: 'Card Types',
    totalFareRules: 'Fare Rules',
    totalTransferRules: 'Transfer Rules',
    fareRange: 'Fare Range',
    minFare: 'Minimum',
    maxFare: 'Maximum',
    avgFare: 'Average',
    zoneDistribution: 'Lines by Zone',
    companyDistribution: 'Lines by Company',
    fareDistribution: 'Fare Distribution',
    timeZoneRules: 'Rules by Time Zone',
    zone: 'Zone',
    lineCount: 'Line Count',
    count: 'Count',
    fareRange_label: 'Fare Range (TL)',

    // Lines
    lineId: 'Line No',
    lineName: 'Line Name',
    zoneId: 'Zone',
    stopCount: 'Stop Count',
    lineDetail: 'Line Detail',
    direction: 'Direction',
    forward: 'Outbound',
    return: 'Return',
    position: 'Position',
    stopType: 'Stop Type',
    companies_label: 'Companies',

    // Stops
    stopId: 'Stop No',
    stopName: 'Stop Name',
    coordinates: 'Coordinates',
    lines_label: 'Lines',
    stopDetail: 'Stop Detail',

    // Fares
    fareId: 'Fare ID',
    fare: 'Fare (TL)',
    cardTypeId: 'Card Type',
    timeZoneId: 'Time Zone',
    stop_type: 'Stop Type',
    fareFilter: 'Filter',
    allCardTypes: 'All Card Types',
    allTimeZones: 'All Time Zones',
    allStopTypes: 'All Stop Types',
    transferDiscounts: 'Transfer Discounts',
    bankCommission: 'Bank Commissions',
    range: 'Range (TL)',
    commission: 'Commission',

    // Companies
    companyId: 'Company No',
    companyDetail: 'Company Detail',

    // Common
    search: 'Search...',
    loading: 'Loading...',
    error: 'Error',
    noData: 'No data found',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    rows: 'rows',
    showingOf: 'showing',
    filterByZone: 'Filter by Zone',
    allZones: 'All Zones',
    backToList: 'Back to List',
    appTitle: 'AATools Office Panel',
    appSubtitle: 'Smart Office & Data Analysis Platform',
    dataVersion: 'Data Version',
  }
};

export function t(lang, key) {
  return translations[lang]?.[key] ?? translations['tr']?.[key] ?? key;
}

export const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' }
];
