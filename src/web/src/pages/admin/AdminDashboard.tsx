import { useNavigate } from 'react-router'
import {
  IconAlertTriangle,
  IconClock,

  IconFlag,
  IconTrendingUp,
} from '@tabler/icons-react'
import { getTopDisputes, getTopVerifications, getTotalUsers } from '../../services/adminService'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'

interface StatCardProps {
  title: string
  value: number | string
  sub: string
  subColor?: string
  subIcon?: React.ReactNode
}

function StatCard({ title, value, sub, subColor = 'text-gray-500', subIcon }: Readonly<StatCardProps>) {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="bg-navy-700 px-4 py-2">
        <p className="text-white font-semibold text-sm">{title}</p>
      </div>
      <div className="px-4 py-4">
        <p className="text-3xl font-bold text-navy-700 dark:text-white">{value}</p>
        <div className={`flex items-center gap-1 mt-1 text-xs ${subColor}`}>
          {subIcon}
          <span>{sub}</span>
        </div>
      </div>
    </div>
  )
}

interface VerificationRowProps {
  id: string
  initials: string
  name: string
  meta: string
}

function VerificationRow({ id, initials, name, meta }: Readonly<VerificationRowProps>) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
      </div>
      <button type='button' onClick={() => navigate(`/admin/verifications/${id}`)} className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
        Review
      </button>
    </div>
  )
}

interface DisputeRowProps {
  id: string
  title: string
  meta: string
}

function DisputeRow({ id, title, meta }: Readonly<DisputeRowProps>) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-navy-700 flex-shrink-0 overflow-hidden">
        <img
          src={`https://placehold.co/48x48/e8eef5/b0bcd4?text=📦`}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
      </div>
      <button type='button' onClick={() => navigate(`/admin/disputes/${id}`)} className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors">
        Review
      </button>
    </div>
  )
}


export default function AdminDashboard() {
  const navigate = useNavigate()
  const {
    data: pendingVerifications = [],
    isLoading: loadingVerifications,
    error: verificationError,
  } = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'verifications'],
    queryFn: () => getTopVerifications(5),
  });

  const {
    data: activeDisputes = [],
    isLoading: loadingDisputes,
    error: disputesError,
  } = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'disputes'],
    queryFn: () => getTopDisputes(5),
  });

  const {
    data: totalUsers = 0,
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'totalUsers'],
    queryFn: () => getTotalUsers(),
  });

  const loading = loadingVerifications || loadingDisputes || loadingUsers;
  const error = verificationError || disputesError || usersError;
  if (loading) {
    return <p className="text-sm text-gray-600">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-sm text-gray-400">Failed to load dashboard data</p>;
  }
  function getTimeAgo(ageHours: number): string {
    if (ageHours < 1) return 'Just now'
    if (ageHours < 24) return `${Math.round(ageHours)}h ago`
    const days = Math.round(ageHours / 24)
    return `${days}d ago`
  }
  const verificationRows = pendingVerifications.map((v) => ({
    id: v.caseId,
    initials: v.subjectInitials || '??',
    name: v.subjectName || 'Unknown',
    meta: `${v.title || 'Verification'} Submitted ${getTimeAgo(v.ageHours)}`,

  }));
  const disputeRows = activeDisputes.map((d) => ({
    id: d.caseId,
    title: d.title || 'Untitled dispute',
    meta: `Submitted ${getTimeAgo(d.ageHours)}`,
  }));
  const oldestVerificationAge = pendingVerifications.length > 0 ? getTimeAgo(pendingVerifications[0].ageHours) : 'None pending';
  const slaBreached = activeDisputes.filter(d => d.slaBreached).length;
  const disputeSybtext = activeDisputes.length > 0 ? 'Needs attention' : 'All clear';
  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Verifications"
          value={pendingVerifications.length}
          sub={`Oldest: ${oldestVerificationAge}`}
          subColor="text-amber-500"
          subIcon={<IconClock size={13} />}
        />

        <StatCard
          title="SLA Breaches"
          value={slaBreached}
          sub={slaBreached > 0 ? "Needs urgent review" : "All within SLA"}
          subColor={slaBreached > 0 ? "text-red-500" : "text-green-600"}
          subIcon={<IconAlertTriangle size={13} />}
        />

        <StatCard
          title="Active Disputes"
          value={activeDisputes.length}
          sub={disputeSybtext}
          subColor="text-red-500"
          subIcon={<IconFlag size={13} />}
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          sub=""
          subColor="text-green-600"
          subIcon={<IconTrendingUp size={13} />}
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy-700 dark:text-white">
              Student Verifications
            </h2>
            <button
              type='button'
              onClick={() => navigate('/admin/verifications')}
              className="text-xs text-[#00aaff] hover:underline"
            >
              View All
            </button>
          </div>

          {
            verificationRows.length === 0 ? (
              <p className='text-sm text-gray-400'>No pending verifications.</p>
            ) :
              (
                (verificationRows.map((row, idx) =>
                  <VerificationRow key={idx} {...row} />
                ))
              )}

        </div>


        <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy-700 dark:text-white">
              Active Disputes
            </h2>
            <button
              type='button'
              onClick={() => navigate('/admin/disputes')}
              className="text-xs text-[#00aaff] hover:underline"
            >
              View All
            </button>
          </div>
          {disputeRows.length === 0 ? (
            <p className='text-sm text-gray-400'>No active disputes</p>
          ) : (
            disputeRows.map((row, idx) => (
              <DisputeRow key={idx} {...row} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}