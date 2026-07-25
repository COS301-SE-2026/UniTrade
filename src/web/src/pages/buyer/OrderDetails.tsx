import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { IconChevronRight, IconStar } from "@tabler/icons-react";
import { getReservationById, getTransactionStatus } from "../../services/reservationService";
import type { TransactionStatusResponse } from "../../services/reservationService";
import { listingsService } from "../../services/listingsService";
import type { ListingDetail, MeetupStatusResponse, UserReviewsResponse, Review } from "../../types/listing";
import type { Reservation } from "../../types/Reservations";

export default function OrderDetails() {
    const { reservationId } = useParams<{ reservationId: string }>();

    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [listing, setListing] = useState<ListingDetail | null>(null)
    const [meetup, setMeetup] = useState<MeetupStatusResponse | null>(null);
    const [transaction, setTransaction] = useState<TransactionStatusResponse | null>(null);
    const [sellerReviews, setSellerReviews] = useState<UserReviewsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const loadOrder = async () => {
            if (!reservationId) {
                setError('No order Id provided');
                setLoading(false);
                return;
            }

            try {
                const resResult = await getReservationById(reservationId);
                if (!resResult.success) throw new Error(resResult.error?.message || 'Failed to load reservation');
                const resData = resResult.data;
                setReservation(resData);

                const listingData = await listingsService.getById(resData.listingId);
                setListing(listingData);

                const [meetupResult, txResult, reviewsResult] = await Promise.allSettled([
                    listingsService.getMeetupStatus(reservationId),
                    getTransactionStatus(reservationId),
                    listingsService.getReviewsForUser(resData.sellerId),
                ]);

                if (meetupResult.status === 'fulfilled') setMeetup(meetupResult.value);
                if (txResult.status === 'fulfilled' && txResult.value.success) setTransaction(txResult.value.data);
                if (reviewsResult.status === 'fulfilled') setSellerReviews(reviewsResult.value);
            } catch (err: any) {
                setError(err.message || 'Failed to load order')
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [reservationId]);

    if (loading) {
        return <div className="text-slate-500">Loading order details....</div>;
    }

    if (error || !reservation || !listing) {
        return (
            <div className="text-center">
                <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
                <Link to="/buyer/orders" className="text-blue-600 hover:underline">
                    Back to My Orders
                </Link>
            </div>
        );
    }

    const formatDate = (iso?: string | null) =>
        iso ? new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '_';

    const formatDateTime = (iso?: string | null) =>
        iso
            ? new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ', ' +
            new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
            : '_';

    const myReview: Review | undefined = sellerReviews?.reviews.find(
        (r) =>
            r.reviewType === 'buyer_to_seller' &&
            r.reviewerId === reservation.buyerId &&
            (!transaction?.transactionId || r.transactionId === transaction.transactionId),
    );

    const sellerReceivedReviews = sellerReviews?.reviews.filter((r) => r.reviewType === 'buyer_to_seller') ?? [];
    const sellerAvgRating =
        sellerReceivedReviews.length > 0
            ? Math.round((sellerReceivedReviews.reduce((sum, r) => sum + r.rating, 0) /
                sellerReceivedReviews.length) * 10) / 10 : null;

    const timelineSteps = [
        { title: 'Listing reserved', time: formatDateTime(reservation.createdAt), done: true },
        { title: 'Meetup arranged', time: meetup ? formatDateTime(meetup.createdAt) : '_', done: !!meetup },
        { title: 'Buyer checked in', time: meetup?.buyerCheckedIn ? formatDateTime(meetup.buyerCheckedInAt) : '_', done: !!meetup?.buyerCheckedInAt },
        { title: 'Seller checked in', time: meetup?.sellerCheckedIn ? formatDateTime(meetup.sellerCheckedInAt) : '_', done: !!meetup?.sellerCheckedIn },
        { title: 'Payment completed', time: transaction?.transactionStatus === 'completed' ? 'Completed' : '_', done: transaction?.transactionStatus === 'completed' },
        { title: 'Order completed', time: reservation.reservationStatus === 'completed' ? 'Completed' : '_', done: reservation.reservationStatus === 'completed' },
    ];

    return (
        <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <nav className="flex items-center gap-2 text-sm font-medium">
                    <Link to="/buyer/orders" className="text-blue-600 hover:underline">
                        My Orders
                    </Link>
                    <IconChevronRight className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 font-semibold">{listing.title}</span>
                </nav>
                <span className="bg-emerald-100 text-emerald-700 text-xs px-4 py-1.5 rounded-full font-semibold">
                    {reservation.reservationStatus === 'completed' ? 'Completed' : reservation.reservationStatus}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            Item
                        </h3>
                        <div className="flex gap-5">
                            <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                                {listing.images?.[0] ? (
                                    <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-xs">
                                        No Image
                                    </div>

                                )}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-xl text-slate-900">{listing.title}</h4>
                                <p className="text-sm text-slate-600">Condition: {listing.condition}</p>
                                <p className="text-sm text-slate-600">Category: {listing.category}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            Order Timeline
                        </h3>
                        <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                            {timelineSteps.map((step, idx) => (
                                <div key={idx} className="relative">
                                    <div
                                        className={`absolute -left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${step.done ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`}
                                    />
                                    <p className={`text-sm font-medium ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{step.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            Your review
                        </h3>
                        {myReview ? (
                            <>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <IconStar
                                                key={i}
                                                className={`w-5 h-5 ${i < myReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-slate-500">{myReview.rating} out of 5 stars</span>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">{myReview.comment || 'No comment left.'}</p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">You haven't left a review for this order yet.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            Receipt
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Item price</span>
                                <span className="font-medium">R{listing.price.toLocaleString('en-ZA')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Platform fee</span>
                                <span className="font-medium">R0.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Payment method</span>
                                <span className="font-medium">PayFast</span>
                            </div>
                            <div className="pt-4 border-t border-slate-200 flex justify-between font-semibold text-base">
                                <span>Total Paid</span>
                                <span>R{listing.price.toLocaleString('en-ZA')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            Seller
                        </h3>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-navy-800 text-white rounded-full flex items-center justify-center font-bold">
                                {reservation.counterParty?.initials || '_'}
                            </div>
                            <div>
                                <p className="font-semibold">{reservation.counterParty?.name || 'Unknown seller'}</p>
                                <p className="text-xs text-slate-500">{listing.seller?.university || '_'}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mb-3 text-sm">
                            <span className="text-slate-600">Seller rating</span>
                            <span className="font-medium">{sellerAvgRating !== null ? `${sellerAvgRating} / 5` : 'No ratings yet'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total Sales</span>
                            <span className="font-medium">{sellerReceivedReviews.length}</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            Order Info
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Order ID</span>
                                <span className="font-medium">#{reservation.reservationId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Date Placed</span>
                                <span className="font-medium">{formatDate(reservation.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Collected On</span>
                                <span className="font-medium">{meetup ? formatDate(meetup.agreedTime) : '_'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Meetup location</span>
                                <span className="font-medium text-right">{meetup?.agreedLocationName || '_'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}