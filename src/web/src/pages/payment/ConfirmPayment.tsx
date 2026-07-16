import { useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import {Loader2, } from 'lucide-react';

export default function ConfirmPayment() {
  const navigate = useNavigate();

useEffect(() => {
const timer = setTimeout(() =>{
//navigate('/payment/buyer-pin');
}, 2500);
return() => clearTimeout(timer);
}, [navigate]);
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
    <div className="bg-blue-900 text-white w-full shadow-sm">
      <div className='max-w-6xl mx-auuto px-6 py-4'>
        <h1 className="font-semibold text-lg">Payment Status</h1>
    </div>
    </div>

    <div className="flex-1 flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-2xl border border-slate-200 shadow-xl p-10 space-y-8 text-center rounded-2xl">
    <div className="flex justify-center">
      <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-blue-900 animate-spin"/>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-lg"> Confirming your payment...</h3>
        <p className="text-slate-500 text-sm max-w-[240px]">
          Waiting for bank confirmation...
        </p>
    </div>
    </div>
    </div>
    <div className="p-5 bg-white border-t border-slate-200 text-center w-full">
      <button
      onClick={() => navigate('/payment/buyer-pin')}
      className='text-xs text-indigo-600 font-semibold hover: underline'>
        Skip to pin screen for now
      </button>
    </div></div>
  );
}