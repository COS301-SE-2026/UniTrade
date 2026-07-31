import { useState, useEffect } from 'react';
import { IconCalendar, IconClock, IconMapPin, IconX } from '@tabler/icons-react';
import type { MeetupFormValues } from '../../types/meetup';
import LocationPicker from './LocationPicker';

interface MeetupProposalFormProps {
    onCancel: () => void;
    onSubmit: (values: MeetupFormValues) => void;
    isSubmitting?: boolean;
}


function todayISODate(): string {
    return new Date().toISOString().split('T')[0];
}

function currentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export default function MeetupProposalForm({ onCancel, onSubmit, isSubmitting }: MeetupProposalFormProps) {
    const [date, setDate] = useState(todayISODate());
    const [time, setTime] = useState(currentTime);
    const [locationName, setLocationName] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [nameEdited, setNameEdited] = useState(false);

    useEffect(() => {
        if (!coords || nameEdited) {
            return;
        }
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`, { signal: controller.signal, headers: { 'Accept-Language': 'en' } },
                );
                if (!res.ok) {
                    return;
                }
                const data = await res.json();

                if (data?.display_name) {
                    const short = data.display_name.split(',').slice(0, 2).join(',').trim();
                    setLocationName(short);
                }
            }
            catch {
               // 
            }
        })();
        return () => controller.abort();
    }, [coords, nameEdited]);


    const canSubmit = !!date && !!time && !!locationName.trim() && coords !== null;

    const handleSubmit = () => {
        if (!canSubmit || !coords) return;

        onSubmit({
            date, time, location: { name: locationName.trim(), lat: coords.lat, lng: coords.lng },
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-6 shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                        Propose a Meetup
                    </h2>
                    <button type="button" onClick={onCancel} className="text-gray-400 p-1" aria-label="Close">
                        <IconX size={20} />
                    </button>
                </div>

                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Date
                </label>
                <div className="relative mb-4">
                    <IconCalendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="date"
                        value={date}
                        min={todayISODate()}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                    />
                </div>

                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Time
                </label>
                <div className="relative mb-4">
                    <IconClock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                    />
                </div>

                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Meetup Location
                </label>
                <div className="relative mb-2">
                    <IconMapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={locationName}
                        onChange={(e) => { setLocationName(e.target.value); setNameEdited(true); }}
                        placeholder="e.g. Merensky Library - Main Entrance"
                        className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                    />
                </div>
                <p className="text-xs text-gray-400 mb-3 px-1">
                    Tap the map to drop a pin at the exact spot.
                </p>
                <div className="mb-6">
                    <LocationPicker value={coords} onChange={(newCoords) => {
                        setCoords(newCoords);
                        setNameEdited(false);
                    }} />
                </div>

                <button
                    type="button"
                    disabled={!canSubmit || isSubmitting}
                    onClick={handleSubmit}
                    className="w-full py-3 bg-[#003366] text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-[#002244] transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'SENDING...' : 'SEND PROPOSAL'}
                </button>
            </div>
        </div>
    );
}
