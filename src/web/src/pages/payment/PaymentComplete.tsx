import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { connectionManager } from '../../services/realtime/connectionManager';
import { getTransactionStatus } from '../../services/reservationService';

export default function PaymentComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  const [pin, setPin] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!reservationId) return;

    getTransactionStatus(reservationId).then((result) => {
      if (result.success && result.data.transactionStatus === 'completed') {
        setIsConfirmed(true);
      }
    });

    connectionManager.connect().catch((e) => console.error('connect failed', e));

    const off = connectionManager.onPinGenerated((e) => {
      if (e.reservationId !== reservationId) return;
      setPin(e.pin);
      setIsConfirmed(true);
    });

    return () => off();
  }, [reservationId]);

  const handleGeneratePin = () => {
    if (!pin) return;
    navigate('/payment/generate-pin', { state: { pin } });
  };

  if (!reservationId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-slate-600">
          We couldn't find the details for this payment. Please check your reservations for the latest status.
        </p>
        <button
          onClick={() => navigate('/buyer/reservations')}
          className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2.5 px-5 rounded-xl"
        >
          Go to reservations
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-sans p-4 gap-8">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 text-emerald-500 animate-pulse">
          <CheckCircle2 className="w-14 h-14" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">
          Payment Complete!
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Funds have been released to the seller.
        </p>
      </div>

      {isConfirmed ? (
        pin ? (
          <button
            onClick={handleGeneratePin}
            className="w-full max-w-xs py-4 bg-[#0d2a5c] hover:bg-[#081e42] active:scale-[0.99] text-white font-bold text-lg tracking-wide rounded-full shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" /> Generate PIN
          </button>
        ) : (
          <p className="text-sm text-slate-500">Finalizing your transaction, one moment...</p>
        )
      ) : (
        <p className="text-sm text-slate-500">Waiting for payment confirmation from PayFast...</p>
      )}
    </div>
  );
}
