import { useState } from 'react'
import { IconFileText, IconEye, IconCalendarX, IconHourglass, IconCalendarDue, IconCircleCheck } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { getCases } from '../../services/adminService'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiUrl } from '../../config'
import { queryKeys } from '../../lib/queryKeys'
import { LoadingState } from '../../components/layout/Spinner'

type Filter = "All" | "Overdue" | "Due soon" | "Normal";

export interface VerificationRow {
  id: string
  name: string
  initials: string
  degree: string
  year: number | null
  submittedDate: string
  slaStatus: string
  slaState: 'Overdue' | 'Due soon' | 'Normal'
  slaProgress: number
  slaMessage: string
  domain: string
  docName: string
  docDate: string
  docUrl: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA');
}

export default function AdminVerifications() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const [filter, setFilter] = useState<Filter>("All");
  const [sortBy, setSortBy] = useState<'Oldest First' | 'Newest First'>('Oldest First');
  const navigate = useNavigate();

  const { data: rows = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.verifications(),
    queryFn: async (): Promise<VerificationRow[]> => {
      const response = await getCases();
      const cases = Array.isArray(response) ? response : response.cases;
      const verificationCases = cases.filter((c) => c.type === 'verification');

      return verificationCases.map((summary) => {
        const ageHours = summary.ageHours;
        const slaHours = summary.slaHours;
        const remaining = Math.max(0, slaHours - ageHours);
        const progress = Math.min(100, (ageHours / slaHours) * 100);

        let slaState: 'Overdue' | 'Due soon' | 'Normal';
        let slaStatus: string;
        let slaMessage: string;

        if (ageHours > slaHours) {
          slaState = 'Overdue';
          slaStatus = `${Math.round(ageHours - slaHours)}h overdue`;
          slaMessage = 'Past SLA-action required';
        } else if (remaining < 12) {
          slaState = 'Due soon';
          slaStatus = `${Math.round(remaining)}h left`;
          slaMessage = 'Approaching SLA';
        } else {
          slaState = 'Normal';
          slaStatus = `${Math.round(remaining)}h left`;
          slaMessage = 'On track';
        }

        return {
          id: summary.caseId,
          name: summary.subjectName ?? 'Unknown',
          initials: summary.subjectInitials ?? 'N/A',
          degree: summary.subjectDegree ?? 'N/A',
          year: summary.subjectYear ?? null,
          submittedDate: formatDate(summary.submittedAt),
          slaStatus,
          slaState,
          slaProgress: Math.round(progress),
          slaMessage,
          domain: 'Valid SA Uni domain',
          docName: summary.hasDocument ? 'Proof of registration' : 'Not yet submitted',
          docDate: formatDate(summary.submittedAt),
          docUrl: summary.hasDocument
            ? `${getApiUrl()}/admin/cases/${summary.caseId}/document`
            : null,
        };
      });
    }
  });

  const filteredRows = rows.filter((row) => {
    const matchSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.degree.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (filter === 'Overdue') return row.slaState === 'Overdue';
    if (filter === 'Due soon') return row.slaState === 'Due soon';
    if (filter === 'Normal') return row.slaState === 'Normal';
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const dateA = new Date(a.submittedDate).getTime();
    const dateB = new Date(b.submittedDate).getTime();
    return sortBy === 'Oldest First' ? dateA - dateB : dateB - dateA;
  });

  const numOverdue = rows.filter(r => r.slaState === 'Overdue').length;
  const numDueSoon = rows.filter(r => r.slaState === 'Due soon').length;
  const numPending = rows.length;
  const numNormal = rows.length - numOverdue - numDueSoon;
  const numTotal = rows.length;
  const numApprovedToday = 0;

  const filters: { label: Filter; count: number }[] = [
    { label: "All", count: numTotal },
    { label: "Overdue", count: numOverdue },
    { label: "Due soon", count: numDueSoon },
    { label: "Normal", count: numNormal }
  ];

  if (loading) {
    return <LoadingState message="Loading Verifications... " />;
  }
  if (error) {
    return <p className='text-sm text-red-600'>Failed to load verifications</p>;
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800 dark:text-white">
          Student Verifications
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Review students proof of registration and approve or reject account
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Overdue",
            value: numOverdue,
            icon: <IconCalendarX size={20} />,
          },
          {
            label: "Due Soon",
            value: numDueSoon,
            icon: <IconHourglass size={20} />,
          },
          {
            label: "Total Pending",
            value: numPending,
            icon: <IconCalendarDue size={20} />,
          },
          {
            label: "Approved Today",
            value: numApprovedToday,
            icon: <IconCircleCheck size={20} />,
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center space-x-2 md:space-x-3 overflow-x-auto pb-1 sm:pb-0">
          {filters.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
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

        <div>
          <select
            aria-label="Sort disputes"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'Oldest First' | 'Newest First')}
            className='px-4 py-1.5 bg-white dark:bg-navy-800 border border-gray-300 dark:border-white/10 rounded-full text-xs font-medium text-gray-600 dark:text-white/80 focus:outline-none cursor-pointer w-full sm:w-auto'
          >
            <option value="Oldest First">Sort: Oldest First</option>
            <option value="Newest First">Sort: Newest First</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">

        <div className="hidden lg:flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-navy-900/50 text-xs font-semibold text-gray-400 uppercase">
          <div className="flex-1 min-w-0">Student</div>
          <div className="w-48 text-center shrink-0">Verification Status</div>
          <div className="flex-1 min-w-0">Document</div>
          <div className="w-48 text-right shrink-0">Actions</div>
        </div>
        <div>
          {sortedRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {numTotal === 0
                ? "Nothing is waiting for review"
                : "No verifications match your filters"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/10">
              {sortedRows.map((ver) => (
                <div
                  key={ver.id}
                  className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 lg:flex-1 lg:min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0a1931] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {ver.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                        {ver.name}
                      </p>
                      <p className="text-[10px] font-normal text-gray-400 mt-0.5">
                        {ver.degree}{ver.year ? `, Y${ver.year}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="lg:w-48 shrink-0 flex flex-col items-start lg:items-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 lg:hidden">
                      Verification Status
                    </p>
                    <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-medium ${ver.slaState === 'Overdue'
                      ? 'bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : ver.slaState === 'Due soon'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                      {ver.slaState}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{ver.slaStatus}</span>
                      <span>·</span>
                      <span>{ver.domain}</span>
                    </div>
                    <div className="w-full max-w-[120px] mt-1 bg-gray-200 dark:bg-white/10 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${ver.slaState === 'Overdue'
                          ? 'bg-red-600'
                          : ver.slaState === 'Due soon'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          }`}
                        style={{ width: `${ver.slaProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="lg:flex-1 lg:min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 lg:hidden">
                      Document
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-sky-100 dark:bg-sky-950/50 rounded-lg text-sky-600 dark:text-sky-400 shrink-0">
                        <IconFileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 dark:text-white text-xs truncate">
                          {ver.docName}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Uploaded {ver.docDate}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-white/10 lg:w-48">
                    <div className="flex items-center justify-start lg:justify-end gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/verifications/${ver.id}`)}
                        className="bg-navy-700 text-white rounded-full font-semibold hover:bg-navy-500 transition-colors text-xs px-3 sm:px-5 py-2 flex-1 whitespace-nowrap"
                      >
                        Review
                      </button>

                      {ver.docUrl ? (
                        <a
                          href={ver.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white dark:bg-navy-800 text-[#0a1931] dark:text-white border border-gray-300 dark:border-white/10 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs px-3 sm:px-5 py-2 inline-flex items-center justify-center gap-1 flex-1 whitespace-nowrap"
                        >
                          <IconEye className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 rounded-full text-xs px-3 sm:px-5 py-2 inline-flex items-center justify-center gap-1 cursor-not-allowed flex-1 whitespace-nowrap">
                          <IconEye className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}