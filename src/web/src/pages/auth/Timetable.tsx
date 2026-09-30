import { useNavigate } from "react-router";
import React, { useRef, useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { LoadingState } from "../../components/layout/Spinner";
import { useToast } from "../../components/layout/useToast";
import {
  getMyTimetable,
  addTimetableEntry,
  deleteTimetableEntry,
} from "../../services/timetableService";
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
} from "../../types/timetable";
import { timetableErrorMessage } from "../../utils/timetableErrors";
import IcsImportModal from "../../components/layout/IcsImportModal";
import {
  clamp,
  GRID_HEIGHT_PX,
  minutesToHeightPercent,
  minutesToHHMM,
  minutesToTopPercent,
  pixelToMinutes,
  snapMinutes,
  SnapMinutes,
} from "../../utils/calendarGeometry";

const MIN_DRAG_MINUTES = SnapMinutes;

function validateEntry(
  day: DayOfWeek | null,
  start: string,
  end: string,
): string | null {
  if (day === null) return "Pick a day.";
  if (!start || !end) return "Pick a start and end time.";
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (e <= s) return "End time must be after start time.";
  if (s < DAY_START_MINUTES || e > DAY_END_MINUTES)
    return "Times must fall between 08:00 and 20:00.";
  return null;
}

interface DragState {
  day: DayOfWeek;
  anchorMinutes: number;
  currentMinutes: number;
}

