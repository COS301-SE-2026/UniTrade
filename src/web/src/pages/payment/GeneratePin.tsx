import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'


export default function EnterPin()
{
  const navigate = useNavigate();
  const pinDigits = ['1','2','3','4','5','0'];
  
  const [timeLeft,setTimeLeft] = useState(59);

  useEffect(() => {if 
    (timeLeft ===0)return;
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft]);

  const handleResend = () => {
    setTimeLeft(59);
    //api will be called here lateer
  }

  const handleDone = () => {
      navigate('/buyer/Reservation');
  };

  return (
 <div className="min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-samns p-4">
  <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-12 md:p-16 flex flex-col items-center space-y-10">
  <div className="text-center space-y-2">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
       Transaction PIN
      </h1>
      <p className="text-sm text-slate-500 font-medium">
        Present this pin to the seller upon transaction completion.
      </p>
  </div>

  <div className="flex justify-center gap-3 md:gap-4">
    {pinDigits.map((digit, index) => (
<div 
key={index}
className="w-12 md:h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-non transition-all duration-150">
  {digit}

  </div>
    ))}
    </div>

<div className="w-full max-w-md flex flex-col sm:flex-row items-center justify-between gap-4 text-sm px-2">
  <div className="font-semibold text-slate-700">
    Remaining Time: <span className="text-[#0d2a5c] font-extrabold">00:{String(timeLeft).padStart(2, '0')}s</span>
 </div>

 <div className="text-slate-500 font-semibold flex items-center gap-1">
  Didn't receive a code?{' '} 
  <button 
onClick={handleResend}
disabled={timeLeft>0}
className={`font-extrabold transition-colors ${
timeLeft === 0
? 'text-[#0d2a5c] hover:bg-underline cursor-pointer'
: 'text-slate-300 cursor-not-allowed'
}`}
>
 Resend
</button>
  </div>
 </div>
 <button
 onClick={handleDone}
 className="w-full max-w-xs py-4 bg-[#0d2a5c] hover:bg-[#081e42] active:scale-[0.99] text-white font-bold text-lg tracking-wide rounded-full shadow-md transition-all cursor-pointer">
  Done
 </button>
 </div>
 </div>
    
  );
}