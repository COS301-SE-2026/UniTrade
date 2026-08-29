import { useEffect, useState } from 'react'
import { IconSearch, IconFileText, IconEye } from "@tabler/icons-react"
import { getCases } from '../../services/adminService'
import { useNavigate } from 'react-router-dom'

export interface VerificationRow {
  id: string
  name: string
  initials: string
  degree: string
  submittedDate: string
  email: string
  slaStatus: string
  slaState: 'Overdue' | 'Due soon' | 'Normal'
  slaProgress: number
  slaMessage: string
  domain: string
  docName: string
  docSize: string
  docDate: string

}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA');
}

export default function AdminVerifications() {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'All' | 'Overdue' | 'Due soon' | 'Normal'>('All')
  const [sortBy, setSortBy] = useState<'Oldest First' | 'Newest First'>('Oldest First')
  const navigate = useNavigate();


  useEffect(() => {
    let active = true;

    getCases()
      .then((response) => {

        const verificationCases = response.filter((c) => c.type === 'verification');


        const enriched = verificationCases.map((summary) => {
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
            slaMessage = 'Past SLA - action required';

          }
          else if (remaining < 12) {
            slaState = 'Due soon';
            slaStatus = `${Math.round(remaining)}h left`;
            slaMessage = 'Approaching SLA';

          }
          else {
            slaState = 'Normal';
            slaStatus = `${Math.round(remaining)}h left`;
            slaMessage = 'On track';
          }

          return {
            id: summary.caseId,
            name: summary.subjectName ?? 'Unknown',
            initials: summary.subjectInitials ?? '??',
            degree: summary.subjectDegree ?? 'N/A',
            submittedDate: formatDate(summary.submittedAt),
            email: 'N/A',
            slaStatus,
            slaState,
            slaProgress: Math.round(progress),
            slaMessage,
            domain: 'Valid SA Uni domain',
            docName: 'Proof of Registration',
            docSize: 'Unknown size',
            docDate: formatDate(summary.submittedAt),
          };

        })

        if (active) {
          setRows(enriched);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load verifications');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = rows.filter((row) => {
    const matchSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.degree.toLowerCase().includes(searchQuery.toLowerCase())

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

  const numOverdue = rows.filter(r => r.slaState === 'Overdue').length
  const numDueSoon = rows.filter(r => r.slaState === 'Due soon').length
  const numPending = rows.length;
  const numApprovedToday = 0;

  if (loading) {
    return <p className='text-sm text-gray-400'>Loading verifications...</p>;
  }
  if (error) {
    return <p className='text-sm text-red-600'>{error}</p>;
  }

return (
  <div className='p-8 space-y-6 max-w-6xl'>
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Student Verifications
      </h1>
      <p className="text-xs text-gray-500 mt-0.5">
        Review students proof of registration and approve or reject account
      </p>
    </div>


    <div className="relative max-w-sm">
      <input
        type="text"
        placeholder='search...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1931]" />
      <IconSearch className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
    </div>

    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="text-xl font-bold text-gray-900">{numOverdue}</div>
        <div className="text-xs text-gray-500">Overdue</div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="text-xl font-bold text-gray-900">{numDueSoon}</div>
        <div className="text-xs text-gray-500">Due Soon</div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="text-xl font-bold text-gray-900">{numPending}</div>
        <div className="text-xs text-gray-500">Total Pending</div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="text-xl font-bold text-gray-900">{numApprovedToday}</div>
        <div className="text-xs text-gray-500">Approved Today</div>
      </div>
    </div>

    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => setFilter('All')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${filter === 'All'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          All({rows.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('Overdue')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${filter === 'Overdue'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Overdue({numOverdue})
        </button>

        <button
          type="button"
          onClick={() => setFilter('Due soon')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${filter === 'Due soon'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Due soon({numDueSoon})
        </button>

        <button
          type="button"
          onClick={() => setFilter('Normal')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${filter === 'Normal'
            ? 'bg-[#0a1931] text-white'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Normal({rows.length - numOverdue - numDueSoon})
        </button>
      </div>

      <div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'Oldest First' | 'Newest First')}
          className='px-4 py-1.5 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-600 focus:outline-none cursor-pointer'>
          <option value="Oldest First"> Sort: Oldest First</option>
          <option value="Newest First"> Sort: Newest First</option>
        </select>
      </div>
    </div>


    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-4">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs text-gray-400 font-normal">
            <th className="py-3 px-4">
              Student
            </th>
            <th className="py-3 px-4 text-center">
              Verification Status
            </th>
            <th className="py-3 px-4">
              Document
            </th>
            <th className="py-3 px-4 text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs">
          {sortedRows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-400">
                No verifications match your filters
              </td>
            </tr>
          ) : (
            sortedRows.map((ver) => (
              <tr key={ver.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#0a1931] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {ver.initials}
                  </div>
                  <div className="font-bold text-gray-900">
                    {ver.name}
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {ver.degree} &bull; {ver.email}
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${ver.slaState === 'Overdue'
                    ? 'bg-rose-200 text-rose-700'
                    : ver.slaState === 'Due soon'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'

                    }`}
                  >
                    {ver.slaState}
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-gray-500">
                    <span>{ver.slaStatus}</span>
                    <span>·</span>
                    <span>{ver.domain}</span>
                  </div>
                  <div className="w-full max-w-[120px] mx-auto mt-1 bg-gray-200 rounded-full h-1.5">
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
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-600 shrink-0">
                      <IconFileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{ver.docName}</div>
                      <div className="text-[10px] text-gray-400">
                        Uploaded {ver.docDate} &bull; {ver.docSize}
                      </div>
                    </div>
                  </div>
                </td>



                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={()=> navigate(`/admin/verifications/${ver.id}`)}
                      className="bg-[#0a1931] text-white px-5 py-1.5 rounded-full font-semibold hover:bg-[#153462] transition-colors cursor-pointer text-[10px] leading-tight"
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      className="bg-white text-[#0a1931] border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-[10px] leading-tight px-3 py-1.5"
                    >
                      <IconEye className="w-3.5 h-3.5" />
                      <span>View Doc</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)
}
