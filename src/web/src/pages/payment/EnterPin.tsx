import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router';
import { verifyPin } from '../../services/reservationService';

export default function EnterPin() {
    const navigate = useNavigate();
    const location = useLocation();
    const reservationId = (location.state as { reservationId?: string })?.reservationId;

    const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(59);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (timeLeft === 0) return;
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) {
            setPin(prev => [...prev]);
            return;
        }
        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        setError(null);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newPin = ['', '', '', '', '', ''];
        pasted.split('').forEach((char, i) => { newPin[i] = char; });
        setPin(newPin);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const clearPin = () => {
        setPin(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
    }
    /*const handleClear = () => {
        clearPin()
        setError(null);
        
    };*/

    const currentPinStr = pin.join('');
    const isComplete = pin.every(d => d !== '');

    const handleVerify = async () => {
        if (!isComplete || !reservationId) return;
        setIsVerifying(true);
        setError(null);
        const result = await verifyPin(reservationId, currentPinStr);
        setIsVerifying(false);
        if (result.success) {
            navigate(`/payment/payment-complete?reservationId=${reservationId}&role=buyer`);
        } else {
            const message =
                result.error.code === 'too_many_attempts'
                    ? 'Too many incorrect attempts. Please contact support.'
                    : 'Incorrect PIN. Please try again.';
            setError(message);
            clearPin();
        }
    };

    if (!reservationId) {
        return <div className="p-8 text-center text-slate-500">No reservation specified.</div>;
    }

    return (
        <div className="min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-sans p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-12 md:p-16 flex flex-col items-center space-y-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
                        PIN Verification
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Enter the PIN shown by the seller
                    </p>
                </div>
                {error && (
                    <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg text-center w-full max-w-xs">
                        {error}
                    </div>
                )}
                <div className="flex justify-center gap-3 md:gap-4">
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleChange(index, e.target.value)}
                            onKeyDown={e => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`w-12 h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all duration-150 ${digit
                                ? 'border-[#00aaff] text-slate-800 bg-white'
                                : 'border-[#00aaff]/60 text-slate-800 bg-white'
                                } focus:border-[#00aaff] focus:ring-2 focus:ring-[#00aaff]/20`}
                        />
                    ))}
                </div>
                <div className="text-center text-sm font-semibold text-slate-700">
                    Remaining Time: <span className="text-[#0d2a5c] font-extrabold">00:{String(timeLeft).padStart(2, '0')}s</span>
                </div>
                <button
                    type='button'
                    onClick={handleVerify}
                    disabled={!isComplete || isVerifying}
                    className={`w-full max-w-xs py-4 rounded-full text-white font-bold text-lg tracking-wide transition-all ${isComplete && !isVerifying
                        ? 'bg-[#0d2a5c] hover:bg-[#081e42] cursor-pointer active:scale-[0.99]'
                        : 'bg-[#0d2a5c]/50 cursor-not-allowed'
                        }`}
                >
                    {isVerifying ? 'Verifying...' : 'Verify PIN'}
                </button>
            </div>
        </div>
    );
}
