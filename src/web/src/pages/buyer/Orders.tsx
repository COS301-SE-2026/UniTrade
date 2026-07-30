
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router';
import { AlertCircle, Star } from 'lucide-react'
import { listingsService } from '../../services/listingsService';
import { formatPrice } from '../../utils/formatters';
import { useQuery } from '@tanstack/react-query';
import { SummaryCard } from "./Reservation";
import { ReviewModal } from '../auth/Review';
import { LoadingState } from '../../components/layout/Spinner';


export type OrderFilterTab = 'all' | 'semester' | 'awaiting' | 'reviewed'

function isThisSemester(iso: string): boolean {
  const mockMonth = new Date()
  mockMonth.setMonth(mockMonth.getMonth() - 3)
  return new Date(iso) >= mockMonth
}




export default function Orders() {
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('all');

  const navigate = useNavigate()

  const [reviewTarget, setReviewTarget] = useState<{
    transactionId: string
    revieweeName: string
  } | null>(null);

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', 'completed'],
    queryFn: () => listingsService.getCompletedOrders(),
  });

  const errorMessage = error instanceof Error ? error.message : 'An error occured while loading your orders.';

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'semester': return orders.filter((o) => isThisSemester(o._createdAtIso))

      case 'awaiting': return orders.filter((o) => o.rating === 0)
      case 'reviewed': return orders.filter((o) => o.rating > 0)
      default:
        return orders
    }
  }, [orders, activeTab])

  const stats = useMemo(() => {
    const totalPurchases = orders.length
    const totalSpent = orders.reduce((sum, o) => sum + o.price, 0)
    const reviewedCount = orders.filter((o) => o.rating > 0).length

    return {
      totalPurchases, totalSpent, reviewsLeft: `${reviewedCount}/${totalPurchases}`
    }
  }, [orders])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
            My Orders
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <SummaryCard
          label="Total Purchases"
          value={String(stats.totalPurchases)}
          icon={null}
        />
        <SummaryCard
          label="Total Spent"
          value={formatPrice(stats.totalSpent)}
          icon={null}
        />
        <SummaryCard
          label="Reviews left"
          value={stats.reviewsLeft}
          icon={null}
        />
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'semester', 'awaiting', 'reviewed'] as OrderFilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab
                ? 'bg-navy-700 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-navy-700'
              }`}
          >
            {
              tab === 'semester'
                ? 'This semester'
                : tab === 'awaiting'
                  ? 'Awaiting review'
                  : tab === 'reviewed'
                    ? 'Reviewed'
                    : 'All'
            }
          </button>
        ))}
      </div>

      {isLoading && <LoadingState message="Fetching orders..." />}

      {error && !isLoading && (
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

      {!isLoading && !error && filteredOrders.length === 0 && (
        <div className='bg-white rounded-xl border border-gray-200 p-8 text-center'>
          <p className='text-sm font-semibold text-gray-700'>
            No orders found
          </p>
          <p className='text-xs text-gray-400 mt-1'>
            There are no orders available for this category.
          </p>
        </div>
      )}


      {!isLoading && !error && filteredOrders.length > 0 && (
        <div className='flex flex-col gap-4'>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className='bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4'
            >
              <img
                src={order.imageUrl || '/placeholder-book.png'}
                alt={order.title}
                onClick={() => navigate(`/buyer/orders/${order.id}`)}
                className="w-20 h-20 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              />

              <div className="flex-1 min-w-0">
                <div
                  onClick={() => navigate(`/buyer/orders/${order.id}`)}
                  className="cursor-pointer"
                >

                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {order.title}
                    </p>

                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Collected {order.date} . Ref: {order.refNum}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center">
                    {order.sellerInitials}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {order.sellerName}
                  </span>
                </div>

                <div className="flex items-center gap-1 pt-1">
                  {order.rating > 0 ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < order.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                            }`}
                        />
                      ))}

                      <span className="text-xs text-gray-500 ml-1">
                        You rated this
                      </span>
                    </>

                  ) : order.transactionId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewTarget({
                          transactionId: order.transactionId as string,
                          revieweeName: order.sellerName,
                        });
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-navy-700 hover:underline"
                    >
                      <Star className="w-4 h-4 text-navy-700" />
                      Rate this seller
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Review unavailable
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right space-y-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(order.price)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {order.date}
                  </p>
                  <button
                    onClick={() => navigate(`/buyer/orders/${order.id}`)}
                    className="px-4 py-1.5 border border-gray-400 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
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
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          transactionId={reviewTarget.transactionId}
          revieweeName={reviewTarget.revieweeName}
          revieweeLabel="seller"
          onSubmitted={() => {
            setReviewTarget(null)
            refetch()
          }}
        />
      )}
    </div>
  );
}