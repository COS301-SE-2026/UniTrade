import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
    IconCalendar,
    IconClock,
    IconMapPin,
    IconX,
    IconAlertCircle,
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
    const [date, setDate] = useState(todayISODate());
    const [time, setTime] = useState(currentTime);
    const [locationName, setLocationName] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        null,
    );
    const [nameEdited, setNameEdited] = useState(false);

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

    const effectiveDate = mode === "manual" ? date : (selectedSlot?.date ?? "");
    const effectiveTime = mode === "manual" ? time : (selectedSlot?.start ?? "");

    const hasValidCoords =
        coords != null &&
        Number.isFinite(coords.lat) &&
        Number.isFinite(coords.lng);
    const canSubmit =
        !!effectiveDate &&
        !!effectiveTime &&
        !!locationName.trim() &&
        hasValidCoords &&
        !isReservationUnavailable;

    const handleSubmit = () => {
        if (!canSubmit || !hasValidCoords || !coords) return;

        onSubmit({
            date: effectiveDate,
            time: effectiveTime,
            location: { name: locationName.trim(), lat: coords.lat, lng: coords.lng },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
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
                                    className="text-sm font-semibold text-[#003366] underline"
                                >
                                    Enter a time manually
                                </button>
                            </div>
                        )}

                        {availability?.status === "ok" && (
                            <div className="space-y-2">
                                {availability.slots.map((slot) => {
                                    const isSelected =
                                        selectedSlot?.date === slot.date &&
                                        selectedSlot?.start === slot.start;
                                    return (
                                        <button
                                            key={`${slot.date}-${slot.start}`}
                                            type="button"
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left border transition ${isSelected
                                                    ? "border-[#003366] bg-[#003366]/5"
                                                    : "border-transparent bg-gray-100 hover:bg-gray-200"
                                                }`}
                                        >
                                            <IconClock size={18} className="text-gray-400 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatSlotDate(slot.date)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {slot.start}\u2013{slot.end}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setMode("manual")}
                                    className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
                                >
                                    None of these work \u2014 enter a time manually
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
                                        className="block mx-auto text-sm font-semibold text-[#003366] underline"
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
                                    className="text-sm font-semibold text-[#003366] underline"
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
                                className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
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
                                className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
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
                        className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
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
                    className="w-full py-3 bg-[#003366] text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-[#002244] transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? "SENDING..." : "SEND PROPOSAL"}
                </button>
            </div>
        </div>
    );
}
