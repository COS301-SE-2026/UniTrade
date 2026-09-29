import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
    IconCalendar,
    IconClock,
    IconMapPin,
    IconX,
    IconAlertCircle,
    IconCheck,
} from "@tabler/icons-react";
import type { MeetupFormValues } from "../../types/meetup";
import {
    DAY_ORDER,
    DAY_SHORT,
    toMinutes,
    type AvailabilitySlot,
    type DayOfWeek,
} from "../../types/timetable";
import { getMutualAvailability } from "../../services/timetableService";
import LocationPicker from "./LocationPicker";
import { useTimetableRealtime } from "../../hooks/useTimetableRealtime";
import { queryKeys } from "../../lib/queryKeys";
import { timetableErrorMessage } from "../../utils/timetableErrors";
import { GRID_HEIGHT_PX, minutesToHeightPercent, minutesToHHMM, minutesToTopPercent, pixelToMinutes } from "../../utils/calendarGeometry";

const CHECKIN_CLOSE_MINUTES = 30;

interface MeetupProposalFormProps {
    reservationId: string;
    buyerId: string;
    sellerId: string;
    role?: "buyer" | "seller";
    onCancel: () => void;
    onSubmit: (values: MeetupFormValues) => void;
    isSubmitting?: boolean;
}

type ProposalMode = "suggested" | "manual";

function todayISODate(): string {
    return new Date().toISOString().split("T")[0];
}

function currentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function formatSlotDate(dateStr: string): string {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("en-ZA", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

interface GridDay {
    dayOfWeek: DayOfWeek;
    date: string;
    label: string;
}
export default function MeetupProposalForm({
    reservationId,
    buyerId,
    sellerId,
    role,
    onCancel,
    onSubmit,
    isSubmitting,
}: Readonly<MeetupProposalFormProps>) {
    const navigate = useNavigate();

    const [mode, setMode] = useState<ProposalMode>("suggested");
    const [pickedDate, setPickedDate] = useState<string>("");
    const [pickedMinutes, setPickedMinutes] = useState<number | null>(null);
    const [date, setDate] = useState(todayISODate());
    const [time, setTime] = useState(currentTime);
    const [locationName, setLocationName] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        null,
    );
    const [nameEdited, setNameEdited] = useState(false);

    const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useTimetableRealtime(reservationId, buyerId, sellerId);

    const {
        data: availability,
        isLoading: isLoadingAvailability,
        isError: isAvailabilityError,
        error: availabilityError,
    } = useQuery({
        queryKey: queryKeys.meetupAvailability(reservationId),
        queryFn: async () => {
            const result = await getMutualAvailability(reservationId);
            if (!result.success) {
                const err = new Error(
                    result.error.message ?? "Failed to load availability",
                ) as Error & {
                    code?: string;
                };
                err.code = result.error.code;
                throw err;
            }
            return result.data;
        },
        enabled: !!reservationId,
    });

    const isReservationUnavailable =
        availabilityError instanceof Error &&
        (availabilityError as Error & { code?: string }).code ===
        "reservation_not_found";

    const slots: AvailabilitySlot[] =
        availability?.status === "ok" ? availability.slots : [];

    const gridDays: GridDay[] = useMemo(() => {
        const dateByRow = new Map<DayOfWeek, string>();
        for (const slot of slots) {
            const existing = dateByRow.get(slot.dayOfWeek);
            if (!existing || slot.date < existing)
                dateByRow.set(slot.dayOfWeek, slot.date);
        }
        return DAY_ORDER.map((dow) => {
            const d = dateByRow.get(dow) ?? "";
            const label = d
                ? new Date(`${d}T00:00:00`).toLocaleDateString("en-ZA", {
                    weekday: "short",
                    day: "numeric",
                })
                : DAY_SHORT[dow];
            return { dayOfWeek: dow, date: d, label };
        });
    }, [slots]);

    const slotsByDate = useMemo(() => {
        const map = new Map<string, AvailabilitySlot[]>();
        for (const s of slots) {
            const arr = map.get(s.date) ?? [];
            arr.push(s);
            map.set(s.date, arr);
        }
        return map;
    }, [slots]);

    const activeSlot: AvailabilitySlot | null = useMemo(() => {
        if (!pickedDate || pickedMinutes == null) return null;
        const daySlots = slotsByDate.get(pickedDate) ?? [];
        return (
            daySlots.find(
                (s) =>
                    pickedMinutes >= toMinutes(s.start) &&
                    pickedMinutes <= toMinutes(s.end),
            ) ?? null
        );
    }, [pickedDate, pickedMinutes, slotsByDate]);

    useEffect(() => {
        if (!coords || nameEdited) {
            return;
        }
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
                    { signal: controller.signal, headers: { "Accept-Language": "en" } },
                );
                if (!res.ok) {
                    return;
                }
                const data = await res.json();

                if (data?.display_name) {
                    const short = data.display_name
                        .split(",")
                        .slice(0, 2)
                        .join(",")
                        .trim();
                    setLocationName(short);
                }
            } catch {
                //left on purpose
            }
        })();
        return () => controller.abort();
    }, [coords, nameEdited]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onCancel]);

    const handleColumnPointerDown = (
        day: GridDay,
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (!day.date) return;
        const el = columnRefs.current[day.date];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minutes = pixelToMinutes(offsetY, rect.height || GRID_HEIGHT_PX);

        const daySlots = slotsByDate.get(day.date) ?? [];
        const inFree = daySlots.some(
            (s) => minutes >= toMinutes(s.start) && minutes <= toMinutes(s.end),
        );
        if (!inFree) return;

        setPickedDate(day.date);
        setPickedMinutes(minutes);
    };

    const pickedTimeHHMM =
        pickedMinutes != null ? minutesToHHMM(pickedMinutes) : "";

    const effectiveDate = mode === "manual" ? date : pickedDate;
    const effectiveTime = mode === "manual" ? time : pickedTimeHHMM;

    const hasValidCoords =
        coords != null &&
        Number.isFinite(coords.lat) &&
        Number.isFinite(coords.lng);

    const timeInFreeWindow = mode === "manual" || activeSlot != null;

    const canSubmit =
        !!effectiveDate &&
        !!effectiveTime &&
        !!locationName.trim() &&
        hasValidCoords &&
        !isReservationUnavailable &&
        timeInFreeWindow;

    const checkinSpillsPastSlot = mode === "suggested" && activeSlot != null && pickedMinutes != null && pickedMinutes + CHECKIN_CLOSE_MINUTES > toMinutes(activeSlot.end);

    const checkinCloseLabel = pickedMinutes != null ? minutesToHHMM(pickedMinutes + CHECKIN_CLOSE_MINUTES) : "";


    const handleSubmit = () => {
        if (!canSubmit || !hasValidCoords || !coords) return;

        onSubmit({
            date: effectiveDate,
            time: effectiveTime,
            location: { name: locationName.trim(), lat: coords.lat, lng: coords.lng },
        });
    };

    const hourLabels = Array.from({ length: 13 }, (_, i) => i);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Propose a Meetup</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-400 p-1"
                        aria-label="Close"
                    >
                        <IconX size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 pt-4 pb-6">
                    <div className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        When
                    </div>

                    {mode === "suggested" ? (
                        <div className="mb-4">
                            {isLoadingAvailability && (
                                <div className="bg-gray-50 rounded-2xl p-4 text-center text-sm text-gray-400">
                                    Finding times for when you're both free...
                                </div>
                            )}

                            {isAvailabilityError && isReservationUnavailable && (
                                <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-2">
                                    <IconAlertCircle
                                        size={22}
                                        className="text-amber-500 mx-auto"
                                    />
                                    <p className="text-sm text-gray-500">
                                        {timetableErrorMessage("reservation_not_found")}
                                    </p>
                                </div>
                            )}
                            {isAvailabilityError && !isReservationUnavailable && (
                                <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-2">
                                    <p className="text-sm text-gray-500">
                                        Couldn't load suggested times.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setMode("manual")}
                                        className="text-sm font-semibold text-navy-700 underline"
                                    >
                                        Enter a time manually
                                    </button>
                                </div>
                            )}

                            {availability?.status === "ok" && slots.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">
                                        Tap a green block to pick a time you're both free.
                                    </p>
                                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                        <div className="min-w-[560px] p-2">
                                            <div className="grid grid-cols-[40px_repeat(7,1fr)] mb-1">
                                                <div />
                                                {gridDays.map((d) => (
                                                    <div
                                                        key={d.dayOfWeek}
                                                        className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center pb-1">
                                                        {d.label}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-[40px_repeat(7,1fr)]">
                                                <div
                                                    className="relative"
                                                    style={{ height: GRID_HEIGHT_PX }}
                                                >
                                                    {hourLabels.map((i) => (
                                                        <span
                                                            key={i}
                                                            className="absolute -translate-y-1/2 text-[9px] text-gray-300 tabular-nums"
                                                            style={{ top: `${(i / 12) * 100}%` }}
                                                        >
                                                            {String(8 + i).padStart(2, "0")}
                                                        </span>
                                                    ))}
                                                </div>

                                                {gridDays.map((day, dayIdx) => {
                                                    const daySlots = day.date ? (slotsByDate.get(day.date) ?? []) : [];
                                                    return (
                                                        <div
                                                            key={day.dayOfWeek}
                                                            ref={(el) => {
                                                                if (day.date) columnRefs.current[day.date] = el;
                                                            }}
                                                            onPointerDown={(e) =>
                                                                handleColumnPointerDown(day, e)
                                                            }
                                                            className={`relative ${dayIdx === 0 ? "" : "border-l border-gray-100"} ${daySlots.length > 0 ? "cursor-pointer" : ""}`}
                                                            style={{
                                                                height: GRID_HEIGHT_PX,
                                                                touchAction: "none",
                                                                backgroundImage:
                                                                    "repeating-linear-gradient(to bottom, transparent 0px, transparent 49px, #f1f5f9 50px)",
                                                            }}
                                                        >
                                                            {daySlots.map((s) => {
                                                                const startM = toMinutes(s.start);
                                                                const endM = toMinutes(s.end);
                                                                return (
                                                                    <div
                                                                        key={`${s.date}-${s.start}`}
                                                                        className="absolute left-0.5 right-0.5 rounded bg-emerald-100/70 border border-emerald-300 pointer-events-none"
                                                                        style={{
                                                                            top: `${minutesToTopPercent(startM)}%`,
                                                                            height: `${minutesToHeightPercent(endM - startM)}%`,
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                            {pickedDate === day.date &&
                                                                pickedMinutes != null && (
                                                                    <div
                                                                        className="absolute left-0 right-0 pointer-events-none z-10"
                                                                        style={{
                                                                            top: `${minutesToTopPercent(pickedMinutes)}%`,
                                                                        }}
                                                                    >
                                                                        <div className="h-0.5 bg-navy-700" />
                                                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-navy-700 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                            <IconCheck size={9} />
                                                                            {pickedTimeHHMM}
                                                                        </div>
                                                                    </div>

                                                                )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>


                                    {activeSlot && pickedMinutes != null && (
                                        <div className="rounded-2xl border border-navy-700/20 bg-navy-50 p-3">
                                            <p className="text-sm font-semibold text-navy-700">
                                                {formatSlotDate(pickedDate)} at {pickedTimeHHMM}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                You're both free {activeSlot.start}&ndash;{activeSlot.end}.
                                            </p>
                                            {checkinSpillsPastSlot && (
                                                <p className="text-[11px] text-amber-600 mt-1.5 flex items-start gap-1">
                                                    <IconAlertCircle
                                                        size={13}
                                                        className="shrink-0 mt-0.5"
                                                    />
                                                    <span>
                                                        Your check-in window would stay open until{" "}
                                                        {checkinCloseLabel}, past when you're both marked free. That's fine &mdash; it just leaves less slack if someone's running late.

                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setMode("manual")}
                                        className="w-full text-center text-sm font-semibold text-navy-700 underline py-1"
                                    >
                                        None of these work &mdash; enter a time manually
                                    </button>
                                </div>
                            )}

                            {availability?.status === "ok" && slots.length === 0 && (
                                <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-3">
                                    <IconAlertCircle
                                        size={22}
                                        className="text-amber-500 mx-auto" />
                                    <p className="text-sm text-gray-500">
                                        No common free time in the next 7 days.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setMode("manual")}
                                        className="text-sm font-semibold text-navy-700 underline"
                                    >
                                        Enter a time manually
                                    </button>
                                </div>
                            )}

                            {availability?.status === "missing_timetable" && (
                                <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-3">
                                    <IconAlertCircle
                                        size={22}
                                        className="text-amber-500 mx-auto"
                                    />
                                    <p className="text-sm text-gray-500">
                                        {availability.missingParty === role
                                            ? "You haven't set up your timetable yet, so we can't suggest mutual free times."
                                            : "The other person hasn't set up their timetable yet, so we can't suggest mutual free times."}
                                    </p>
                                    {availability.missingParty === role && (
                                        <button
                                            type="button"
                                            onClick={() => navigate("/auth/timetable")}
                                            className="block mx-auto text-sm font-semibold text-navy-700 underline"
                                        >
                                            Set up your timetable
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setMode("manual")}
                                        className="block mx-auto text-sm font-semibold text-gray-600 underline"
                                    >
                                        Enter a time manually
                                    </button>
                                </div>
                            )}

                            {availability?.status === "no_overlap" && (
                                <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-3">
                                    <IconAlertCircle
                                        size={22}
                                        className="text-amber-500 mx-auto"
                                    />
                                    <p className="text-sm text-gray-500">
                                        No common free time in the next 7 days.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setMode("manual")}
                                        className="text-sm font-semibold text-navy-700 underline"
                                    >
                                        Enter a time manually
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mb-4 space-y-4">
                            <div className="relative">
                                <IconCalendar
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    id="date"
                                    type="date"
                                    value={date}
                                    min={todayISODate()}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20"
                                />
                            </div>
                            <div className="relative">
                                <IconClock
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    id="time"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20"
                                />
                            </div>
                            {availability?.status === "ok" && slots.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setMode("suggested")}
                                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                                >
                                    Pick from the calendar instead
                                </button>
                            )}
                        </div>
                    )}

                    <label
                        htmlFor="location"
                        className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
                    >
                        Meetup Location
                    </label>
                    <div className="relative mb-2">
                        <IconMapPin
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            id="location"
                            type="text"
                            value={locationName}
                            onChange={(e) => {
                                setLocationName(e.target.value);
                                setNameEdited(true);
                            }}
                            placeholder="e.g. Merensky Library - Main Entrance"
                            className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/20"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mb-3 px-1">
                        Tap the map to drop a pin at the exact spot.
                    </p>
                    <div className="mb-6">
                        <LocationPicker
                            value={coords}
                            onChange={(newCoords) => {
                                setCoords(newCoords);
                                setNameEdited(false);
                            }}
                        />
                    </div>

                    <button
                        type="button"
                        disabled={!canSubmit || isSubmitting}
                        onClick={handleSubmit}
                        className="w-full py-3 bg-navy-700 text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-navy-600 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "SENDING..." : "SEND PROPOSAL"}
                    </button>
                </div>
            </div>
        </div>
    );
};

