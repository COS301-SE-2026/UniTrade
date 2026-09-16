import { useNavigate } from 'react-router';
import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { LoadingState } from '../../components/layout/Spinner';
import { useToast } from '../../components/layout/useToast';
import { getMyTimetable, addTimetableEntry, deleteTimetableEntry } from '../../services/timetableService';
import {
  DAY_LABEL,
  DAY_SHORT,
  DAY_ORDER,
  DAY_START_MINUTES,
  DAY_END_MINUTES,
  toMinutes,
  formatRange,
  type DayOfWeek,
  type TimetableEntry,
} from '../../types/timetable';
 
function validateEntry(day: DayOfWeek | null, start: string, end: string): string | null {
  if (day === null) return 'Pick a day.';
  if (!start || !end) return 'Pick a start and end time.';
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (e <= s) return 'End time must be after start time.';
  if (s < DAY_START_MINUTES || e > DAY_END_MINUTES) return 'Times must fall between 08:00 and 20:00.';
  return null;
}
 
export default function Timetable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
 
  const [formDay, setFormDay] = useState<DayOfWeek>(1);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
 
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['timetable'],
    queryFn: async () => {
      const result = await getMyTimetable();
      if (!result.success) throw new Error(result.error.message ?? 'Failed to load timetable');
      return result.data;
    },
  });
 const addMutation = useMutation({
    mutationFn: (entry: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }) =>
      addTimetableEntry(entry),
    onSuccess: (result) => {
      if (!result.success) {
        showToast('error', result.error.message ?? 'Could not add that block.');
        return;
      }
      queryClient.setQueryData<TimetableEntry[]>(['timetable'], (prev = []) => [...prev, result.data]);
    },
    onError: () => showToast('error', 'Could not add that block.'),
  });
 
  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteTimetableEntry(entryId),
    onMutate: async (entryId: string) => {
      const previous = queryClient.getQueryData<TimetableEntry[]>(['timetable']);
      queryClient.setQueryData<TimetableEntry[]>(['timetable'], (prev = []) =>
        prev.filter((e) => e.entryId !== entryId)
      );
      return { previous };
    },
    onError: (_err, _entryId, context) => {
      if (context?.previous) queryClient.setQueryData(['timetable'], context.previous);
      showToast('error', 'Could not delete that block.');
    },
  });
 
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validateEntry(formDay, formStart, formEnd);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    addMutation.mutate({ dayOfWeek: formDay, startTime: formStart, endTime: formEnd });
    setFormStart('');
    setFormEnd('');
  }
  
 
  const entriesByDay = DAY_ORDER.reduce((acc, d) => {
    acc[d] = entries
      .filter((x) => x.dayOfWeek === d)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    return acc;
  }, {} as Record<DayOfWeek, TimetableEntry[]>);
 
  if (isLoading) return <LoadingState message="Loading your timetable..." />;
 
  return (
  <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="bg-navy-800 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl text-white font-bold">Your Timetable</h1>
            <p className="text-xs text-white/80">
              Add your class times so buyers and sellers can see when you're free to meet.
            </p>
          </div>
        </div>
      </div>
 
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[56px_repeat(7,1fr)] mb-1">
              <div />
              {DAY_ORDER.map((d) => (
                <div
                  key={d}
                  className="text-xs font-semibold text-slate-400 text-center pb-2 border-b border-slate-200"
                >
                  {DAY_SHORT[d]}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[56px_repeat(7,1fr)]">
              <div className="relative h-[600px]">
                {Array.from({ length: 12 }, (_, i) => (
                  <span
                    key={i}
                    className="absolute -translate-y-1/2 text-[10px] text-slate-400"
                    style={{ top: `${(i / 12) * 100}%` }}
                  >
                    {String(8 + i).padStart(2, '0')}:00
                  </span>
                ))}
              </div>
              {DAY_ORDER.map((d) => (
                <div
                  key={d}
                  className="relative h-[600px] border-l border-slate-100"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, transparent 0px, transparent 49px, #f9fafb 50px)',
                  }}
                >
                  {entries.length === 0 && d === DAY_ORDER[0] && (
                    <p className="absolute inset-0 flex items-center justify-center text-center text-xs text-slate-400 px-6">
                      No busy times yet
                    </p>
                  )}
                  {entriesByDay[d].map((entry) => {
                    const s = toMinutes(entry.startTime);
                    const e = toMinutes(entry.endTime);
                    const top = ((s - DAY_START_MINUTES) / (DAY_END_MINUTES - DAY_START_MINUTES)) * 100;
                    const height = ((e-s) /(DAY_END_MINUTES - DAY_START_MINUTES)) * 100;
                    return (
                      <div
                        key={entry.entryId}
                        className="group absolute left-0.5 right-0.5 bg-blue-950 text-white rounded-lg px-1.5 py-1 text-[10px] leading-tight overflow-hidden"
                        style={{ top: `${top}%`, height: `${height}%` }}
                        title={`${DAY_LABEL[d]} ${formatRange(entry.startTime, entry.endTime)}`}
                      >
                        {formatRange(entry.startTime, entry.endTime)}
                        <button
                          type="button"
                          aria-label={`Delete ${DAY_LABEL[d]} ${formatRange(entry.startTime, entry.endTime)}`}
                          onClick={() => deleteMutation.mutate(entry.entryId)}
                          className="absolute top-0 right-0.5 opacity-0 group-hover:opacity-100 transition text-white/80 hover:text-white"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
 
 
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Add a busy time</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="tt-day">
                  Day
                </label>
                <select
                  id="tt-day"
                  value={formDay}
                  onChange={(e) => setFormDay(Number(e.target.value) as DayOfWeek)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DAY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABEL[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="tt-start">
                    Start
                  </label>
                  <input
                    id="tt-start"
                    type="time"
                    value={formStart}
                    min="08:00"
                    max="20:00"
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="tt-end">
                    End
                  </label>
                  <input
                    id="tt-end"
                    type="time"
                    value={formEnd}
                    min="08:00"
                    max="20:00"
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="w-full bg-blue-950 hover:bg-blue-900 disabled:bg-gray-300 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Add block
              </button>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
            </form>
          </div>
 
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Your busy blocks</h2>
            {entries.length === 0 ? (
              <p className="text-xs text-slate-400">Nothing added yet.</p>
            ) : (
              DAY_ORDER.filter((d) => entriesByDay[d].length > 0).map((d) => (
                <div key={d} className="mb-3 last:mb-0">
                  <h3 className="text-[11px] font-semibold text-slate-400 mb-1">{DAY_LABEL[d]}</h3>
                  {entriesByDay[d].map((entry) => (
                    <div
                      key={entry.entryId}
                      className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-sm text-slate-700">{formatRange(entry.startTime, entry.endTime)}</span>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(entry.entryId)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

           </div>
    </div>
  );
}