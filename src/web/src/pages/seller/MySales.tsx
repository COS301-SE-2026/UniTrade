
import { useEffect, useCallback, useState, useMemo} from 'react'
import { useNavigate } from 'react-router-dom';
import { Loader2 ,AlertCircle, Star} from 'lucide-react'
import { listingsService } from '../../services/listingsService';
import { formatPrice} from '../../utils/formatters';
import type { SaleItem } from '../../types/listing';
import { SummaryCard } from "../buyer/Reservation";


export type SaleFilterTab = 'all' |'semester' |  'awaiting' | 'reviewed'

function isThisSemester(iso: string): boolean{
//for now 
const mockMonth = new Date()
mockMonth.setMonth(mockMonth.getMonth()-3)
return new Date(iso) >= mockMonth
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

export default function MySales(){
  const [activeTab, setActiveTab] = useState<SaleFilterTab>('all');
  const [sales, setSales] = useState<SaleItem[]>([]);
  const navigate=useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load= useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try{
      const data = await listingsService.getCompletedSales();
      setSales(data);
    }catch (err:any){
      setError(err instanceof Error ? err.message : 'An error occured while loading your sales.');
      }finally{
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      load();
    }, [load]);

    const filteredSales = useMemo(() => {
      switch(activeTab) {
        case 'semester': return sales.filter((o) => isThisSemester(o._createdAtIso))

        case 'awaiting' :  return sales.filter((o) => o.rating === 0)
        case 'reviewed' :  return sales.filter((o) => o.rating > 0)
        default:
          return sales
     }
    }, [sales, activeTab])

    const stats = useMemo(() => {
      const totalSales = sales.length
      const totalEarned = sales.reduce((sum, o )=> sum +o.price, 0)
      const reviewedCount = sales.filter((o) => o.rating >0).length

      return {
        totalSales,totalEarned,reviewsReceived: `${reviewedCount}/${totalSales}`
      }
    },[sales])
    
  return(
    <div className = "flex flex-col gap-6">
      <div className = "flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className = "font-['Fraunces'] font-normal text-[32px] text-gray-800">
            My Sales
          </h1>
          <p className = "text-sm text-gray-400 mt-1">
            {sales.length} {sales.length === 1 ? 'sale' : 'sales'} made
          </p>
        </div>
      </div>

      <div className = "flex gap-4">
        <SummaryCard
        label = "Total Sales"
        value = {String(stats.totalSales)}
        icon={null}
        />
        <SummaryCard
        label = "Total Earned"
        value = {formatPrice(stats.totalEarned)}
        icon = {null}
        />
        <SummaryCard
        label = "Reviews received"
        value = {stats.reviewsReceived}
        icon = {null}
        />
      </div>

      <div className = "flex items-center gap-2">
        {(['all','semester', 'awaiting', 'reviewed'] as SaleFilterTab[]).map((tab) => (
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
            <p className='text-sm'>Fetching sales...</p>
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

      {!isLoading && !error && filteredSales.length ===0 && (
        <div className='bg-white rounded-xl border border-gray-200 p-8 text-center'>
          <p className='text-sm font-semibold text-gray-700'>
            No sales found 
          </p>
          <p className='text-xs text-gray-400 mt-1'>
            There are no sales available for this category.
          </p>
        </div>
      )}


  {!isLoading && !error && filteredSales.length>0 && (
  <div className='flex flex-col gap-4'>
    {filteredSales.map((sale) =>(
      <div
        key={sale.id} 
        className='bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4'
      >
        <img
        src = {sale.imageUrl || '/placeholder-book.png'}
        alt = {sale.title}
        onClick={() => navigate(`/buyer/orders/${sale.id}`)}
        className = "w-20 h-20 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        />

        <div className = "flex-1 min-w-0">
          <div
          onClick = {() => navigate(`/seller/sales/${sale.id}`)}
          className = "cursor-pointer"
          >

            <div className = "flex items-center gap-2 flex-wrap">
              <p className = "text-sm font-bold text-gray-800 truncate">
                {sale.title}
              </p>
              <ConditionBadge condition= {sale.condition} />
            </div>
            <p className = "text-xs text-gray-400 mt-0.5">
              Delivered {sale.date} . Ref: {sale.refNum}
            </p>
            </div>

            <div className = "flex items-center gap-2 mt-1">
              <span className = "w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center">
                {sale.buyerInitials}
              </span>
              <span className= "text-xs font-semibold text-gray-700">
                {sale.buyerName}
              </span>
              </div>

              <div className= "flex items-center gap-1 pt-1">
                {sale.rating > 0 ? (
                <>
                {[...Array(5)].map((_, i) => (
                  <Star
                  key = {i}
                  className = {`w-4 h-4 ${
                    i < sale.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                  }`}
                  />
                ))}

                <span className = "text-xs text-gray-500 ml-1">
                  The buyer reviewed this sale
                </span>
                </>

                ) : (
                  < span className="text-xs text-gray-400">
                    Not yet reviewed by buyer
                  </span>
                )}

              </div>
              </div>

                <div className = "text-right space-y-3">
                  <div>
                    <p className = "text-lg font-bold text-gray-900">
                      {formatPrice(sale.price)}
                    </p>
                    <p className = "text-xs text-gray-400">
                      {sale.date}
                    </p>
                  <button 
                  onClick = {() => navigate(`/buyer/orders/${sale.id}`)}
                  className = "px-4 py-1.5 border border-gray-400 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
      )}
    </div>
    );
}