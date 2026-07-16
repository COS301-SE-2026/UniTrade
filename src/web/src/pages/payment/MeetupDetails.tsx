import {useNavigate } from 'react-router-dom';

import {ChevronLeft, User, MapPin, Calendar,Users,Lock, ShieldCheck} from 'lucide-react';

export default function MeetupDetails()
{
const navigate = useNavigate();

return(
  <div className="min-h-screen bg-slate-50/50 pb-12">
  <div className="bg-blue-900 border-b border-slate-200">
<div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600">
<ChevronLeft className="w-6 h-6" />
</button>
<div >
<h1 className="text-xl text-white font-bold text-slate-900">Meetup Details</h1>
<p className="text-xs text-white text-slate-500"> Review your transaction before completing payment</p>
</div>

</div>
<span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100">
Confirmed Meetup
</span>
</div>
</div>

<div className="max-w-6xl mx-auto px-4 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

<div className="lg:col-span-2 space-y-6">

  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
<h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Seller</h2>
<div className=" flex items-center gap-4">
  <div className="w-12 h-12 bg-blue-50 border border-indigo-100 rounded-full flex-items-center justify-center">
<User className="w-6 h-6 text-blue-600" />
</div>
<div>
<p className="font-bold text-lg text-slate-800"> Langa V.</p>
<p className="text-xs text-slate-500"> Verified Seller</p>
</div>
</div>
</div>

<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Logistics</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl">
<MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
<div>

<p className="font-semibold text-sm text-slate-800">Venue Location</p>
<p className="text-slate-600 text-sm">Campus Library, Room 3B</p>
</div>
</div>

<div className="flex gap-3 items-start bg-slate-50 rounded-xl">
<Calendar className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
<div>
  <p className="font-semibold text-sm text-slate-800">Scheduled Time</p>
<p className="text-slate-600 text-sm"> Oct 25, 4:00 PM </p>
</div>
</div>
</div>
  </div>


<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Session Info</h2>
<div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl max-w-sm">
<Users className="w-5 h-5 text-blue-600"/>
<div>
<p className="text-sm font-bold text-slate-800">2 Attendees</p>
<p className="text-xs text-slate-500">Item collection</p>
</div>
</div>
</div>
</div>

<div className="lg:sticky lg:top-6 space-y-4">
<div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
  <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
    Payment Summary
    </h3>


      <div className=" pt-1 flex justify-between items-center">
        <span className="font-bold text-slate-900 text-base">Price</span>
        <span className="font-black text-xl text-blue-950">R400.00</span>
      </div>
      
<div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/50 flex-items-start gap-3">
<ShieldCheck className="w- h-5 text-indigo-600 shrink-0 mt-0.5" />
<p className="text-xs text-blue-90 leading-relaxed">
  <strong>Safety Guarantee:</strong>Your funds are held securely by Unitrade and will only be release once you supply a pin to Langa V at physical meetup.
</p>
</div>

<div className=" space-y-3">
<button onClick={() => navigate('/payment/payfast-redirect')}
className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg">
<Lock className="w-4 h-4" /> Pay R400.00
</button>
<p className="text-center text-[11px] text-slate 400">By Paying you agree to the Unitrade Payment policies.
  </p>
</div>
</div>
</div>

</div>
</div>
</div>
);
}