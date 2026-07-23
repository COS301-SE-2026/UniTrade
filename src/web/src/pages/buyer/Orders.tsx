import { useNavigate } from 'react-router-dom'
import React,{ /*useEffect, useCallback,*/ useState } from 'react'
import { Search, Bell, Sun, Star, Loader2, AlertCircle } from 'lucide-react'

export interface Order {
  id: string;
  refNum: string;
  title: string;
  condition: string;
  sellerName: string;
  sellerInitials: string;
  price: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  rating: number;
}

export type OrderFilterTab = 'all' |'semester' |  'awaiting' | 'reviewed'

const mockOrders: Order[] =[
  {
  id: '1',
  refNum: 'OR1234',
  title: 'Calculus - Early Transcendentals',
  condition: 'Good',
  sellerName:'Tafadzwa Musiiwa',
  sellerInitials: 'TM',
  price:280,
  date: '14 June 2025',
  status: 'Completed' ,
  rating: 5,
  }
];


export default function Orders(){
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('all');

  return(
    <main className='flex-1 flex flex-col overflow-y-auto'>
      <header className='flex items-center justify-between px-8 py--4 bg-white border-b border-slate-200'>
        <div className='relative w-96'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <input
          type="text"
          placeholder='search...'
          className='w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none foucs:ring-2 focus:ring-blue-500'
          />
          </div>
          <div className='flex items-center gap-4 text-slate-600'>
            <button className='p-2 hover:bg-slate-slate-100 rounded-full transition-colors'>
            <Bell className='w-5 h-5' />
            </button>

              <button className='p-2 hover:bg-slate-slate-100 rounded-full transition-colors'>
            <Sun className='w-5 h-5' />
            </button>
        </div>
      </header>

      <div className='p-8 max-w-5xl'>
        <h2 className="text-2xl font-bold text-[#0F224A] mb-6">My Orders</h2>
        <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text center">
          <p className='text-3xl font-extrabold text-slate 800'>2</p>
          <p className='text-xs text-slate-500 font-medium mt-1'>Total Purchases</p>
          </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 text center">
          <p className='text-3xl font-extrabold text-slate 800'>R4 820</p>
          <p className='text-xs text-slate-500 font-medium mt-1'>Total Spent</p>
          </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 text center">
          <p className='text-3xl font-extrabold text-slate 800'>9/12</p>
          <p className='text-xs text-slate-500 font-medium mt-1'>Reviews left</p>
          </div>
          
      </div>

      <div className='flex items-center gap mb-6'>
        <button onClick={()=>setActiveTab('all')}
        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeTab=== 'all' ?'bg-[#0F224A text-white': 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
      >All
      </button>
      <button onClick={()=>setActiveTab('semester')}
        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeTab=== 'semester' ?'bg-[#0F224A text-white': 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
      >This semester (5)
      </button><button onClick={()=>setActiveTab('awaiting')}
        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeTab=== 'awaiting' ?'bg-[#0F224A text-white': 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
      >Awaiting Review (9)
      </button>
      <button onClick={()=>setActiveTab('reviewed')}
        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeTab=== 'reviewed' ?'bg-[#0F224A text-white': 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
      >Reviewed (9)
      </button>
      </div>
      </div>
    </main>
  );
}