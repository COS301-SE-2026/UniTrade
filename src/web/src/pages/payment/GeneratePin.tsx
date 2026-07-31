import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { connectionManager } from '../../services/realtime/connectionManager';
import { getPendingPin } from '../../services/reservationService';

export default function GeneratePin() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state as { pin?: string; reservationId?: string }) ?? {};
    const reservationId = state.reservationId;

    const [pin, setPin] = useState<string>(state.pin ?? '');
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        connectionManager.connect().catch((e) => console.error('connect failed', e));

        if (!state.pin && reservationId) {
            getPendingPin(reservationId).then((result) => {
                if (result.success) {
                    setPin(result.data.pin);
                }
                else if (result.error?.code === 'pin_not_pending') {
                    setConfirmed(true);
                }
            });
        }

        if (!reservationId) {
            return;
        }
        const off = connectionManager.onPinConfirmed((e) => {
            if (e.reservationId !== reservationId) return;
            setConfirmed(true);
        });
        return () => off();
    }, [reservationId, state.pin]);
    useEffect(() => {
        if (confirmed && reservationId) {
            navigate(`/payment/payment-complete?reservationId=${reservationId}&role=seller`, { replace: true });

        }
    }, [confirmed, reservationId, navigate]);

    if (!pin && !confirmed) {
        return (
            <div className='min-h-screen flex items-center justify-center text-slate-500'>
                No PIN available. Make sure the buyer has completed payment.
            </div>
        );

    }

    if (!pin) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500">
                No PIN available. Make sure the buyer has completed payment.
            </div>
        );
    }
    const pinDigits = pin.padEnd(6, ' ').split('');

    return (
        <div className="min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-sans p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-12 md:p-16 flex flex-col items-center space-y-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
                        Transaction PIN
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Show this PIN to the buyer. They enter it to complete the sale.
                    </p>
                </div>

                <div className="flex justify-center gap-3 md:gap-4">
                    {pinDigits.map((digit, index) => (
                        <div
                            key={index}
                            className="w-12 h-16 flex items-center justify-center text-center text-2xl font-bold rounded-2xl border-2 border-[#00aaff]/60 transition-all duration-150"
                        >
                            {digit.trim()}
                        </div>
                    ))}
                </div>
                <p className='text-center text-sm text-slate-500 max-w-xs'>Waiting for the buyer to enter this PIN...</p>
            </div>
        </div>
    );
}


