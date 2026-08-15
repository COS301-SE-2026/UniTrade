import { useEffect, useState, useCallback } from 'react';
import {
    IconMapPin,
    IconCheck,
    IconX,
    IconAlertTriangle
} from '@tabler/icons-react';
import { listingsService } from '../services/listingsService';
import type { CheckInState } from '../types/meetup';

interface CheckInModalProps {
    meetupLocation: string;
    reservationId: string;
    onClose: () => void;
}
//pls work
export default function CheckInModal({ reservationId, meetupLocation, onClose }: CheckInModalProps) {
    const [state, setState] = useState<CheckInState>(() =>
        'geolocation' in navigator ? 'requesting' : 'unsupported'
    );
    const [errorMessage, setErrorMessage] = useState('');

    const mapResponse = (err: unknown): string => {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('check_in_window_closed')) {
            return 'The check-in window has closed. You can no longer check in for this meetup.';
        }
        if (msg.includes('already_checked_in')) {
            return "You've already checked in for this meetup.";
        }

        if (msg.includes('meetup_not_scheduled')) {
            return "The meetup isn't scheduled yet.";
        }
        if (msg.includes('meetup_not_found')) {
            return "We couldn't find this meetup.";
        }
        if (msg.includes('forbidden')) {
            return "You're not part of this meetup.";
        }
        return "Something went wrong while checking you in. Please try again.";
    }
    const checkLocation = useCallback(() => {

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await listingsService.checkInMeetup(
                        reservationId,
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    setState('success');
                } catch (err) {
                    setErrorMessage(mapResponse(err));
                    setState('error');
                }
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setState('denied');
                } else {
                    setErrorMessage(error.message || 'Something went wrong while finding your location');
                    setState('error');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [reservationId]);

    const requestLocation = () => {
        setState('requesting');
        setErrorMessage('');
        checkLocation();
    };

    useEffect(() => {
        if (state === 'unsupported') return;
        checkLocation();

    }, [checkLocation]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white rounded-3xl p-6 pb-8 shadow-xl text-center"
                onClick={(e) => e.stopPropagation()}
            >
                {state === 'requesting' && (
                    <>
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#003366]/10 flex items-center justify-center">
                            <IconMapPin size={26} className="text-[#003366] animate-pulse" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            Checking your location...
                        </h2>
                        <p className="text-sm text-gray-500">
                            Confirm the permission prompt from your browser.
                        </p>
                    </>
                )}

                {state === 'success' && (
                    <>
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                            <IconCheck size={26} className="text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">You're checked in!
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            You have successfully arrived at {meetupLocation}.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 bg-[#003366] text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-[#002244] transition-colors"
                        >
                            DONE
                        </button>
                    </>
                )}

                {state === 'denied' && (
                    <>
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                            <IconX size={26} className="text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            Location access denied
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            We need your location to confirm you have arrived. Enable location access for this in your browser settings, then try again.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold text-sm tracking-widest rounded-2xl hover:bg-gray-200 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                onClick={requestLocation}
                                className="flex-1 py-3 bg-[#003366] text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-[#002244] transition-colors"
                            >
                                TRY AGAIN
                            </button>
                        </div>
                    </>
                )}

                {(state === 'error' || state === 'unsupported') && (
                    <>
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                            <IconAlertTriangle size={26} className="text-amber-600" />

                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {state === 'unsupported' ? 'Location not supported' : "Could not get your location"}
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            {state === 'unsupported'
                                ? "Your browser does not support location access, try a different browser"
                                : errorMessage}
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold text-sm tracking-widest rounded-2xl hover:bg-gray-200 transition-colors"
                            >
                                CANCEL
                            </button>
                            {state !== 'unsupported' && (
                                <button
                                    type="button"
                                    onClick={requestLocation}
                                    className="flex-1 py-3 bg-[#003366] text-white font-bold text-sm tracking-widest rounded-2xl hover:bg-[#002244] transition-colors "
                                >
                                    TRY AGAIN
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}