import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldCheck,ShieldAlert } from "lucide-react";

export default function EnterPin()
{
  const navigate = useNavigate();
  const [pin, setPin] = useState<string[]>(['','','','','','']);
  const [error, setError] = useState<string | null>(null);
  const targetPin = "813472";
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleClear =() =>
  {
    setPin(['','','','','','']);
    setError(null);
    inputRefs.current[0]?.focus();

  };
  const currentPinStr = pin.join('');
  const isComplete = pin.every(d => d != '');
  const isCorrect = currentPinStr === targetPin;

  const handleVerifyAndPayout = () => {
    if(!isComplete) return;
    if (isCorrect){
      navigate('/payment/payment-complete');
    }
    else{
setError("The secure PIN entered is incorrect.Please try again.");
handleClear();
    }
  };

return (

   <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Enter pin
        
      </h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
);


  }
 