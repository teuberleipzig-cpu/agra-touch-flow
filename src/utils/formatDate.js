/**
 * formatDate.js
 *
 * Zentrale Datumsformatierung mit Locale-Unterstützung.
 * Verwendet moment.js mit dynamischer Locale-Setzung.
 *
 * Unterstützte Sprachen: de, en, ar, uk
 */

import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/ar';
import 'moment/locale/uk';
// 'en' ist moment-Standard, kein Import nötig

const MOMENT_LOCALE_MAP = {
  de: 'de',
  en: 'en',
  ar: 'ar',
  uk: 'uk',
};

/**
 * Formatiert ein Datum mit der richtigen Locale.
 * @param {string|Date} date
 * @param {string} format  - moment-Format-String
 * @param {string} language - Sprachcode (de/en/ar/uk)
 * @returns {string}
 */
export function formatDate(date, format, language = 'de') {
  const locale = MOMENT_LOCALE_MAP[language] || 'de';
  return moment(date).locale(locale).format(format);
}

/**
 * Formatiert ein Event-Datum (mit optionalem End-Datum).
 * @param {string} startDate
 * @param {string|null} endDate
 * @param {string} language
 * @returns {string}
 */
export function formatEventDate(startDate, endDate, language = 'de') {
  const locale = MOMENT_LOCALE_MAP[language] || 'de';
  const start  = moment(startDate).locale(locale);

  const formats = {
    de: { long: 'dddd, D. MMMM YYYY', short: 'D. MMMM YYYY' },
    en: { long: 'dddd, MMMM D, YYYY', short: 'MMMM D, YYYY' },
    ar: { long: 'dddd، D MMMM YYYY',  short: 'D MMMM YYYY' },
    uk: { long: 'dddd, D MMMM YYYY',  short: 'D MMMM YYYY' },
  };

  const fmt = formats[language] || formats.de;
  let result = start.format(fmt.long);

  if (endDate) {
    const end = moment(endDate).locale(locale);
    if (end.format('YYYYMMDD') !== start.format('YYYYMMDD')) {
      result += ` – ${end.format(fmt.short)}`;
    }
  }

  return result;
}
