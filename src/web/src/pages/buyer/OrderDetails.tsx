//import React from 'react';
import { Search, Bell,Sun, ChevronRight,Star} from 'lucide-react';

export default function OrderDetails({refNum = 'UT-2024-00481'}) {
  return (
    <div className='flex h-screen bg-slate-100 font-sans text-slate-800'>
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shirnk-0">
          <div className='relative w-96'>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
            type="text"
            placeholder='search...'
            className='w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />

          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <button className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
              <Bell className='w-5 h-5'/>
            </button>
            <button className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
              <Sun className='w-5 h-5'/>
            </button>
          </div>
        </header>

    <div className='p-8 max-w-6xl w-full mx-auto space-y-6'>
      <div className="flex item-center justify-between">
        <nav className='flex items-center gap-2 text-sm font-medium'>
          <a href='/orders' className="text-blue-600 hover:underline">My Orders</a>
          <ChevronRight className='w-4 h-4 text-slate-400' />
          <span className="text-slate-600 font-semibold">{refNum}</span>
        </nav>
        <span className="bg-emerald-200 text-emerald-800 text-xs px-4 py-1.5 rounded-full font-semibold">
          Completed
        </span>
      </div>

      <div className='space-y-6'>
        <div className='bg-white-rounded-xl p-5 border border-slate-200 shadow-sm'>
          <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>Item</h3>
        <div className='flex items-start gap-4'>
          <div className='w-20 h-20 bg-slate-900 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-xs text-white'>
            book cover
          </div>
          <div className='space-y-1'>
            <h4 className='font-bold text-slate-800 text-base'>Calculus Early Transcendentals</h4>
            <p className='text-xs text-slate-500'>Condition: Good</p>
            <p className='text-xs text-slate-500'>Category: Textbook</p>
            <p className='text-xs text-slate-500'>Module Code: WTW124</p>
          </div></div>

        </div>
         <div className='bg-white-rounded-xl p-5 border border-slate-200 shadow-sm'>
          <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>Order Timeline</h3>
          <div className="relative pl-6 space-y-6 before: absolute before:left-2 before:top-2 before:0.5 before:bg-emerald-500">
            {[
              { title: 'Listing reserved', time: '7 May 2026, 09:15'},
              { title: 'Meeting arranged with seller', time: '7 May 2026, 09:22'},
              { title: 'Item received', time: '7 May 2026, 09:23'},
              { title: 'Payment completed', time: '7 May 2026, 09:23'},
              { title: 'Listing reserved', time: '7 May 2026, 09:23'},
            ].map((step, idx) =>(
              <div key={idx} className="relative">
                <div className='absolute-left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white' />
                <p className='text-xs font-bold text-slate-800'>{step.title}</p>
                <p className="text-[10px] text-slate-400">{step.time}</p>
                </div>
            ))
            
            }
          </div>
    </div>
    <div className='bg-white-rounded-xl p-5 border border-slate-200 shadow-sm'>
          <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>Your review</h3>
          <div className='flex items-center gap-2 mb-2'>
            <div className='flex items-center gap-0.5'>
              {[...Array(5)].map((_, i) => (
<Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className='text-xs text-slate-400'>5 out of 5 stars</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Item was exactly described, Seller was on time and friendly.
          </p>
          </div>
          </div>
          </div>
    </main>
    </div>
  );
}