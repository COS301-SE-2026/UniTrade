import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { connectionManager } from '../../services/realtime/connectionManager';
import { getTransactionStatus } from '../../services/reservationService';

export default function PaymentComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservationId');
  const [view, setView] = useState<'loading' | 'waiting' | 'complete'>('loading');
  const role = searchParams.get('role') as 'buyer' | 'seller' | null;

  useEffect(() => {
    if (!reservationId) return;
    const goAndEnterPin = () => navigate('/payment/buyer-pin', { state: { reservationId } });


    connectionManager.connect().catch((e) => console.error('connect failed', e));

    const off = connectionManager.onPaymentCompleted((e) => {
      if (e.reservationId !== reservationId) return;
      goAndEnterPin();
    });

    getTransactionStatus(reservationId).then((result) => {
      if (!result.success) {
        setView('waiting');
        return;
      }
      if (result.data.pinStatus === 'confirmed') {
        setView('complete');
      }
      else if (result.data.transactionStatus === 'completed') {
        goAndEnterPin();
      }
      else setView('waiting');


    });



    return () => off();
  }, [reservationId, navigate]);

  const isSeller = role === 'seller';
  const buttonLabel = isSeller ? 'View your Sales' : 'View your Orders';
  const redirectPath = isSeller ? '/seller/sales' : '/buyer/orders';
  const doneState = "Transaction Complete!";
  const completionMessage = isSeller ? "The buyer has entered the PIN. The sale is complete. Thanks for using UniTrade." : "You've confirmed receipt. Thanks for using UniTrade."

  if (!reservationId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-slate-600">
          We couldn't find the details for this payment. Please check your reservations for the latest status.
        </p>
        <button
          type='button'
          onClick={() => navigate('/buyer/reservations')}
          className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2.5 px-5 rounded-xl"
        >
          Go to reservations
        </button>
      </div>
    );
  }
  if (view === 'complete') {
    return (
      <div className='min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-sans p-4 gap-8'>
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 text-emerald-500"><CheckCircle2 className='w-14 h-14' />

        </div>
        <div className='text-center space-y-2'>
          <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">{doneState}</h1>

          <p className="text-sm text-slate-500 font-medium">
            {completionMessage}
          </p>
        </div>
        <button type='button' onClick={() => navigate(redirectPath)} className='w-full max-w-xs py-4 bg-[#0d2a5c] hover:bg-[#081e42] active:scale-[0.99] text-white font-bold text-lg tracking-wide rounded-full shadow-md transition-all cursor-pointer'>{buttonLabel}</button>

      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-sans p-4 gap-8'>
      <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-blue-900 animate-spin" />
      <p className='text-sm text-slate-500 font-medium'>Waiting for payment confirmation from PayFast...</p>
    </div>
  );
}
