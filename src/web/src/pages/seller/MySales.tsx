
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query';
import { listingsService } from '../../services/listingsService';
import { formatPrice } from '../../utils/formatters';
import { SummaryCard } from "../buyer/Reservation";
import { LoadingState } from '../../components/layout/Spinner';
import { ReviewModal } from '../auth/Review';
import { useSearchQuery } from '../../hooks/useSearchQuery';


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
  const navigate = useNavigate()
  const searchQuery = useSearchQuery()
  const [reviewTarget, setReviewTarget] = useState<{
    transactionId: string
    revieweeName: string
  } | null>(null);

  const {
    data: sales = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sales', 'completed'],
    queryFn: () => listingsService.getCompletedSales(),
  });

  const errorMessage = error instanceof Error ? error.message : 'An error occured while loading your sales.';

    const filteredSales = useMemo(() => {
      let result = sales
      switch(activeTab) {
        case 'semester': 
        result = result.filter((o) => isThisSemester(o._createdAtIso))
        break

        case 'awaiting' :  
        result =  result.filter((o) => o.rating === 0)
        break

        case 'reviewed' :  
        result =  result.filter((o) => o.rating > 0)
        break

       
     }
 
     if (searchQuery) {
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(searchQuery) ||
          o.buyerName.toLowerCase().includes(searchQuery)
      )
     }
     return result
    }, [sales, activeTab, searchQuery])

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

      {isLoading && <LoadingState message = "Fetching sales..." />}
    

      {error && !isLoading &&(
        <div className='bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='w-5 h-5 text-rose-500 shrink-0' />
            <span className='text-sm font-medium'>{errorMessage}</span>
          </div>
      <button 
      onClick={() => refetch()}
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
            {searchQuery
            ? `No sales with "${searchQuery}" found.`
            : 'There are no sales available for this category.'}
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
        onClick={() => navigate(`/seller/sales/${sale.id}`)}
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

                ) : sale.transactionId ? (
                  <button
                  type = "button"
                  onClick = {(e) => {
                    e.stopPropagation();
                    setReviewTarget({
                      transactionId: sale.transactionId as string,
                      revieweeName: sale.buyerName,
                    });
                  }}
                  className = "flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline"
                  >
                    <Star className = "w-4 h-4 text-navy-700" />
                    Rate this buyer
                  </button>
                  ) : (
                  <span className = "text-xs text-gray-400">
                    Review unavailable
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
                  onClick = {() => navigate(`/seller/sales/${sale.id}`)}
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

      {reviewTarget && (
              <ReviewModal
              isOpen = {!!reviewTarget}
              onClose = {() => setReviewTarget(null)}
              transactionId= {reviewTarget.transactionId}
              revieweeName= {reviewTarget.revieweeName}
              revieweeLabel = "buyer"
              onSubmitted={() => {
                setReviewTarget(null)
                refetch()
              }}
              />
            )}
    </div>
    );
}