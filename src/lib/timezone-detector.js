// Détection timezone d'un destinataire à partir de son email/phone.
//
// Stratégie : on lit l'indicatif téléphone (prioritaire car beaucoup plus fiable)
// puis le TLD du domaine email. Si rien ne matche, on défaut sur Europe/Paris
// car Volia est positionné France/EU.
//
// Helpers utilisés par /api/admin/prospection/email-campaigns/[id]/send pour
// calculer scheduled_for quand campaign.smart_scheduling = true.
//
// Pas de dépendance externe (date-fns-tz) : on s'appuie sur Intl.DateTimeFormat
// natif (dispo Node ≥ 14 avec --icu, et 100% des envs Vercel/Next.js l'ont).

// Map TLDs/extensions → timezones par défaut. Les TLDs composés (.co.uk) doivent
// être listés AVANT les TLDs simples (.uk) car on prend le 1er match en testant
// du plus long au plus court.
const TLD_TIMEZONES = {
  '.fr': 'Europe/Paris',
  '.de': 'Europe/Berlin',
  '.es': 'Europe/Madrid',
  '.it': 'Europe/Rome',
  '.uk': 'Europe/London',
  '.co.uk': 'Europe/London',
  '.us': 'America/New_York',
  '.com': 'Europe/Paris', // par défaut FR (volia est positionné EU)
  '.io': 'Europe/Paris',
  '.be': 'Europe/Brussels',
  '.ch': 'Europe/Zurich',
  '.lu': 'Europe/Luxembourg',
  '.ca': 'America/Toronto',
};

// Map indicatifs téléphone → timezone. Ordre par longueur décroissante
// (sinon +1 capturerait +1242 etc.) — on s'en occupe via le tri à la volée.
const PHONE_TIMEZONES = {
  '+33': 'Europe/Paris',
  '+1': 'America/New_York',
  '+44': 'Europe/London',
  '+49': 'Europe/Berlin',
  '+34': 'Europe/Madrid',
  '+39': 'Europe/Rome',
  '+32': 'Europe/Brussels',
  '+41': 'Europe/Zurich',
};

const PHONE_PREFIXES_SORTED = Object.keys(PHONE_TIMEZONES).sort(
  (a, b) => b.length - a.length
);

const TLD_KEYS_SORTED = Object.keys(TLD_TIMEZONES).sort(
  (a, b) => b.length - a.length
);

export const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Détecte la timezone d'un destinataire à partir de son email ou téléphone.
 * @param {Object} input
 * @param {string|null} input.email
 * @param {string|null} input.phone
 * @returns {string} IANA timezone (ex: 'Europe/Paris')
 */
export function detectTimezone({ email, phone } = {}) {
  // 1) Priorité au téléphone si dispo : indicatif pays = signal fiable
  if (phone && typeof phone === 'string') {
    const cleaned = phone.replace(/[\s.\-()]/g, '');
    for (const prefix of PHONE_PREFIXES_SORTED) {
      if (cleaned.startsWith(prefix)) return PHONE_TIMEZONES[prefix];
    }
  }

  // 2) Fallback sur le TLD de l'email
  if (email && typeof email === 'string') {
    const at = email.lastIndexOf('@');
    if (at !== -1) {
      const domain = email.slice(at + 1).toLowerCase();
      // Pour matcher .co.uk vs .uk, on teste les suffixes du plus long au plus court
      for (const tld of TLD_KEYS_SORTED) {
        if (domain.endsWith(tld)) return TLD_TIMEZONES[tld];
      }
    }
  }

  return DEFAULT_TIMEZONE;
}

// ---------- getNextSendWindow ----------

const WINDOW_START_HOUR = 9; // 9h00
const WINDOW_END_HOUR = 17; // 17h00 (strict : on n'envoie plus à 17h00 pile)

/**
 * Renvoie les composants date (year/month/day/hour/min/sec/dayOfWeek) d'une
 * date UTC interprétée dans une timezone donnée. Utilise Intl.DateTimeFormat
 * pour rester sans dépendance.
 *
 * dayOfWeek: 0=dimanche, 1=lundi, ..., 6=samedi (compat Date.getDay())
 */
function getZonedParts(date, timezone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = parseInt(get('hour'), 10);
  // Intl renvoie parfois "24" à minuit en hour12=false — on normalise
  if (hour === 24) hour = 0;
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour,
    minute: parseInt(get('minute'), 10),
    second: parseInt(get('second'), 10),
    dayOfWeek: weekdayMap[get('weekday')],
  };
}

