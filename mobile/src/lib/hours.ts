import type { Branch } from './types';

// Mirrors web's src/components/shared/OpeningStatusBadge.tsx checkIsOpen()
// — same day/hours parsing — with one deliberate fix: the day-name map keys
// are accent-stripped too. Web's aren't (it strips accents from the
// *input* day string but looks it up in a map whose keys still have
// accents), so "Miércoles"/"Sábado" schedules never match there — a latent
// bug, not something worth reproducing.
const DAY_MAPPING: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function isBranchOpenNow(
  workingHours: Branch['workingHours'] | undefined,
  now: Date = new Date(),
): boolean | null {
  if (!workingHours || workingHours.length === 0) return null;

  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (const schedule of workingHours) {
    const dayString = stripAccents(schedule.day.toLowerCase().trim());
    const hourString = schedule.hours.toLowerCase().trim();

    if (hourString === 'cerrado') continue;

    const [startStr, endStr] = hourString.split('-').map((s) => s.trim());
    if (!startStr || !endStr) continue;

    const startTotalMinutes = parseTimeToMinutes(startStr);
    const endTotalMinutes = parseTimeToMinutes(endStr);

    if (dayString.includes('-')) {
      const [startDayStr, endDayStr] = dayString.split('-').map((s) => s.trim());
      const startDay = DAY_MAPPING[startDayStr];
      const endDay = DAY_MAPPING[endDayStr];
      if (startDay === undefined || endDay === undefined) continue;
      if (currentDay >= startDay && currentDay <= endDay) {
        if (currentTime >= startTotalMinutes && currentTime < endTotalMinutes) return true;
      }
    } else {
      const scheduleDay = DAY_MAPPING[dayString];
      if (scheduleDay === undefined) continue;
      if (currentDay === scheduleDay) {
        if (currentTime >= startTotalMinutes && currentTime < endTotalMinutes) return true;
      }
    }
  }

  return false;
}