export default function Timetable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [formDay, setFormDay] = useState<DayOfWeek>(1);
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const [drag, setDrag] = useState<DragState | null>(null);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["timetable"],
    queryFn: async () => {
      const result = await getMyTimetable();
      if (!result.success)
        throw new Error(result.error.message ?? "Failed to load timetable");
      return result.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: (entry: {
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
    }) => addTimetableEntry(entry),
    onSuccess: (result) => {
      if (!result.success) {
        showToast("error", timetableErrorMessage(result.error.code));
        return;
      }
      queryClient.setQueryData<TimetableEntry[]>(["timetable"], (prev = []) => [
        ...prev,
        result.data,
      ]);
    },
    onError: () => showToast("error", "Could not add that block."),
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteTimetableEntry(entryId),
    onMutate: async (entryId: string) => {
      const previous = queryClient.getQueryData<TimetableEntry[]>([
        "timetable",
      ]);
      queryClient.setQueryData<TimetableEntry[]>(["timetable"], (prev = []) =>
        prev.filter((e) => e.entryId !== entryId),
      );
      return { previous };
    },

    onSuccess: (result, _entryId, context) => {
      if (!result.success) {
        if (context?.previous)
          queryClient.setQueryData(["timetable"], context.previous);
        showToast("error", timetableErrorMessage(result.error.code));
      }
    },

    onError: (_err, _entryId, context) => {
      if (context?.previous)
        queryClient.setQueryData(["timetable"], context.previous);
      showToast("error", "Could not delete that block.");
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
    addMutation.mutate({
      dayOfWeek: formDay,
      startTime: formStart,
      endTime: formEnd,
    });
    setFormStart("");
    setFormEnd("");
  }

  const entriesByDay = DAY_ORDER.reduce(
    (acc, d) => {
      acc[d] = entries
        .filter((x) => x.dayOfWeek === d)
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      return acc;
    },
    {} as Record<DayOfWeek, TimetableEntry[]>,
  );

  const totalBlocks = entries.length;

  const minutesFromPointer = (day: DayOfWeek, clientY: number): number => {
    const el = columnRefs.current[day];
    if (!el) return DAY_START_MINUTES;
    const rect = el.getBoundingClientRect();
    return pixelToMinutes(clientY - rect.top, rect.height || GRID_HEIGHT_PX);
  };

  const clampAgainstBlocks = (
    day: DayOfWeek,
    startM: number,
    endM: number,
  ): { start: number; end: number } => {
    const blocks = entriesByDay[day].map((e) => ({
      s: toMinutes(e.startTime),
      e: toMinutes(e.endTime),
    }));
    let start = startM;
    let end = endM;
    for (const b of blocks) {
      if (b.e <= startM) continue;
      if (b.s >= endM) continue;
      if (b.s <= startM) start = Math.max(start, b.e);
      if (b.e >= endM) end = Math.min(end, b.s);
      if (b.s > startM && b.e < endM) end = Math.min(end, b.s);
    }
    return { start, end };
  };

  const handlePointerDown = (
    day: DayOfWeek,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    const el = columnRefs.current[day];
    if (el) el.setPointerCapture(e.pointerId);
    const m = minutesFromPointer(day, e.clientY);
    setDrag({ day, anchorMinutes: m, currentMinutes: m });
  };

  const handlePointerMove = (
    day: DayOfWeek,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!drag || drag.day !== day) return;
    setDrag((d) =>
      d ? { ...d, currentMinutes: minutesFromPointer(day, e.clientY) } : d,
    );
  };

  const handlePointerUp = (
    day: DayOfWeek,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    const el = columnRefs.current[day];
    if (el) el.releasePointerCapture?.(e.pointerId);
    if (!drag || drag.day !== day) {
      setDrag(null);
      return;
    }

    const rawStart = Math.min(drag.anchorMinutes, drag.currentMinutes);
    const rawEnd = Math.max(drag.anchorMinutes, drag.currentMinutes);
    setDrag(null);

    if (rawEnd - rawStart < MIN_DRAG_MINUTES) return;

    const startM = clamp(
      snapMinutes(rawStart),
      DAY_START_MINUTES,
      DAY_END_MINUTES,
    );
    const endM = clamp(snapMinutes(rawEnd), DAY_START_MINUTES, DAY_END_MINUTES);
    const { start, end } = clampAgainstBlocks(day, startM, endM);

    if (end - start < MIN_DRAG_MINUTES) {
      showToast("error", "That overlaps an existing block.");
      return;
    }

    addMutation.mutate({
      dayOfWeek: day,
      startTime: minutesToHHMM(start),
      endTime: minutesToHHMM(end),
    });
  };

  const preview =
    drag && Math.abs(drag.currentMinutes - drag.anchorMinutes) >= 1
      ? {
        day: drag.day,
        start: Math.min(drag.anchorMinutes, drag.currentMinutes),
        end: Math.max(drag.anchorMinutes, drag.currentMinutes),
      }
      : null;

  if (isLoading) return <LoadingState message="Loading your timetable..." />;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 pb-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-navy-700 transition-colors w-fit"
        aria-label="Back"
      >
        <ArrowLeft size={22} />
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
            Your Timetable
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Drag on the calendar to block out a busy time, or use the form.
            Buyers and sellers see when you're free to meet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-navy-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[48px_repeat(7,1fr)] mb-2">
              <div />
              {DAY_ORDER.map((d) => (
                <div
                  key={d}
                  className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-center pb-2"
                >
                  {DAY_SHORT[d]}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[48px_repeat(7,1fr)]">
              <div className="relative" style={{ height: GRID_HEIGHT_PX }}>
                {Array.from({ length: 13 }, (_, i) => (
                  <span
                    key={i}
                    className="absolute -translate-y-1/2 text-[10px] text-gray-300 tabular-nums"
                    style={{ top: `${(i / 12) * 100}%` }}
                  >
                    {String(8 + i).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
              {DAY_ORDER.map((d, dayIdx) => (
                <div
                  key={d}
                  ref={(el) => {
                    columnRefs.current[d] = el;
                  }}
                  onPointerDown={(e) => handlePointerDown(d, e)}
                  onPointerMove={(e) => handlePointerMove(d, e)}
                  onPointerUp={(e) => handlePointerUp(d, e)}
                  onPointerCancel={() => setDrag(null)}
                  className={`relative select-none ${dayIdx === 0 ? "" : "border-l border-gray-100"} ${entriesByDay[d].length === 0 ? "cursor-crosshair" : ""}`}
                  style={{
                    height: GRID_HEIGHT_PX,
                    touchAction: "none",
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, transparent 0px, transparent 49px, #f1f5f9 50px)",
                  }}
                >
                  {entries.length === 0 && d === DAY_ORDER[0] && (
                    <p className="absolute inset-0 flex items-center justify-center text-center text-xs text-gray-400 px-6 pointer-events-none">
                      Drag to add a busy time
                    </p>
                  )}

                  {entriesByDay[d].map((entry) => {
                    const s = toMinutes(entry.startTime);
                    const e = toMinutes(entry.endTime);
                    return (
                      <div
                        key={entry.entryId}
                        data-block
                        className="group absolute left-1 right-1 bg-navy-700 text-white rounded-md px-1.5 py-1 text-[10px] leading-tight overflow-hidden shadow-sm ring-1 ring-navy-800/20 hover:bg-navy-600 transition-colors"
                        style={{
                          top: `${minutesToTopPercent(s)}%`,
                          height: `${minutesToHeightPercent(e - s)}%`,
                        }}
                        title={`${DAY_LABEL[d]} ${formatRange(entry.startTime, entry.endTime)}`}
                      >
                        <span className="font-semibold tabular-nums">
                          {formatRange(entry.startTime, entry.endTime)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Delete ${DAY_LABEL[d]} ${formatRange(entry.startTime, entry.endTime)}`}
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={() => deleteMutation.mutate(entry.entryId)}
                          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition text-white/70 hover:text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  {preview && preview.day === d && (
                    <div
                      className="absolute left-1 right-1 rounded-md bg-navy-500/40 border border-navy-500 pointer-events-none z-10 flex items-start justify-center"
                      style={{
                        top: `${minutesToTopPercent(preview.start)}%`,
                        height: `${minutesToHeightPercent(preview.end - preview.start)}%`,
                      }}
                    >
                      <span className="text-[9px] font-semibold text-navy-800 bg-white/80 rounded px-1 mt-0.5 tabular-nums">
                        {minutesToHHMM(snapMinutes(preview.start))}&ndash;
                        {minutesToHHMM(snapMinutes(preview.end))}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Add a busy time
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide"
                  htmlFor="tt-day"
                >
                  Day
                </label>
                <select
                  id="tt-day"
                  value={formDay}
                  onChange={(e) =>
                    setFormDay(Number(e.target.value) as DayOfWeek)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
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
                  <label
                    className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide"
                    htmlFor="tt-start"
                  >
                    Start
                  </label>
                  <input
                    id="tt-start"
                    type="time"
                    value={formStart}
                    min="08:00"
                    max="20:00"
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide"
                    htmlFor="tt-end"
                  >
                    End
                  </label>
                  <input
                    id="tt-end"
                    type="time"
                    value={formEnd}
                    min="08:00"
                    max="20:00"
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="w-full bg-navy-700 hover:bg-navy-500 text-white font-semibold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add block
              </button>
              {formError && (
                <p className="text-xs text-error-600">{formError}</p>
              )}
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Your busy blocks
              </h2>
              {totalBlocks > 0 && (
                <span className="text-[11px] font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full">
                  {totalBlocks}
                </span>
              )}
            </div>
            {entries.length === 0 ? (
              <p className="text-xs text-gray-400">Nothing added yet.</p>
            ) : (
              DAY_ORDER.filter((d) => entriesByDay[d].length > 0).map((d) => (
                <div key={d} className="mb-3 last:mb-0">
                  <h3 className="text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                    {DAY_LABEL[d]}
                  </h3>
                  <div className="space-y-1.5">
                    {entriesByDay[d].map((entry) => (
                      <div
                        key={entry.entryId}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 group"
                      >
                        <span className="text-sm text-gray-800 tabular-nums">
                          {formatRange(entry.startTime, entry.endTime)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(entry.entryId)}
                          className="text-gray-300 group-hover:text-error-600 transition-colors p-1"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {showImport && <IcsImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
