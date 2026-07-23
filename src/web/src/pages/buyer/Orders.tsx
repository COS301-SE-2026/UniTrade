
import { useEffect, useCallback, useState, /*useMemo*/} from 'react'
import { Search, Bell, Sun, Star,Loader2 ,AlertCircle} from 'lucide-react'


export interface OrderItem{
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

export interface OrderStatsData {
  totalPurchases: number;
  totalSpent: number;
  reviewsLeft: string;
}

export type OrderFilterTab = 'all' |'semester' |  'awaiting' | 'reviewed'

const API_BASE_URL ='http://localhost:5000/api';

async function fetchOrders(tab: OrderFilterTab):Promise<OrderItem[]>{
  const response = await fetch(`${API_BASE_URL}/orders?filter=${tab}`,
    {
      headers:{'Content-Type': 'application/json',

    },
});
if(!response.ok){
  throw new Error(`failed to fetch orders (${response.status})`);

} return response.json();
} 
async function fetchOrderStats(): Promise<OrderStatsData> {
  const response = await fetch(`${API_BASE_URL}/orders/stats`,
{
      headers:{'Content-Type': 'application/json',

    },
});
if(!response.ok){
  throw new Error(`failed to fetch order stats`);

} return response.json();
} 
  

export default function Orders(){
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('all');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats,setStats] = useState<OrderStatsData  |null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() =>{
    fetchOrderStats().then(setStats).catch((err)=> console.error('Error loading stats:', err));
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try{
      const data = await fetchOrders(activeTab);
      setOrders(data);
    }catch (err:any){
      setError(err.message || 'An error occured while loading your orders.');
      }finally{
        setIsLoading(false);
      }
    }, [activeTab]);

    useEffect(() => {
      loadOrders();
    }, [loadOrders]);
    
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
          <p className='text-3xl font-extrabold text-slate 800'>
            {stats ? stats.totalPurchases : '--'}
          </p>
          <p className='text-xs text-slate-500 font-medium mt-1'>Total Purchases</p>
          </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 text center">
          <p className='text-3xl font-extrabold text-slate 800'>
            {stats ? `R ${stats.totalSpent.toLocaleString()}`:'--'}

          </p>
          <p className='text-xs text-slate-500 font-medium mt-1'>Total Spent</p>
          </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 text center">
          <p className='text-3xl font-extrabold text-slate 800'>
            {stats ? stats?.reviewsLeft : '--'}
          </p>
          <p className='text-xs text-slate-500 font-medium mt-1'>Reviews left</p>
          </div>
          
      </div>



      <div className='flex items-center gap mb-6'>
        {(['all','semester', 'awaiting', 'reviewed'] as OrderFilterTab[]).map((tab) => (
        <button 
        key={tab}
         onClick={()=>setActiveTab(tab)}
        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
       activeTab === tab ? 'bg-[#0F224A text-white': 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
      >
      {tab === 'semester' ? 'This semester' :tab === 'awaiting' ? 'Awaiting review' : tab}
      </button>
        ))}
        </div>
        {isLoading && (
          <div className='flex flex-col items-center justify-center py-16 text-slate-500'>
            <Loader2 className='w-8 h-8 animate-spin mb-2' />
            <p className='text-sm'>Fetching orders from server...</p>
            </div>
        )}
    

      {error && !isLoading &&(
        <div className='bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='w-5 h-5 text-rose-500 shrink-0' />
            <span className='text-sm font-medium'>{error}</span>
          </div>
      <button 
      onClick={loadOrders}
      className='px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors'
      >
        Retry
      </button>
      </div>)}

      {!isLoading && !error && orders.length ===0 && (
        <div className='text-center py-16 bg-white rounded-xl border border-slate-200'>
          <p className='text-slate-600 font-medium'>No orders found </p>
          <p className='text-xs text-slate-400 mt-1'>There are no orders available for this category.</p></div>
      )}
      {isLoading && !error && orders.length>0 && (

  <div className='space-y-6'>
    {orders.map((order) =>(
      <div key={order.id} className='bg-slate-200/60 rounded-xl p-4 border order-slate-300'>
        <div className='flex justify-between items-center mb-3 px-1'>
          <span className='text-sm font-semibold text-slate-700'>Ref num: {order.refNum}</span>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-slate-600'>Collected {order.date}</span>
            <span className='bg-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full font-semibold'>
              {order.status}
            </span>
          </div>
          </div>
          
 <div className='bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between'>
      <div className="flex items-center gap-4">
        <div className='w-20 h-20 bg-slate-900 rounded-md overflow-hidden shrink-0 flex items-center justify-venter text-xs text-white'>
          [Book Cover]

  </div>
  <div className='space-y-1'>
    <h3 className='font-bold text-slate-800 text-base'>{order.title}</h3>
    <p className='text-xs text-slate-500'>Condition: {order.condition}</p>

    <div className="flex items-center gap-2 pt-1">
    <span className='w-5 h-5 rounded-full bg-blue-700 text-white text-10px] font-bold flex items-center justify-center'>
      {order.sellerInitials}
      </span>
      <span className='text-xs font-semibold text-slate-700'>
        {order.sellerName}</span>
        </div>


        <div className="flex items-center gap-1 pt-1">
          {[...Array(5)].map((_,i) => (
            <Star 
            key={i}
            className={`w-4 h-4 ${
              i < order.rating ? 'fill-amber-400 text-amber-400': 'text-slate-300'
            }`}/>

          ))}
          <span className='text-xs text-slate-500 ml-1'>You rated this</span>
        </div>
    </div>
      </div>
      <div className='text-ight space-y-4'>
        <div>
          <p className='text-lg font-bold text-slate-900'>R{order.price}</p>
          <p className="text-xs text-slate-400">{order.date}</p></div>
          <button className='px-4 py-1.5 border border-slate-400 text-slate-700 rounded-lg text-sm font-semibold hover:bg-dlate-50 transition-colors'>
            View details
          </button>
      </div>
      </div>
      </div>
    ))}
      </div>
      )}
      </div>
    </main>

  );
}