import {  useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { useNavigate, useSearchParams } from 'react-router'
import chemImg from '../../assets/bio-textbook.jpg'
import calcImg from '../../assets/calculas-textbook.jpg'
import laptopImg from '../../assets/hp-laptop.jpg'
import { type CaseType } from '../../types/admin_disputes'
import { getCases } from '../../services/adminService'
import { LoadingState } from '../../components/layout/Spinner'
import { imageUrl } from '../../services/listingsService'
import { IconScaleOutline,IconUserOff,IconRosetteDiscountCheck,IconReportAnalytics  } from '@tabler/icons-react'
export interface DisputeRow {
  id: string
  title: string
  buyerInitials: string
  sellerInitials: string
  timeAgo: string
  type: 'No-show' | 'Listing-quality' | 'Report'
  status: string
  image: string
}

const PAGE_SIZE = 6;

type Filter = "All" | "No-show" | "Quality" | "Report";
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
    const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('All');
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
        status: summary.status,
        image: summary.imageUrl ? imageUrl(summary.imageUrl): getPlaceholder(summary.type as CaseType),

      })) as DisputeRow[];

    },
  })

  const filteredRows = rows.filter((row) => {
    const matchSearch = row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.buyerInitials.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.sellerInitials.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchSearch) return false;
    if (filter === 'All') return true
    return row.type === filter
  });
  const totalDisputes = rows.length
  const numNoShow = rows.filter(r => r.type === 'No-show').length
  const numListingQuality = rows.filter(r => r.type === 'Listing-quality').length
  const numReport = rows.filter(r => r.type === 'Report').length;

  const listKey = `${filter}|${searchQuery}`;
  const [lastListKey, setLastListKey] = useState(listKey);
  if (lastListKey !== listKey) {
    setLastListKey(listKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

 const filters: { label: Filter; count: number }[] = [
    { label: "All", count: totalDisputes },
    { label: "No-show", count: numNoShow },
    { label: "Quality", count: numListingQuality },
    { label: "Report", count: numReport}
  ];
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
        <p className="text-sm text-gray-400 mt-1">Manage all the Disputes in one place.</p>
      </div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Disputes",
            value: totalDisputes,
            icon: <IconScaleOutline size={20} />,
          },
          {
            label: "No Show",
            value: numNoShow,
            icon: <IconUserOff size={20} />,
          },
          {
            label: "Listing Quality",
            value: numListingQuality,
            icon: <IconRosetteDiscountCheck size={20} />,
          },
          {
            label: "Report",
            value: numReport,
            icon: <IconReportAnalytics size={20} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3"
          >
            <span className="text-navy-700 dark:text-white">{stat.icon}</span>
            <div>
              <div className="text-2xl font-bold text-navy-700 dark:text-white">
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        {/*<div className='relative max-w-xs w-full sm:w-auto'>
          <input type='text' placeholder='Search disputes...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-4 pr-4 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-navy-700'
          />
          </div>*/}
        <div className="flex items-center space-x-2 md:space-x-3 overflow-x-auto pb-1 sm:pb-0">
          {filters.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setFilter(label)
                setCurrentPage(1);
              }}
              className={`px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap
                ${filter === label
                  ? "bg-navy-700 text-white border-navy-700 dark:bg-white dark:text-navy-900"
                  : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
           <tr className=" border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-semibold uppercase">
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
              paginatedRows.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <img
                      src={dispute.image}
                      alt={dispute.title}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <div>
                      <div className="text-sm font-semibold text-navy-700 dark:text-white truncate">{dispute.title}</div>
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
                          : 'bg-sky-100 text-sky-700'
                        }`}>
                      {dispute.type}
                    </span>
                    {dispute.status === 'resubmission' && (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                        Resubmitted
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                        className="bg-navy-700 text-white px-5 py-1.5 rounded-full font-semibold hover:bg-navy-500 
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
    
     {filteredRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 whitespace-nowrap">
            Showing {(safePage - 1) * PAGE_SIZE + 1}-
            {Math.min(safePage * PAGE_SIZE, filteredRows.length)} of{" "}
            {filteredRows.length} disputes
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold border transition-colors ${safePage === page
                    ? "bg-navy-700 text-white border-navy-700"
                    : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50"
                    }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
