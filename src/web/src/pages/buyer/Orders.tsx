
import { useEffect, useCallback, useState, useMemo} from 'react'
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Star,Loader2 ,AlertCircle} from 'lucide-react'
import { getReservations, getTransactionStatus} from '../../services/reservationService';
import { listingsService } from '../../services/listingsService';
import { formatPrice} from '../../utils/formatters';
import type { Review } from '../../types/listing';
import type { ReservationListItem} from '../../types/Reservations';
import { SummaryCard } from "./Reservation";


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
  _createdAtIso: string;
  imageUrl: string;
}

export type OrderFilterTab = 'all' |'semester' |  'awaiting' | 'reviewed'

function isThisSemester(iso: string): boolean{
//for now 
const mockMonth = new Date()
mockMonth.setMonth(mockMonth.getMonth()-3)
return new Date(iso) >= mockMonth
}

function toRefNum(reservationId: string): string {
  return `#${reservationId.slice(0,8).toUpperCase()}`
}

function formatOrderDate(iso: string) : string{
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}


const conditionColours: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  like_new: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Good: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Fair: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Poor: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

function ConditionBadge({ condition }: { condition: string}) {
  const s = conditionColours[condition] ?? conditionColours.Fair;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {condition}
    </span>
  );
}



async function loadCompletedOrders(): Promise<OrderItem[]> {
  const result = await getReservations({ role: 'buyer'})
  if(!result.success){
    throw new Error(result.error.message ?? 'Failed  to load your orders.')
  }

  const completed = result.data.items.filter(
    (r) => r.reservationStatus === 'completed',
  )

  const listingIds = [...new Set(completed.map((r) => r.listingId))]
const conditionByListingId = new Map<string, string>()

await Promise.all(
  listingIds.map(async (listingId) => {
    try {
      const detail = await listingsService.getById(listingId)
      conditionByListingId.set(listingId, detail.condition)

    } catch {
      conditionByListingId.set(listingId, 'Uknown')
    }
  }),
)

const txBbyReservationId = new Map<string, string | null>()
await Promise.all(
  completed.map(async (r) => {
    const tx = await getTransactionStatus(r.reservationId)
    txBbyReservationId.set(r.reservationId, tx.success ? tx.data.transactionId: null)

  }),
)

const sellerIds = [...new Set(completed.map((r) =>r.counterParty.userId))]
const reviewsBySellerId = new Map< string, Review[]>()
await Promise.all(
  sellerIds.map(async (sellerId) => {
    try{
      const data = await listingsService.getReviewsForUser(sellerId)
      reviewsBySellerId.set(sellerId, data.reviews)
    }
    catch{reviewsBySellerId.set(sellerId, [])
    }
  }),
)

return completed.map((r: ReservationListItem) => {
  const transactionId = txBbyReservationId.get(r.reservationId)
  const sellerReviews = reviewsBySellerId.get(r.counterParty.userId) ?? [] 
  const theReview = transactionId
  ? sellerReviews.find(
    (rev) => rev.transactionId === transactionId) :undefined

return{
  id: r.reservationId,
  refNum: toRefNum(r.reservationId),
  title: r.listing.title,
  condition: conditionByListingId.get(r.listingId) ?? 'Unknown',
sellerName: r.counterParty.name,
sellerInitials: r.counterParty.initials,
price: r.listing.price,
date: formatOrderDate(r.createdAt),
status: 'Completed',
rating: theReview?.rating ?? 0,
_createdAtIso: r.createdAt,
imageUrl: imageByListingId.get(r.listingId) ?? '',
}}) 
}



export default function Orders(){
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('all');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const navigate=useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load= useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try{
      const data = await loadCompletedOrders();
      setOrders(data);
    }catch (err:any){
      setError(err instanceof Error ? err.message : 'An error occured while loading your orders.');
      }finally{
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      load();
    }, [load]);

    const filteredOrders = useMemo(() => {
      switch(activeTab) {
        case 'semester': return orders.filter((o) => isThisSemester(o._createdAtIso))

        case 'awaiting' :  return orders.filter((o) => o.rating === 0)
        case 'reviewed' :  return orders.filter((o) => o.rating > 0)
        default:
          return orders
     }
    }, [orders, activeTab])

    const stats = useMemo(() => {
      const totalPurchases = orders.length
      const totalSpent = orders.reduce((sum, o )=> sum +o.price, 0)
      const reviewedCount = orders.filter((o) => o.rating >0).length

      return {
        totalPurchases,totalSpent,reviewsLeft: `${reviewedCount}/${totalPurchases}`
      }
    },[orders])
    
  return(
    <div className = "flex flex-col gap-6">
      <div className = "flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className = "font-['Fraunces'] font-normal text-[32px] text-gray-800">
            My Orders
          </h1>
          <p className = "text-sm text-gray-400 mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>
      </div>

      <div className = "flex gap-4">
        <SummaryCard
        label = "Total Purchases"
        value = {String(stats.totalPurchases)}
        icon={null}
        />
        <SummaryCard
        label = "Total Spent"
        value = {formatPrice(stats.totalSpent)}
        icon = {null}
        />
        <SummaryCard
        label = "Reviews left"
        value = {stats.reviewsLeft}
        icon = {null}
        />
      </div>

      <div className = "flex items-center gap-2">
        {(['all','semester', 'awaiting', 'reviewed'] as OrderFilterTab[]).map((tab) => (
          <button
          key = {tab}
          onClick={() => setActiveTab(tab)}
          className = {`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeTab === tab
            ? 'bg-navy-700 text-white'
            : 'bg-white text-gray-600 border border-gray-300 hover:border-navy-700'
          }`}
          >
            {
              tab === 'semester'
              ? 'This semester'
              :tab === 'awaiting'
              ? 'Awaiting review'
              : tab === 'reviewed'
              ? 'Reviewed'
              : 'All'
            }
          </button>
        ))}
      </div>

        {isLoading && (
          <div className='flex flex-col items-center justify-center py-16 text-slate-500'>
            <Loader2 className='w-8 h-8 animate-spin mb-2' />
            <p className='text-sm'>Fetching orders...</p>
            </div>
        )}
    

      {error && !isLoading &&(
        <div className='bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='w-5 h-5 text-rose-500 shrink-0' />
            <span className='text-sm font-medium'>{error}</span>
          </div>
      <button 
      onClick={load}
      className='px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors'
      >
        Retry
      </button>
      </div>)}

      {!isLoading && !error && filteredOrders.length ===0 && (
        <div className='bg-white rounded-xl border border-gray-200 p-8 text-center'>
          <p className='text-sm font-semibold text-gray-700'>
            No orders found 
          </p>
          <p className='text-xs text-gray-400 mt-1'>
            There are no orders available for this category.
          </p>
        </div>
      )}


  {!isLoading && !error && filteredOrders.length>0 && (
  <div className='flex flex-col gap-4'>
    {filteredOrders.map((order) =>(
      <div
        key={order.id} 
        className='bg-white rounded-xl border border-gray-200 p-4 flex-items-center gap-4'
      >

        <img
        src = {order.imageUrl || ''}
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
          <p className='text-lg font-bold text-slate-900'>R{formatPrice(order.price)}</p>
          <p className="text-xs text-slate-400">{order.date}</p></div>
          <button 
          onClick={() => navigate(`/buyer/orders/${order.id}`)}
            className='px-4 py-1.5 border border-slate-400 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors'>
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