/**
 * Convertit un instant "YYYY-MM-DD HH:mm:ss dans la timezone donnée" en Date UTC.
 *
 * Algorithme : on crée d'abord une Date naïve UTC, on calcule l'offset que la
 * timezone aurait à ce moment-là, puis on corrige. Deux passes pour gérer les
 * transitions DST (l'offset peut différer entre l'instant naïf et l'instant ajusté).
 */
function zonedDateToUTC(year, month, day, hour, minute, timezone) {
  // 1ère approximation : on traite les composants comme s'ils étaient UTC
  const naiveUTC = Date.UTC(year, month - 1, day, hour, minute, 0);

  // On calcule l'offset que la TZ applique à cet instant
  const offset1 = getTimezoneOffsetMs(naiveUTC, timezone);
  let utcMs = naiveUTC - offset1;

  // 2ème passe pour corriger les éventuels DST shifts (1h max d'erreur)
  const offset2 = getTimezoneOffsetMs(utcMs, timezone);
  if (offset2 !== offset1) {
    utcMs = naiveUTC - offset2;
  }
  return new Date(utcMs);
}

/**
 * Renvoie en millisecondes l'offset (UTC + offset = heure locale) que la
 * timezone applique à un instant donné. Ex: Europe/Paris en été = +7200000ms.
 */
function getTimezoneOffsetMs(utcMs, timezone) {
  const date = new Date(utcMs);
  const parts = getZonedParts(date, timezone);
  // Heure que la TZ affiche à cet instant, recomposée en "UTC naïf"
  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUTC - utcMs;
}

/**
 * Calcule le prochain timestamp UTC où on peut envoyer pour cette timezone.
 *
 * Règles : fenêtre Lun-Ven, 9h-17h heure locale. Skip weekends.
 *   - Si on est dans la fenêtre maintenant → renvoie `fromDate` (envoi immédiat)
 *   - Si avant 9h un jour ouvré → 9h ce jour ouvré
 *   - Si après 17h OU weekend → 9h du prochain jour ouvré
 *
 * @param {string} timezone - IANA timezone (ex: 'Europe/Paris')
 * @param {Date} [fromDate] - point de référence (défaut: maintenant)
 * @returns {Date} timestamp UTC du prochain créneau d'envoi
 */
export function getNextSendWindow(timezone, fromDate = new Date()) {
  const tz = timezone || DEFAULT_TIMEZONE;
  const parts = getZonedParts(fromDate, tz);
  const { year, month, day, hour, minute, dayOfWeek } = parts;

  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isInWindow =
    isWeekday && hour >= WINDOW_START_HOUR && hour < WINDOW_END_HOUR;

  // Cas 1 : dans la fenêtre → envoi immédiat (on conserve le timestamp d'origine)
  if (isInWindow) return new Date(fromDate.getTime());

  // Cas 2 : avant 9h un jour ouvré → 9h aujourd'hui même
  if (isWeekday && hour < WINDOW_START_HOUR) {
    return zonedDateToUTC(year, month, day, WINDOW_START_HOUR, 0, tz);
  }

  // Cas 3 : après 17h OU weekend → 9h du prochain jour ouvré
  // On avance jour par jour en repartant de minuit local, jusqu'à tomber sur lundi-vendredi
  let cursorYear = year;
  let cursorMonth = month;
  let cursorDay = day;
  let cursorDow = dayOfWeek;

  // Avance d'au moins 1 jour, puis skip weekends
  for (let i = 0; i < 7; i++) {
    // Avance d'1 jour : recalcule via une vraie Date pour gérer fins de mois/année
    const next = zonedDateToUTC(
      cursorYear,
      cursorMonth,
      cursorDay + 1,
      WINDOW_START_HOUR,
      0,
      tz
    );
    const nextParts = getZonedParts(next, tz);
    cursorYear = nextParts.year;
    cursorMonth = nextParts.month;
    cursorDay = nextParts.day;
    cursorDow = nextParts.dayOfWeek;
    if (cursorDow >= 1 && cursorDow <= 5) {
      return next;
    }
  }

  // Safety net (ne devrait jamais arriver) : fallback dans 1h
  return new Date(fromDate.getTime() + 60 * 60 * 1000);
}
