import { useEffect} from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { connectionManager } from '../../services/realtime/connectionManager';

export default function ConfirmPayment() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reservationId = searchParams.get('reservationId');

    useEffect(() => {
        if (!reservationId) return;

        connectionManager.connect().catch((e) => console.error('connect failed', e));

        const off = connectionManager.onPinGenerated((e) => {
            if (e.reservationId !== reservationId) return;
            navigate('/payment/generate-pin', { state: { pin: e.pin } });
        });

        return () => off();
    }, [reservationId, navigate]);

    if (!reservationId) {
        return <div className="p-8 text-center text-slate-500">No reservation specified.</div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
            <div className="bg-blue-900 text-white w-full shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <h1 className="font-semibold text-lg">Payment Status</h1>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-2xl border border-slate-200 shadow-xl p-10 space-y-8 text-center rounded-2xl">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-blue-900 animate-spin" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-800 text-lg">Confirming your payment...</h3>
                        <p className="text-slate-500 text-sm max-w-[240px] mx-auto">
                            Waiting for bank confirmation...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
