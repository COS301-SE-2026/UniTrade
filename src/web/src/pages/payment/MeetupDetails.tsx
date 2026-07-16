import {useNavigate } from 'react-router-dom';

import {ChevronLeft, User, MapPin, Calendar,Users,Lock} from 'lucide-react';

export default function MeetupDetails()
{
const navigate = useNavigate();

return(
<div className="bg-slate-50 min-h-screen flex flex-col justify-between max-w-md mx-auto shadow-xl border border-slate-100">
<div className="bg-indigo-90 text-white px-4 py-4 flex items-center gap-3">
<button onClick={() => navigate(-1)} className="hover:opacity-80">
<ChevronLeft className="w-6 h-6" />
</button>
<h1 className="font-semi-bold text-black">Meetup Details</h1>
</div>

<div className="p-5 flex-1 space-y-6">
<div className="space-3">
<h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Seller</h2>
<div className=" flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
  <div className="w-10 h-10 bg-slate-200 rounded-full flex-items-center justify-center">
<User className="w-5 h-5 text-slate-500" />
</div>
<div>
<p className="font-bold text-slate-800"> Langa V.</p>
</div>
</div>
</div>

<div className="space-y-3">
<div className="flex gap-3 items-start">
<MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
<p className="text-slate-600 text-sm">Campus Library, Room 3B</p>
</div>
<div className="flex gap-3 items-start">
<Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
<p className="text-slate-600 text-sm"> Oct 25, 4:00 PM </p>
</div>
</div>

<div className="grid grid-cols-2 gap-4">
<div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
<p className="text-xs text-slate-400 semibold uppercase">2 Attendees</p>

<div className="flex gap-1 text-slate-500 items-center">
<Users className="w-4 h-4"/>
<span className="text-sm font-bold">Attendees</span>
</div>
</div>

<div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
<p className="text-xs text-slate-400 font-semibold uppercase">Price</p>
<p className="text-sm font-bold text-slate-800">R400</p>
</div>
</div>

<div className="space-y-1">
<p className="text-xs text-slate-400 font-semibold uppercase">Status</p>
<span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
Comfirmed 
</span>
</div>
</div>

<div className="p-4 bg-white border-t border-slate-200 space-y-3">
<button onClick={() => navigate('/payment/payfast-redirect')}
className="w-full bg-slate-400 hover:bg-slate-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-sm">
<Lock className="w-4 h-4" /> Pay R400
</button>
<p className="text-center text-[10px] text-slate 400">pay button disabled - waiting to pay Langa V.
</p>
</div>
</div>
);
}

