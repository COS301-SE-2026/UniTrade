import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { useNavigate } from 'react-router'
import chemImg from '../../assets/bio-textbook.jpg'
import calcImg from '../../assets/calculas-textbook.jpg'
import laptopImg from '../../assets/hp-laptop.jpg'
import { type CaseType } from '../../types/admin_disputes'
import { getCases } from '../../services/adminService'
import { LoadingState } from '../../components/layout/Spinner'

export interface DisputeRow {
  id: string
  title: string
  buyerInitials: string
  sellerInitials: string
  timeAgo: string
  type: 'No-show' | 'Listing-quality' | 'Report'
  image: string
}


function getTimeAgo(ageHours: number): string {
  if (ageHours < 1) return 'Just now'
  if (ageHours < 24) return `${Math.round(ageHours)}h ago`
  const days = Math.round(ageHours / 24)
  return `${days}d ago`
}
type DisputeCaseType = "no_show" | "listing_quality" | "report_listing";
function getDisplayType(caseType: DisputeCaseType): 'No-show' | 'Listing-quality' | 'Report' {
  const map: Record<DisputeCaseType, 'No-show' | 'Listing-quality' | 'Report'> = {
    no_show: 'No-show',
    listing_quality: 'Listing-quality',
    report_listing: 'Report',

  }
  return map[caseType]
}
function getPlaceholder(type: CaseType): string {
  const map: Record<CaseType, string> = {
    verification: chemImg,
    no_show: chemImg,
    listing_quality: calcImg,
    report_listing: laptopImg,
  };
  return map[type] ?? chemImg;
}

export default function AdminDisputes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'No-show' | 'Listing-quality' | 'Report'>('all');
  const navigate = useNavigate();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: queryKeys.disputes(),
    queryFn: async () => {
      const response = await getCases();

      const disputeTypes: Set<CaseType> = new Set(['no_show', 'listing_quality', 'report_listing']);
      const cases = Array.isArray(response) ? response : response?.cases ?? [];
      const filtered = cases.filter(c => disputeTypes.has(c.type));

      return filtered.map(summary => ({
        id: summary.caseId,
        title: summary.title ?? 'Unknown listing',
        buyerInitials: summary.counterpartyInitials ?? '??',
        sellerInitials: summary.subjectInitials ?? '??',
        timeAgo: getTimeAgo(summary.ageHours),
        type: getDisplayType(summary.type as DisputeCaseType),
        image: getPlaceholder(summary.type as CaseType),

      })) as DisputeRow[];

    },
  })

  const filteredRows = rows.filter((row) => {
    const matchSearch = row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.buyerInitials.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.sellerInitials.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchSearch) return false;
    if (filter === 'all') return true
    return row.type === filter
  });
  const totalDisputes = rows.length
  const numNoShow = rows.filter(r => r.type === 'No-show').length
  const numListingQuality = rows.filter(r => r.type === 'Listing-quality').length
  const numReport = rows.filter(r => r.type === 'Report').length;


  if (isLoading) {
    return <LoadingState message="Loading disputes..." />
  }
  if (error) {
    return <p className='text-sm text-red-600'>{(error as Error).message || 'Failed to load disputes.'}</p>;
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">Active Disputes</h1>
        <p className="text-xs text-gray-600 mt-1">Manage all the Disputes in one place.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold text-navy-700 dark:text-white">{totalDisputes}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">Total Disputes</div>
        </div>

        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div>
            <div className="text-2xl font-bold text-navy-700 dark:text-white">{numNoShow}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">No Show</div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold text-navy-700 dark:text-white">{numListingQuality}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">Listing Quality</div>
        </div>

        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold text-navy-700 dark:text-white">{numReport}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">Report</div>
        </div>
      </div>
      <div className='relative max-w-xs w-full sm:w-auto'>
        <input type='text' placeholder='Search disputes...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full pl-4 pr-4 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1931]'
        />
      </div>

      <div className="flex items-center space-x-3 pt-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${filter === 'all'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          All
        </button>


        <button
          type="button"
          onClick={() => setFilter('No-show')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${filter === 'No-show'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          No-show
        </button>


        <button
          type="button"
          onClick={() => setFilter('Listing-quality')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${filter === 'Listing-quality'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Quality
        </button>


        <button
          type="button"
          onClick={() => setFilter('Report')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${filter === 'Report'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Report
        </button>
      </div>


      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-gray-600 font-normal">
              <th className="py-3 px-4">Listing</th>
              <th className="py-3 px-4 text-center">Dispute type</th>
              <th className="py-3 px-4 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={3} className='py-6 text-center text-gray-600'>No disputes match your criteria.</td>
              </tr>
            ) : (
              filteredRows.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <img
                      src={dispute.image}
                      alt={dispute.title}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-gray-900">{dispute.title}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        Buyer: {dispute.buyerInitials} &bull; Seller: {dispute.sellerInitials} &bull; {dispute.timeAgo}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${dispute.type === 'No-show'
                        ? 'bg-rose-200 text-rose-800'
                        : dispute.type === 'Listing-quality'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-200 text-sky-700'
                        }`}>
                      {dispute.type}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                        className="bg-[#0a1931] text-white px-5 py-1.5 rounded-full font-semibold hover:bg-[#153462] 
                transition-colors cursor-pointer">
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
    </div>
  );
}
