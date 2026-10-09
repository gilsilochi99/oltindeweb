import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { addDaysIso, isoDate, type BusyRange } from '../../lib/rentals';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MAX_MONTHS_AHEAD = 18;

export type DaySelection = { from?: string; to?: string }; // inclusive YYYY-MM-DD

// Month grid with taken days disabled. mode "range": first tap sets the
// start, second tap the end (inclusive); "single": one day.
export function BookingCalendar({
  busy,
  today,
  mode,
  value,
  onChange,
}: {
  busy: BusyRange[];
  today: string;
  mode: 'range' | 'single';
  value: DaySelection;
  onChange: (value: DaySelection) => void;
}) {
  const [month, setMonth] = useState(() => (value.from ?? today).slice(0, 7)); // YYYY-MM

  // A day is taken when it falls inside a busy [start, end) range.
  const isTaken = useMemo(() => {
    return (day: string) => day < today || busy.some((b) => day >= b.start && day < b.end);
  }, [busy, today]);

  const [year, monthNum] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNum - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7; // Monday first
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoDate(new Date(Date.UTC(year, monthNum - 1, i + 1)))),
  ];
  while (cells.length % 7) cells.push(null);

  const monthLabel = first.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const minMonth = today.slice(0, 7);
  const maxMonth = addMonths(minMonth, MAX_MONTHS_AHEAD);

  const onDay = (day: string) => {
    if (mode === 'single') return onChange({ from: day, to: day });
    const { from, to } = value;
    if (!from || (from && to && to !== from) || day < from) return onChange({ from: day, to: undefined });
    // Second tap: the range can't jump over taken days.
    for (let d = from; d <= day; d = addDaysIso(d, 1)) {
      if (isTaken(d)) return onChange({ from: day, to: undefined });
    }
    onChange({ from, to: day });
  };

  const inSelection = (day: string) => {
    const { from, to } = value;
    if (!from) return false;
    return day >= from && day <= (to ?? from);
  };

  return (
    <View className="gap-2 rounded-lg border border-border bg-card p-3">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => setMonth(addMonths(month, -1))} disabled={month <= minMonth} hitSlop={8} className={month <= minMonth ? 'opacity-30' : ''}>
          <ChevronLeft size={22} color="#1A1C1C" />
        </Pressable>
        <Text className="text-base font-semibold capitalize text-foreground">{monthLabel}</Text>
        <Pressable onPress={() => setMonth(addMonths(month, 1))} disabled={month >= maxMonth} hitSlop={8} className={month >= maxMonth ? 'opacity-30' : ''}>
          <ChevronRight size={22} color="#1A1C1C" />
        </Pressable>
      </View>
      <View className="flex-row">
        {WEEKDAYS.map((d) => (
          <Text key={d} className="flex-1 text-center text-xs font-semibold text-muted-foreground">{d}</Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} className="flex-row">
          {cells.slice(row * 7, row * 7 + 7).map((day, i) => {
            if (!day) return <View key={i} className="flex-1" style={{ aspectRatio: 1 }} />;
            const taken = isTaken(day);
            const selected = inSelection(day);
            const edge = day === value.from || day === value.to;
            return (
              <Pressable key={day} disabled={taken} onPress={() => onDay(day)} className="flex-1 p-0.5" style={{ aspectRatio: 1 }}>
                <View
                  className={`flex-1 items-center justify-center rounded-lg ${edge ? 'bg-foreground' : selected ? 'bg-primary/60' : ''}`}
                >
                  <Text
                    className={`text-sm ${edge ? 'font-semibold text-background' : taken ? 'text-muted-foreground/40 line-through' : 'text-foreground'}`}
                  >
                    {Number(day.slice(8))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text className="text-xs text-muted-foreground">Los días tachados no están disponibles.</Text>
    </View>
  );
}

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
