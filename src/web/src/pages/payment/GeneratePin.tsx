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

  const handleSend = () => {
    setTimeLeft(59);
    //api will be called here lateer
  }

  const handleDone = () => {
      navigate('/buyer/Reservation');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">GeneratePin</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}