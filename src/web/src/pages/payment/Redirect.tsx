import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';

export default function Redirect() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/payment/confirming');
        }, 2500);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
            <div className="bg-blue-900 text-white w-full shadow-sm">
                <div className='max-w-6xl mx-auto px-6 py-4 flex items-center gap-2'>
                    <div className="w-6 h-6 bg-white text-blue-900 rounded-full font-black text-xs flex items-center justify-center">PF
                    </div>
                    <h1 className="font-semibold text-lg">Payfast Payment</h1>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl p-10 space-y-6 text-center">
                    <div className="flex justify-center">
                        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
                    </div><div className="space-y-2">

                        <h3 className="font-bold text-lg text-slate-800">Redirecting to Payfast...</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                            Securely connecting to Payfast for instant EFT. Please wait.</p>
                    </div>
                </div>
            </div>

            <div className="p-5 bg-white border-t border-slate-200 text-center">
                <button
                    type='button'
                    onClick={() => navigate('/payment/confirming')}
                    className="text-xs text-indigo-600 font-medium hover:underline">
                    Skip Redirect
                </button>
            </div>
        </div>
    );
}