import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom'


export default function EnterPin()
{
  const navigate = useNavigate();
  const [pin, setPin] = useState<string[]>(['','','','','','']);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft,setTimeLeft] = useState(59);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null> (null);

  const targetPin = "813472";
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {if 
    (timeLeft ===0)return;
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft]);

  
  const handleChange = (index: number, value: string) => {
    if(!/^\d*$/.test(value)) return;

    const newPin=[...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(null);

    if(value && index < 5){
      inputRefs.current[index+1]?.focus();
    }
  };

   const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newPin = ['', '', '', '', '', '']
    pasted.split('').forEach((char, i) => { newPin[i] = char })
    setPin(newPin)
    setError(null)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  };

  const handleClear =() =>
  {
    setPin(['','','','','','']);
    setError(null);
    inputRefs.current[0]?.focus();

  };

   const currentPinStr = pin.join('');
  const isComplete = pin.every(d => d != '');
  //const isCorrect = currentPinStr === targetPin;

  const handleVerify = () => {
    if(!isComplete) return;
    if (currentPinStr === targetPin){
      navigate('/payment/payment-complete');
    }
    else{
setError("Incorrect Pin.Please try again.");
handleClear();
    }
  };

return (

 <div className="min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-samns p-4">
  <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-12 md:p-16 flex flex-col items-center space-y-10">
  <div className="text-center space-y-2">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
        PIN Verification
      </h1>
      <p className="text-sm text-slate-500 font-medium">
        Please enter the pin given  by the buyer
      </p>
  </div>
  {error && (
    <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg text-center w-full max-w-xs">
      {error}
      </div>
  )}

  {paymentStatus && (
    <div className="text-sm text-[#0d2ac5c] font-semibold bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg text-center w-full max-w-xs flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-[#0d2a5c] border-t-transparent rounded-full animate-spin" />
      {paymentStatus}
      </div>
  )

  }
  <div className="flex justify-center gap-3 md:gap-4">
    {pin.map((digit, index) => (
<input 
key={index}
ref={el => { inputRefs.current[index] = el; }}
type="text"
inputMode="numeric"
maxLength={1}
value={digit}
disabled={isSubmitting}
onChange={e =>handleChange(index, e.target.value)}
onKeyDown={e => handleKeyDown(index, e)}
onPaste={handlePaste}
className={`w-12 h-12 md:h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-non transition-all duration-150 ${
  digit
  ? 'border-[#00aaff] text-slate-800 bg-white'
  : 'border-[#00aaff]/60 text-slate-800 bg-white'} focus:border[#00aaff] focus:ring-2 focus:ring-[#00aaff]/20`} />

    ))}
  </div>
<div className="text-center text-sm font-semifont text-slate-700">
  Remaining Time: <span className="text-[#0d2a5c] font-extrabold">00:{String(timeLeft).padStart(2, '0')}s</span>
</div>
<button 
onClick={handleVerify}
disabled={!isComplete || isSubmitting}
className={`w-full max-w-xs py-4 rounded-full text-white font-bold text-lg tracking-wide transition-all ${
isComplete && !isSubmitting
? 'bg-[#0d2a5c] hover:bg-[#081e42] cursor-pointer active:scale-[0.99]'
: 'bg-[#0d2a5c]/50 cursor-not-allowed'
}`}
>
 {isSubmitting ? 'Verifying...' :'Verify PIN'}
</button>
  </div>
 </div>
    
);


  }
 