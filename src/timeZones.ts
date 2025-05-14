/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
export const timezoneAliases: Record<string, string> = {
    // Asia
    'Asia/Calcutta': 'Asia/Kolkata',          // Renamed in 2008 [[1]][[2]][[9]]
    'Asia/Culcutta': 'Asia/Kolkata',          // Common typo
    'Asia/Saigon': 'Asia/Ho_Chi_Minh',        // Vietnam renamed Saigon to Ho Chi Minh City
    'Asia/Rangoon': 'Asia/Yangon',            // Myanmar renamed Rangoon to Yangon
    'Asia/Istanbul': 'Europe/Istanbul',       // Istanbul moved from Asia to Europe
    'Asia/Chongqing': 'Asia/Shanghai',        // China consolidated timezones under Shanghai
    'Asia/Harbin': 'Asia/Shanghai',
    'Asia/Urumqi': 'Asia/Shanghai',
    'Asia/Kashgar': 'Asia/Shanghai',
    'Asia/Thimbu': 'Asia/Thimphu',            // Bhutan's capital name correction
    'Asia/Ashkhabad': 'Asia/Ashgabat',        // Turkmenistan's capital name correction
    'Asia/Kathmandu': 'Asia/Kathmandu',       // Nepal's capital remains unchanged
    'Asia/Dacca': 'Asia/Dhaka',               // Bangladesh's capital name correction
    'Asia/Dili': 'Asia/Dili',                 // East Timor's capital remains unchanged
    'Asia/Dubai': 'Asia/Dubai',               // United Arab Emirates remains unchanged
    'Asia/Kuala_Lumpur': 'Asia/Kuala_Lumpur', // Malaysia's capital remains unchanged
    'Asia/Jakarta': 'Asia/Jakarta',           // Indonesia's capital remains unchanged
    'Asia/Kolkata': 'Asia/Kolkata',           // Canonical name
    'Asia/Dhaka': 'Asia/Dhaka',               // Bangladesh's capital remains unchanged
    'Asia/Tbilisi': 'Asia/Tbilisi',           // Georgia's capital remains unchanged
    'Asia/Tehran': 'Asia/Tehran',             // Iran's capital remains unchanged
    'Asia/Kabul': 'Asia/Kabul',               // Afghanistan's capital remains unchanged

    // Europe
    'Europe/Kiev': 'Europe/Kyiv',             // Ukraine's capital name correction
    'W-SU': 'Europe/Moscow',                  // Legacy name for Moscow timezone
    'GB': 'Europe/London',                    // UK alias
    'GB-Eire': 'Europe/London',
    'Eire': 'Europe/Dublin',                  // Ireland's legacy name
    'Europe/Minsk': 'Europe/Minsk',           // Belarus' capital remains unchanged
    'Europe/Bucharest': 'Europe/Bucharest',   // Romania's capital remains unchanged
    'Europe/Budapest': 'Europe/Budapest',     // Hungary's capital remains unchanged
    'Europe/Prague': 'Europe/Prague',         // Czech Republic's capital remains unchanged
    'Europe/Vienna': 'Europe/Vienna',         // Austria's capital remains unchanged
    'Europe/Berlin': 'Europe/Berlin',         // Germany's capital remains unchanged
    'Europe/Zurich': 'Europe/Zurich',         // Switzerland's capital remains unchanged
    'Europe/Paris': 'Europe/Paris',           // France's capital remains unchanged
    'Europe/Lisbon': 'Europe/Lisbon',         // Portugal's capital remains unchanged
    'Europe/Madrid': 'Europe/Madrid',         // Spain's capital remains unchanged
    'Europe/Rome': 'Europe/Rome',             // Italy's capital remains unchanged
    'Europe/Athens': 'Europe/Athens',         // Greece's capital remains unchanged
    'Europe/Istanbul': 'Europe/Istanbul',     // Turkey's capital remains unchanged

    // Americas
    'US/Pacific': 'America/Los_Angeles',      // Common US timezone aliases
    'US/Eastern': 'America/New_York',
    'US/Mountain': 'America/Denver',
    'US/Central': 'America/Chicago',
    'US/Hawaii': 'Pacific/Honolulu',
    'US/Alaska': 'America/Anchorage',
    'Canada/Eastern': 'America/Toronto',
    'Canada/Central': 'America/Winnipeg',
    'Canada/Mountain': 'America/Edmonton',
    'Canada/Pacific': 'America/Vancouver',
    'America/Porto_Acre': 'America/Rio_Branco', // Brazil city name correction
    'America/Argentina/Buenos_Aires': 'America/Argentina/Buenos_Aires', // Argentina's hierarchy
    'America/Sao_Paulo': 'America/Sao_Paulo', // Brazil's capital remains unchanged
    'America/Mexico_City': 'America/Mexico_City', // Mexico's capital remains unchanged
    'America/Bogota': 'America/Bogota',       // Colombia's capital remains unchanged
    'America/Lima': 'America/Lima',           // Peru's capital remains unchanged
    'America/Santiago': 'America/Santiago',   // Chile's capital remains unchanged
    'America/Caracas': 'America/Caracas',     // Venezuela's capital remains unchanged
    'America/Havana': 'America/Havana',       // Cuba's capital remains unchanged
    'America/Toronto': 'America/Toronto',     // Canada's capital remains unchanged

    // Australia/Oceania
    'Australia/NSW': 'Australia/Sydney',      // NSW state alias
    'Australia/Victoria': 'Australia/Melbourne',
    'Australia/Queensland': 'Australia/Brisbane',
    'Australia/Tasmania': 'Australia/Hobart',
    'Australia/ACT': 'Australia/Canberra',
    'Australia/North': 'Australia/Darwin',
    'Australia/West': 'Australia/Perth',
    'Australia/South': 'Australia/Adelaide',

    // Africa
    'Africa/Asmera': 'Africa/Asmara',         // Eritrea's capital name correction
    'Africa/Timbuktu': 'Africa/Bamako',       // Mali's Timbuktu linked to Bamako
    'Africa/Cairo': 'Africa/Cairo',           // Egypt's capital remains unchanged
    'Africa/Casablanca': 'Africa/Casablanca', // Morocco's capital remains unchanged
    'Africa/Johannesburg': 'Africa/Johannesburg', // South Africa's capital remains unchanged
    'Africa/Nairobi': 'Africa/Nairobi',       // Kenya's capital remains unchanged
    'Africa/Lagos': 'Africa/Lagos',           // Nigeria's capital remains unchanged
    'Africa/Abidjan': 'Africa/Abidjan',       // Ivory Coast's capital remains unchanged
    'Africa/Algiers': 'Africa/Algiers',       // Algeria's capital remains unchanged
    'Africa/Tunis': 'Africa/Tunis',           // Tunisia's capital remains unchanged
    'Africa/Maputo': 'Africa/Maputo',         // Mozambique's capital remains unchanged

    // Pacific
    'Pacific/Ponape': 'Pacific/Pohnpei',      // Micronesia's Ponape renamed
    'Pacific/Truk': 'Pacific/Chuuk',          // Chuuk State name correction
    'Pacific/Yap': 'Pacific/Chuuk',
    'Pacific/Auckland': 'Pacific/Auckland',   // New Zealand's capital remains unchanged
    'Pacific/Fiji': 'Pacific/Fiji',           // Fiji's capital remains unchanged
    'Pacific/Tahiti': 'Pacific/Tahiti',       // French Polynesia's capital remains unchanged
    'Pacific/Guam': 'Pacific/Guam',           // Guam's capital remains unchanged
    'Pacific/Honolulu': 'Pacific/Honolulu',   // Hawaii's capital remains unchanged
    'Pacific/Marquesas': 'Pacific/Marquesas', // Marquesas Islands remain unchanged

    // Middle East
    'Asia/Tel_Aviv': 'Asia/Jerusalem',        // Israel's Tel Aviv linked to Jerusalem
    'Asia/Beirut': 'Asia/Beirut',             // Lebanon's capital remains unchanged
    'Asia/Damascus': 'Asia/Damascus',         // Syria's capital remains unchanged
    'Asia/Jerusalem': 'Asia/Jerusalem',       // Canonical name

    // Miscellaneous
    'America/Coral_Harbour': 'America/Atikokan', // Canada/US border timezone
    // Americas
    'US/Arizona': 'America/Phoenix',          // Arizona does not observe daylight saving time
    'US/Samoa': 'Pacific/Samoa',              // American Samoa uses Samoa Standard Time
    'US/Indiana-Starke': 'America/Chicago',   // Indiana counties using Central Time
    'US/Indiana-Vevay': 'America/New_York',   // Indiana counties using Eastern Time
    'US/Indiana-Tell City': 'America/Indiana/Tell_City', // Specific Indiana timezone
    'US/Indiana-Knox': 'America/Indiana/Knox', // Specific Indiana timezone

    // Europe
    'CET': 'Europe/Berlin',                   // Central European Time
    'CEST': 'Europe/Berlin',                  // Central European Summer Time
    'MET': 'Europe/Paris',                    // Middle European Time
    'MEST': 'Europe/Paris',                   // Middle European Summer Time

    // Asia
    'JST': 'Asia/Tokyo',                      // Japan Standard Time
    'KST': 'Asia/Seoul',                      // Korea Standard Time
    'IST': 'Asia/Kolkata',                    // Indian Standard Time
    'AEST': 'Australia/Brisbane',             // Australian Eastern Standard Time
    'AWST': 'Australia/Perth',                // Australian Western Standard Time

    // Africa
    'CAT': 'Africa/Nairobi',                  // Central Africa Time
    'SAST': 'Africa/Johannesburg',            // South Africa Standard Time

    // Oceania
    'NZDT': 'Pacific/Auckland',               // New Zealand Daylight Time
    'NZST': 'Pacific/Auckland',               // New Zealand Standard Time

    // Pacific
    'PST': 'America/Los_Angeles',             // Pacific Standard Time (West Coast)
    'PDT': 'America/Los_Angeles',             // Pacific Daylight Time (West Coast)
    'GMT': 'Etc/GMT',                         // Greenwich Mean Time
    'UTC': 'Etc/UTC',                         // Coordinated Universal Time

    // Historical
    'GMT+1': 'Europe/Berlin',                 // Historical GMT offset
    'GMT+2': 'Europe/Athens',                 // Historical GMT offset
    'GMT+3': 'Europe/Moscow',                 // Historical GMT offset

};
