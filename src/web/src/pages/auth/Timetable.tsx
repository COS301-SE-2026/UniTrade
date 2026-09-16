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
 
  
 
  const entriesByDay = DAY_ORDER.reduce((acc, d) => {
    acc[d] = entries
      .filter((x) => x.dayOfWeek === d)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    return acc;
  }, {} as Record<DayOfWeek, TimetableEntry[]>);
 
  if (isLoading) return <LoadingState message="Loading your timetable..." />;
 
  return (
<div className="max-w-2xl mx-auto p-4">soon</div>
  );
}