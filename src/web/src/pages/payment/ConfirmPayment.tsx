import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { connectionManager } from "../../services/realtime/connectionManager";
import { getTransactionStatus } from "../../services/reservationService";

export default function ConfirmPayment() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reservationId = searchParams.get("reservationId");

    useEffect(() => {
        if (!reservationId) return;
        const goEnterPin = () =>
            navigate("/payment/buyer-pin", { state: { reservationId } });
        connectionManager
            .connect()
            .catch((e) => console.error("connect failed", e));

        const off = connectionManager.onPaymentCompleted((e) => {
            if (e.reservationId !== reservationId) return;
            goEnterPin();
        });
        getTransactionStatus(reservationId).then((result) => {
            if (result.success && result.data.transactionStatus === 'completed') {
                goEnterPin();
            }
        })

        return () => off();
    }, [reservationId, navigate]);

    if (!reservationId) {
        return (
            <div className="p-8 text-center text-gray-500">
                No reservation specified.
            </div>
        );
    }

    return (
        <div className="bg-gray-50 h-dvh overflow-hidden flex flex-col justify-between">
            <div className="bg-navy-800 text-white w-full shadow-xs">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <h1 className="font-semibold text-lg">Payment Status</h1>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-2xl border border-gray-200 shadow-xl p-10 space-y-8 text-center rounded-2xl">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-navy-700 animate-spin" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-800 text-lg">
                            Confirming your payment...
                        </h3>
                        <p className="text-gray-500 text-sm max-w-[240px] mx-auto">
                            Waiting for bank confirmation...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
