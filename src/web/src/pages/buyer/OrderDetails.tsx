import {useEffect, useState} from 'react';
import { useNavigate,useParams,Link } from 'react-router-dom';
import { Search, Bell,Sun,MessageSquare,Download,AlertTriangle,AlertCircle,ChevronRight,Star,Loader2} from 'lucide-react';
import { listingsService } from '../../services/listingsService';
import { formatPrice} from '../../utils/formatters';
import type { Reservation} from '../../types/Reservations';
import { useAuthStore } from '../../store/useAuthStore';
import type {ListingDetail, MeetupStatusResponse, Review,} from '../../types/listing'
import { getReservationById, getTransactionStatus } from '../../services/reservationService';

function toRefNum(reservationId: string): string {
  return `#${reservationId.slice(0,8).toUpperCase()}`
}

function formatDate(iso: string) : string{
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function OrderDetails() {
    const navigate=useNavigate();
    const { reservationId } = useParams<{reservationId:string}> ();
    const [reservation, setReservation ]= useState<Reservation | null>(null);
    const [listing, setListing ]= useState<ListingDetail | null>(null);
  const [review, setReview ]= useState<Review | null>(null);
const [meetup, setMeetup ]= useState<MeetupStatusResponse | null>(null);

    const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useAuthStore.getState().user?.id;
  const isBuyer = reservation ? reservation.buyerId === currentUserId : true;
  const backPath = isBuyer ? '/buyer/orders' : '/seller/sales';
  const backLabel  = isBuyer ? 'My Orders' : 'My Sales';

  useEffect(() => {
    if (!reservationId)  return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try{
        const result =await getReservationById(reservationId);
        if(!result.success) {
          throw new Error ( result.error.message ?? 'Failt to load this order.');
        }
        if (cancelled) return;
        setReservation(result.data);

        const [listingDetail, reviews, txStatus, meetupStatus] = await Promise.all([
listingsService.getById(result.data.listingId), 
listingsService.getReviewsForUser(result.data.sellerId),
getTransactionStatus(reservationId),
listingsService.getMeetupStatus(reservationId)
        ])
          if (cancelled) return;
          setListing(listingDetail);
          setMeetup(meetupStatus);

          if (txStatus.success&& txStatus.data.transactionId)
          {
            const theReview = reviews.reviews.find(
              (r) => r.transactionId === txStatus.data.transactionId && r.reviewType === 'buyer_to_seller',
            ) ?? null;
            setReview(theReview);
          }} catch(err) {
            if(!cancelled) {
              setError(err instanceof Error ? err.message :
                'Failed to lload this order.');
              }}finally{ if(!cancelled) setIsLoading(false);

              }
            })();
            return() => { cancelled = true;}
          },[reservationId])

          if(!reservationId) {
            return <div className="p-8 text-center text-slate-500">
              No order specified.</div>}

            const itemPrice = listing?.price ?? 0;
            const totalPaid = itemPrice;
     return (
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
          <Link to ={backPath} className='text-blue-600 hover:underline'>{backLabel}</Link>
          <ChevronRight className='w-4 h-4 text-slate-400' />
          <span className="text-slate-600 font-semibold">{toRefNum(reservationId)}</span>
       </nav>
       {reservation &&(
        <span className={`text-xs px-4 py-1.5 rounded-full font-semibold ${
          reservation.reservationStatus === 'completed' 
          ? 'bg-emerald-200 text-emerald-800'
          : 'bg-amber-100 text-amber-700'}`}>
          {reservation.reservationStatus === 'completed' ? 'Completed' : reservation.reservationStatus}
          </span>
        )}
          </div>

          {isLoading && (
            <div className='flex flex-col items-center justify-center py-24 text-slate-500'>
              <Loader2 className='w-8 h-8 animate-spin mb-2'/>
             <p className = "text-sm">Fetching order details...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex-items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span className="text-sm font-medium">{error}
                </span>
                </div>
                  )}
          
          {!isLoading && !error && reservation && reservation.reservationStatus !== 'completed' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
              this reservation is not complete, full order details are'nt available.
              <button onClick={() => navigate(isBuyer
                ? `/buyer/reservations/${reservationId}`
                : `/seller/reservations/${reservationId}`,
              )} className='underline font-semibold'> the reservation page
              </button>
              .
              </div>
          )}
{!isLoading && !error && reservation && listing && (
 
  <div className='gid grid-cols-1 lg:gid-cols-2 gap-6'>
  <div className="space-y-6">
    <div className="bg-white rounded-xl p- border border-slate-200 shadow-sm">
      <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>
        Item
        </h3>
        <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-slate-900 rounded-lg overflow-hidden shrink-0 flex items-center"> 
             {listing.images?.[0]?.url ? (
              <img 
              src={listing.images[0].url}
              alt={listing.title}
              className='w-full h-full object-cover'  />
             ) : (
              <span className="text-xs text-white">
                No image
              </span>
             )}
             </div>
             <div className='space-y-1'>
              <h4 className='font-bold text-slate-800 text-base'>{listing.title}</h4>
             <p className='text-xs text-slate-500'>Condition: {listing.condition}</p>
            <p className='text-xs text-slate-500'>Category: {listing.category}</p>
            <p className='text-xs text-slate-500'>Module Code:{listing.courseCode || ''}</p>
          </div></div>

        </div>
          <div className='bg-white-rounded-xl p-5 border border-slate-200 shadow-sm'>
          <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>{isBuyer ? 'You reviewed:' : 'Buyer reviewed:'}</h3>
{review ? (<>

<div className='flex items-center gap-2 mb-2'>
            <div className='flex items-center gap-0.5'>
              {[...Array(5)].map((_, i) => (
<Star key={i} className={`w-4 h-4 ${ i<review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              ))}
              </div>
              <span className="text-xs text-slate-400">{review.rating} out of 5 stars </span>
              </div>
              {review.comment && (
                <p className='text-xs text-slate-600 leading-relaxed'>{review.comment}</p>
              )}
              </>
):(
  <p className='text-xs text-slate-500'>
    {isBuyer
    ? "You haven't reviewed this order yet" : "The buyer has not left a review for this sale yet."}
    </p>
)}
</div> </div>

      <div className='space-y-6'>
        <div className='bg-white-rounded-xl p-5 border border-slate-200 shadow-sm'>
          <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>Receipt</h3>
        <div className='space-y-3 text-xs'>
          <div className='flex justify-between text-slate-600'>
            <span>Item price</span>
  <span className='font-semibold text-slate-800'>{formatPrice(itemPrice)}</span>
  </div>

 <div className='flex justify-between text-slate-600'>
            <span>Platform fee</span>
  <span className='font-semibold text-slate-800'>nix </span>
  </div>
  <div className='flex justify-between text-slate-600'>
            <span>Payment method </span>
  <span className='font-semibold text-slate-800'>Payfast </span>
  </div>
      <div className='pt-3 border-t order-slate-100 flex justify-between font-bold text-slate-900 text-sm'>
<span>Total Paid</span>
   <span>{formatPrice(totalPaid)}</span>
      </div>
      </div>
      </div>
         <div className='bg-white-rounded-xl p-5 border border-slate-200 shadow-sm'>
          <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>Order Info</h3>
          <div className="space-y-3 text-xs">
            <div className='flex justify-between text-slate-600'>
               <span>Order ID</span>
                 <span className='font-semibold text-slate-800'>{toRefNum(reservationId)} </span>
                 </div>
                 <div className='flex justify-between text-slate-600'>
                  <span>Date Placed</span>
                  <span className='font-semibold text-slate-800'>
                    {formatDate(reservation.createdAt)}
                  </span>
                  </div>
                  <div className='flex justify-between text-slate-600'>
                     <span>Collected On</span>
                 <span className='font-semibold text-slate-800'>mock </span>
                 </div>
                   <div className='flex justify-between text-slate-600'>
                     <span>Meetup location</span>
                 <span className='font-semibold text-slate-800'>{meetup?.agreedLocationName ?? 'Not specified'} </span>
                 </div>
                 </div>
                 </div>

                     <div className='bg-white-rounded-xl p-5 border border-slate-200 shadow-sm'>
          <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2'>Actions</h3>
             <div className='space-y-3'>
              <button
              onClick={() => navigate(`/${isBuyer ? 'buyer' : 'seller'}/messages/${reservationId}`)}
              className='w-full py-2.5 bg-[#0F224A] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2  hover:bg-slate-800 transition-coours'>
                <MessageSquare className='w-4 h-4'/>
                <span> {isBuyer ? 'Message Seller' : 'Message Buyer'}</span></button>    
             <button 
          disabled
title="Not available yet"
className='w-full py-2.5 bg-white border border-slate-300 text-slate-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed'
          >
          <Download className='w-4 h-4'/>
                  <span>Download receipt</span>
                  </button>
                  <button
                  disabled
                  title="Not available yet"
                  className='w-full py-2.5 bg-white border border-rose-200 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed'>
<AlertTriangle className='w-4 h-4' />
          <span>Report an issue</span>
                    </button>
          </div>
          </div>
          </div>
          </div>
          )}
    </div>
    </main>
  );
}