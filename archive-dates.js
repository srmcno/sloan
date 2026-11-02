/* Dates in this archive include estimates and historical calendar notation. */
const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const EXACT_DATE = new RegExp(`^(?:\\d{4}|\\d{4}-\\d{2}-\\d{2}|(?:\\d{1,2}\\s+)?${MONTH},?\\s+\\d{4}|${MONTH}\\s+\\d{1,2},?\\s+\\d{4})$`, 'i');

export function dateSummary(value) {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  // Unknown descriptions and markup are not dates. Callers still escape display text.
  if (/[<>]/.test(text) || !/\b\d{4}\b/.test(text)) return '';
  // Only known, unqualified date formats can safely be shortened to a year.
  return EXACT_DATE.test(text) ? text.match(/\d{4}/)[0] : text;
}

export function personYears(person) {
  if (person.label) return person.label;
  if (person.lv) return 'Living';
  const birth = dateSummary(person.b), death = dateSummary(person.d);
  if (birth && death) {
    return /^\d{4}$/.test(birth) && /^\d{4}$/.test(death)
      ? `${birth}–${death}`
      : `Born ${birth}; died ${death}`;
  }
  return birth ? `Born ${birth}` : death ? `Died ${death}` : 'Dates not recorded';
}
