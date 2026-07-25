import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import CheckInModal from '../../components/CheckInModal';
import { ChevronLeft, User, MapPin, Calendar, Users, Lock, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listingsService } from '../../services/listingsService';
import { getReservationById } from '../../services/reservationService';
import LocationPicker from '../../components/layout/LocationPicker';
import { useEffect } from 'react';
import { getTransactionStatus, createTransactionRequest, type TransactionStatusResponse } from '../../services/reservationService';
import { connectionManager } from '../../services/realtime/connectionManager';

interface MeetupDetailsState {
  reservationId?: string;
  role?: 'buyer' | 'seller';
  counterpartyName?: string;
  counterpartyInitials?: string;
  meetupLocation?: string;
  meetupTime?: string;
  meetupLat?: number;
  meetupLng?: number;
  listingTitle?: string;
  listingPrice?: number;
}

function formatMeetupTime(iso?: string): string {
  if (!iso) return 'Time to be confirmed';
  const date = new Date(iso);
  return date.toLocaleDateString('en-ZA', {
    weekday: undefined,
    month: 'short',
    day: 'numeric',
  }) + `, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}
export default function MeetupDetails() {
  const navigate = useNavigate();

  const location = useLocation();

  const navState = (location.state as MeetupDetailsState | null) ?? {};
  const isSeller = navState.role === 'seller'
  const reservationId = navState.reservationId;
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatusResponse | null>(null);


  const { data: reservation, isLoading: isReservationLoading } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      const result = await getReservationById(reservationId!);
      if (!result.success) throw new Error(result.error.message ?? 'Failed to load reservation');
      return result.data;
    },
    enabled: !!reservationId,
  });

  const { data: meetup, isLoading: isMeetupLoading, refetch: refetchMeetup } = useQuery({
    queryKey: ['meetup', reservationId],
    queryFn: () => listingsService.getMeetupStatus(reservationId!),
    enabled: !!reservationId,
  });

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  useEffect(() => {
    if (!meetup) {
      return;
    }
    const updateCountdown = () => {
      const now = new Date();
      const opensAt = new Date(meetup.checkinWindowOpensAt);
      const closesAt = new Date(meetup.checkinWindowClosesAt);

      if (now < opensAt) {
        const diff = opensAt.getTime() - now.getTime();
        const minutes = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`Opens in ${minutes}m ${secs}s`);

      }
      else if (now > closesAt) {
        setTimeRemaining(`Check-in window closed`);
      }
      else {
        setTimeRemaining(null);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [meetup]);



  const { data: listing, isLoading: isListingLoading } = useQuery({
    queryKey: ['listing', reservation?.listingId],
    queryFn: () => listingsService.getById(reservation!.listingId),
    enabled: !!reservation?.listingId,
  });

  const isLoading = !!reservationId && (isReservationLoading || isMeetupLoading || (!!reservation && isListingLoading));

  const counterpartyName = navState.counterpartyName ?? 'Seller';
  const meetupLocation = meetup?.agreedLocationName ?? navState.meetupLocation ?? 'Location to be confirmed';
  const meetupTime = meetup?.agreedTime ?? navState.meetupTime;
  const price = navState.listingPrice ?? listing?.price;
  const listingTitle = navState.listingTitle ?? listing?.title;

  const meetupCoords =
    meetup?.agreedLatitude != null && meetup?.agreedLongitude != null
      ? { lat: meetup.agreedLatitude, lng: meetup.agreedLongitude }
      : navState.meetupLat != null && navState.meetupLng != null
        ? { lat: navState.meetupLat, lng: navState.meetupLng }
        : null;

  useEffect(() => {
    if (!reservationId || !isSeller) return;

    getTransactionStatus(reservationId).then((result) => {
      if (result.success) setTxStatus(result.data);
    });

    connectionManager.connect().catch((e) => console.error('connect failed', e));
    const off = connectionManager.onPaymentCompleted((e) => {
      if (e.reservationId !== reservationId) return;
      getTransactionStatus(reservationId).then((result) => {
        if (result.success) setTxStatus(result.data);
      });
    });
    return () => off();
  }, [reservationId, isSeller]);

  const handlePayNow = async () => {
    if (!reservationId) return;
    const result = await createTransactionRequest(reservationId);
    if (!result.success) {
      console.error('Failed to start payment:', result.error);
      return;
    }
    const { sandbox_url, fields } = result.data;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = sandbox_url;
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  if (!reservationId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-slate-600">
          We couldn't find the details for this meetup. Please go back to your conversation and try again.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 hover:bg-blue-900 text-white font-bold py-2.5 px-5 rounded-xl"
        >
          Go back
        </button>
      </div>
    );
  }

  if (isLoading && !navState.meetupLocation) {
    return <div className="p-8 text-center text-slate-500">Loading meetup details....</div>;
  }




  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="bg-navy-800 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div >
              <h1 className="text-xl text-white font-bold">Meetup Details</h1>
              <p className="text-xs text-white/80"> Review your transaction before completing payment</p>
            </div>

          </div>
          <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100">
            Confirmed Meetup
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isSeller ? 'Buyer' : 'Seller'}</h2>
              <div className=" flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 border border-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-800"> {counterpartyName}</p>
                  <p className="text-xs text-slate-500"> Verified {isSeller ? 'Buyer' : 'Seller'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Logistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>

                    <p className="font-semibold text-sm text-slate-800">Venue Location</p>

                    <p className="text-slate-600 text-sm">{meetupLocation}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-slate-800">Scheduled Time</p>
                    <p className="text-slate-600 text-sm"> {formatMeetupTime(meetupTime)} </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Meetup Location on Map
              </h2>
              {meetupCoords ? (
                <LocationPicker value={meetupCoords} height={300} />

              ) : (
                <div className="flex items-center justify-center h-[200px] bg-slate-50 rounded-2xl">
                  <p className="text-xs text-gray-400 italic px-6 text-center">
                    Map preview not available, location coordinates were not provided for this meetup.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Session Info</h2>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl max-w-sm">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">2 Attendees</p>
                  <p className="text-xs text-slate-500">{listingTitle ? `Collecting: ${listingTitle}` : 'Item collection'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:top-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
              <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
                Payment Summary
              </h3>


              <div className=" pt-1 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-base">Price</span>
                <span className="font-black text-xl text-blue-950">{price != null ? `R${price.toFixed(2)}` : 'R-'}</span>
              </div>




              <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/50 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 leading-relaxed">
                  <strong>Safety Guarantee:</strong>{' '}
                  {!isSeller ? (
                    <>
                      Your funds are held securely by UniTrade and will only be released once you supply a PIN to{' '}
                      {counterpartyName} at the physical meetup.
                    </>
                  ) : (
                    <>
                      Your funds are held securely by UniTrade and will only be released to you once you enter the PIN given by{' '}
                      {counterpartyName} at the physical meetup.
                    </>
                  )}
                </p>
              </div>
              {!isSeller ? (
                <div className="space-y-3">
                  {!meetup?.buyerCheckedIn ? (
                    <>
                      <button
                        onClick={() => setShowCheckIn(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                      >
                        <MapPin className="w-4 h-4" /> Check In at Meetup
                      </button>
                      {timeRemaining && <p className="text-sm text-slate-500">{timeRemaining}</p>}
                      <p className="text-center text-[11px] text-slate-400">
                        Check in once you've arrived to unlock payment.
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handlePayNow}
                        disabled={!meetup?.paymentUnlocked || price == null}
                        className="w-full bg-blue-950 hover:bg-blue-900 disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                      >
                        <Lock className="w-4 h-4" /> Pay {price != null ? `R${price.toFixed(2)}` : ''}
                      </button>
                      <p className="text-center text-[11px] text-slate-400">
                        By paying you agree to the UniTrade Payment policies.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!meetup?.sellerCheckedIn ? (
                    <button
                      onClick={() => setShowCheckIn(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                    >
                      <MapPin className="w-4 h-4" /> Check In at Meetup
                    </button>
                  ) : txStatus?.transactionStatus === 'completed' && txStatus?.pinStatus === 'pending' ? (
                    <button
                      onClick={() => navigate('/payment/buyer-pin', { state: { reservationId } })}
                      className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                    >
                      <Lock className="w-4 h-4" /> Enter Buyer's PIN
                    </button>
                  ) : txStatus?.pinStatus === 'confirmed' ? (
                    <p className="text-center text-sm text-emerald-700 bg-emerald-50 rounded-xl py-3 px-4">
                      Transaction complete.
                    </p>
                  ) : (
                    <p className="text-center text-sm text-slate-500 bg-slate-50 rounded-xl py-3 px-4">
                      Waiting for the buyer to complete payment.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      {showCheckIn && (
        <CheckInModal
          reservationId={reservationId}
          meetupLocation={meetupLocation}
          onClose={() => {
            setShowCheckIn(false);
            refetchMeetup();
          }}
        />
      )}
    </div>
  );
}