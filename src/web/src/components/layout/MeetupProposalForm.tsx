import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
    IconCalendar,
    IconClock,
    IconMapPin,
    IconX,
    IconAlertCircle,
    IconCheck
} from "@tabler/icons-react";
import type { MeetupFormValues } from "../../types/meetup";
import type { AvailabilitySlot } from "../../types/timetable";
import { getMutualAvailability } from "../../services/timetableService";
import LocationPicker from "./LocationPicker";
import { useTimetableRealtime } from "../../hooks/useTimetableRealtime";
import { queryKeys } from "../../lib/queryKeys";
import { timetableErrorMessage } from "../../utils/timetableErrors";

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
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
        null,
    );
    const [slotTime, setSlotTime] = useState<string>("");
    const [date, setDate] = useState(todayISODate());
    const [time, setTime] = useState(currentTime);
    const [locationName, setLocationName] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        null,
    );
    const [nameEdited, setNameEdited] = useState(false);

    useTimetableRealtime(reservationId, buyerId, sellerId);

   /* type AvailabilityQueryResult = AvailabilityResponse | { status: 'load_error';
        code?: string 
    }*/
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

    const activeSlot = selectedSlot && availability?.status === "ok" && availability.slots.some((s) => s.date === selectedSlot.date && s.start === selectedSlot.start && s.end === selectedSlot.end,) ? selectedSlot : null;
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
            if (e.key == "Escape") {
                onCancel();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onCancel]);

    const effectiveDate = mode === "manual" ? date : (activeSlot?.date ?? "");
    const effectiveTime =
        mode === "manual" ? time : slotTime || activeSlot?.start || "";

    const hasValidCoords =
        coords != null &&
        Number.isFinite(coords.lat) &&
        Number.isFinite(coords.lng);
    const slotTimeInRange = mode === "manual" || !activeSlot || (slotTime >= activeSlot.start && slotTime <= activeSlot.end);
    const canSubmit =
        !!effectiveDate &&
        !!effectiveTime &&
        !!locationName.trim() &&
        hasValidCoords &&
        !isReservationUnavailable &&
        slotTimeInRange;

    const handleSubmit = () => {
        if (!canSubmit || !hasValidCoords || !coords) return;

        onSubmit({
            date: effectiveDate,
            time: effectiveTime,
            location: { name: locationName.trim(), lat: coords.lat, lng: coords.lng },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden">
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

                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    When
                </label>


                {mode === "suggested" ? (
                    <div className="mb-4">
                        {isLoadingAvailability && (
                            <div className="bg-gray-50 rounded-2xl p-4 text-center text-sm text-gray-400">
                                Finding times for when you're both free...
                            </div>
                        )}

                        {isAvailabilityError && isReservationUnavailable && (
                            <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-2">
                                <IconAlertCircle size={22} className="text-amber-500 mx-auto" />
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

                        {availability?.status === "ok" && (
                            <div className="space-y-2">
                                {availability.slots.map((slot) => {
                                    const isSelected =
                                        activeSlot?.date === slot.date &&
                                        activeSlot?.start === slot.start;
                                    return (
                                        <button
                                            key={`${slot.date}-${slot.start}`}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSlot(slot);
                                                setSlotTime(slot.start);
                                            }}
                                            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left border-l-4 transition ${isSelected
                                                ? "border-navy-700 border-l-navy-700 bg-navy-100"
                                                : "border-gray-200 border-l-navy-700 bg-white hover:-translate-y-0.5 hover:shadow-md"
                                                }`}
                                        >
                                            <IconClock size={18} className="text-gray-400 shrink-0" />
                                            <div className="flex-1">

                                                <p className="text-sm font-semibold text-navy-700">
                                                    {formatSlotDate(slot.date)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Free {slot.start}-{slot.end}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <IconCheck size={18} className="text-navy-700 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                                {activeSlot && (
                                    <div className="rounded-2xl border border-navy-700/20 bg-navy-50 p-3 mt-1">
                                        <label
                                            htmlFor="slot-time"
                                            className="block text-xs font-semibold text-gray-600 mb-1.5"
                                        >
                                            What time on {formatSlotDate(activeSlot.date)}?
                                        </label>
                                        <div className="relative">
                                            <IconClock
                                                size={16}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                id="slot-time"
                                                type="time"
                                                value={slotTime}
                                                min={activeSlot.start}
                                                max={activeSlot.end}
                                                onChange={(e) => setSlotTime(e.target.value)}
                                                className="w-full bg-white rounded-xl pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-700/20"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            You're both free {activeSlot.start}-{activeSlot.end}.
                                        </p>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setMode("manual")}
                                    className="w-full text-center text-sm font-semibold text-navy-700 underline py-1"
                                >
                                    None of these work — enter a time manually
                                </button>
                            </div>
                        )}

                        {availability?.status === "missing_timetable" && (
                            <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-3">
                                <IconAlertCircle size={22} className="text-amber-500 mx-auto" />
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
                                <IconAlertCircle size={22} className="text-amber-500 mx-auto" />
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
                        {availability?.status === "ok" && (
                            <button
                                type="button"
                                onClick={() => setMode("suggested")}
                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                            >
                                Use a suggested time instead
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
}
