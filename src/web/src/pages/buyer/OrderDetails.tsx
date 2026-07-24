//import React from 'react';
import { Search, Bell,Sun, ChevronRight} from 'lucide-react';

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
    </div>
    </main>
    </div>
  );
}