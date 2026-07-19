//import { useNavigate } from 'react-router-dom'

import { CheckCircle2 } from 'lucide-react';

export default function PaymentComplete() {
   //const navigate = useNavigate();

   /*const transactionDetails = {
    amount: "R400.00",
    receipient: "Langa V",
    item: "Calculus 2nd Edition",
    refNumber: "#30886",
    date: new Date().toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  };*/
  /*const handleDone = () => {
    navigate('/dashboard');
  } ;*/
   
  return (
    
 <div className="min-h-screen bg-[#f1f1f1] flex flex-col justify-center items-center font-samns p-4">
<div className="flex-justify-center">
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


 </div>
   
  )
}
