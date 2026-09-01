import { useNavigate, useParams } from 'react-router'
import { IconArrowLeft, IconStar } from "@tabler/icons-react"
import type { UserListing, UserReputation } from '../../types/admin_disputes'
import { useEffect, useState } from 'react'
import { getUserListings, getUserReputation } from '../../services/adminService'
import { imageUrl } from '../../services/listingsService'
import StatusPill from '../../components/layout/ui/StatusPill'
import type { ListingStatus } from '../../types/listing'

export interface Strike {
  id: string
  reason: string
  details: string
  date: string
  caseId: string
}

export interface Listing {
  id: string
  title: string
  status: ListingStatus
  imageUrl: string | null
}

export interface UserRecord {
  id: string
  name: string
  initials: string
  degree: string
  university?: string
  verificationStatus: 'Verified' | 'Pending' | string
  reputation: number
  strikesCount: number
  strikes: Strike[]
  recentListings: Listing[]
}
function getInitials(name: string) {
  return name.trim().split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

}
function mapVerificationStatus(status: string): 'Verified' | 'Pending' | string {
  if (status === 'verified') return 'Verified';
  if (status === 'pending') return 'Pending';
  return status;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapApiStatusToListingStatus(rawStatus: string): ListingStatus {
  const lower = rawStatus.toLowerCase();
  if (lower === 'live') return 'live';
  if (lower === 'pending') return 'pending';
  if (lower === 'draft') return 'draft';
  if (lower === 'rejected') return 'rejected';
  if (lower === 'reserved') return 'reserved';
  if (lower === 'sold') return 'sold';
  return 'draft';
}

function mapApiToUserRecord(api: UserReputation, listings: UserListing[]): UserRecord {
  return {
    id: api.userId,
    name: api.name,
    initials: getInitials(api.name),
    degree: api.degree,
    university: api.universityName,
    verificationStatus: mapVerificationStatus(api.verificationStatus),
    reputation: api.reputationScore,
    strikesCount: api.strikes.length,
    strikes: api.strikes.map((s) => ({
      id: s.strikeId,
      reason: s.reason,
      date: formatDate(s.createdAt),
      caseId: s.sourceCaseId,
      details: s.reason// api has no deeds
    })),
    recentListings: listings.map((l) => ({
      id: l.listingId,
      title: l.title,
      status: mapApiStatusToListingStatus(l.status),
      imageUrl: l.imageUrl ? imageUrl(l.imageUrl) : null,
    })),
  };
}

export default function ViewUser() {
  const { userId } = useParams<{ userId: string }>()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserRecord | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const fetchUserData = async () => {
      try {
        const [reputation, listings] = await Promise.all([
          getUserReputation(userId ?? ''),
          getUserListings(userId ?? '', 5),
        ]);
        if (active) {
          setUser(mapApiToUserRecord(reputation, listings));
          setLoading(false);
        }


      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load user');
          setLoading(false);

        }
      }
    };
    fetchUserData();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (

      <div className='p-8 max-w-6xl'>
        <p className='text-sm text-gray-400'>Loading user...</p>;

      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 space-y-4 max-w-6xl">
        <button
          type='button'
          onClick={() => navigate('/admin/users')}
          className="flex items-center space-x-1 text-sm text-gray-800 hover:text-black transition-colors cursor-pointer"
        >
          <IconArrowLeft size={16} />
          <span>Back to Users</span>
        </button>
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">{error || `User with ID ${userId} not found.`}
        </div>
      </div>
    )
  }

  return (

    <div className="max-w-6xl w-full mx-auto space-y-6">

      <button
        type="button"
        onClick={() => navigate('/admin/users')}
        className="flex items-center space-x-1 text-sm font-semibold text-gray-800 hover:text-black transition-colors cursor-pointer"
      >
        <IconArrowLeft className="w-4 h-4" />
        <span>Back to users</span>
      </button>

      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-[#0a1931] text-white flex items-center justify-center font-bold text-xl">
          {user.initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-xs text-gray-500">
            {user.degree} &bull; {user.university}

          </p>
          <div className="mt-1">
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium 
                ${user.verificationStatus === 'Verified'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
                }`}
            >
              {user.verificationStatus}
            </span>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Strikes</h2>
            <div className="flex items-baseline space-x-2 border-b border-gray-100 pb-4">
              <span className="text-3xl font-bold text-gray-900">{user.strikesCount}</span>
              <span className="text-xs text-gray-500">strikes on record</span>
            </div>
            <div className="space-y-4 pt-1">
              {user.strikes.length > 0 ? (
                user.strikes.map((strike: Strike) => (
                  <div key={strike.id} className="text-xs border-b border-gray-100 last:border-0 pb-3">
                    <div className="flex items-center justify-between font-bold text-gray-900">


                      <span>{strike.reason}</span>
                      <span className="text-sm text-gray-500 font-normal">{strike.date}</span>
                    </div>
                    <p className="text-gray-500 mt-0.5">{strike.details}</p>
                    <div className="mt-1 text-gray-500">
                      From case{' '}
                      <span className="font-bold text-[#0a1931] cursor-pointer hover:underline">
                        {strike.caseId}
                      </span>
                    </div>
                  </div>))
              ) : (
                <p className="text-xs text-gray-400 italic">No active strikes on record. </p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Reputation</h2>
            <div className="flex items-center space-x-1 text-amber-500">
              {
                [...Array(5)].map((_, index) => (
                  <IconStar key={index} className="w-5 h-5 fill-current " />
                ))
              }
            </div>
            <div className="text-3xl font-bold text-gray-900">{user.reputation}%</div>
        </div>
        </div>

          

        <div className="col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Recent listings</h2>
            <div className="space-y-3">
              {user.recentListings.map((listing: Listing) => (

                <div key={listing.id} className="flex items-center space-x-3">
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />

                  )}
                  <div>


                    <div className="text-xs font-bold text-gray-900">{listing.title}</div>
                    <StatusPill status={listing.status} />

                  </div>
                </div>
              ))}
            </div>
          </div>
        

    



          {/*<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Actions</h2>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full py-2 px-4 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Message user
              </button>

              <button
                type="button"
                className="w-full py-2 px-4 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                View all Listings
              </button>

            </div>

          </div>*/}
        </div>
      </div>
    </div>
  )
}