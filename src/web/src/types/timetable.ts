export type DayOfWeek = 0 |1 |2 |3 |4 |5| 6;

export interface TimetableEntry{
  entryId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;

}

export interface NewTimetableEntry{
  
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;

}

export interface AvailabilitySlot{
  date: string;
   dayOfWeek: DayOfWeek;
  start: string;
  end: string;

}

export type AvailabilityResponse = 
| { status: 'ok'; slots: AvailabilitySlot[] }
| {status: 'missing_timetable';missingParty: 'buyer' | 'seller'}|
{status: 'no-overlap'; slots: []};


export const DAY_LABEL: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1:  'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  0: 'Sun',
  1:  'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export const DAY_ORDER: DayOfWeek[]= [1,2,3,4,5,6,0];

export const DAY_START_MINUTES =8 * 60;
export const DAY_END_MINUTES = 20 *60;

export function toMinutes(hhmm: string): number {
  const [h,m] = hhmm.split(':').map(Number);
  return h*60+m;
}

export function formatRange(start: string, end: string): string {
  return `${start}\u2013${end}`;
}