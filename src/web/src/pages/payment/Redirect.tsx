import { useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import {Loader2} from 'lucide-react';

export default function Redirect() {
const navigate = useNavigate();

useEffect(() => {
const timer = setTimeout(() =>{
//navigate('/payment/confirming');
}, 2500);
return() => clearTimeout(timer);
}, [navigate]);

return(
<div className="bg-white min-h-screen flex flex-col max-w-md mx-auto shadow-xl border border-slate-100">
<div className="bg-blue-900 text-white px-4 py-4 flex items-center gap-2">
<div className="w-6 h-6 bg-white text-blue-600 rounded-full font-black text-xs flex items-center justify-center">PF
</div>
<h1 className="font-semibold text-lg">Payfast Payment</h1>
</div>

<div className="flex-1 flex flex-col items-center justify-centerp-6 space-6 text-center">
<Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
<div className="space-y-2">
<h3 className="font-bold text-lg text-slate-800">Redirecting to Payfast...</h3>
<p className="text-slate-500 text-sm max-w-[250px]">
Securely connecting to Payfast for instant EFT. Please wait.</p>
</div>
</div>
<div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
<button
onClick={ () => navigate('/payment/confirming')}
className="text-xs text-indigo-600 font-medium hover:underline">
Skip Redirect 
</button>
</div>
</div>
);}