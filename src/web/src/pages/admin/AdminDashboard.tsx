import { useNavigate } from 'react-router'
import {
  IconClock,
  IconAlertTriangle,
  IconFlag,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import type { CaseSummary } from '../../types/admin_disputes'
import { getTopDisputes, getTopVerifications, getTotalUsers } from '../../services/adminService'


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

function RiskPill({ level }: Readonly<{ level: 'High Risk' | 'Med Risk' }>) {
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${level === 'High Risk'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700'
        }`}
    >
      {level}
    </span>
  )
}

interface ListingRowProps {
  title: string
  meta: string
  risk: 'High Risk' | 'Med Risk'
}

function ListingRow({ title, meta, risk }: Readonly<ListingRowProps>) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-navy-700 flex-shrink-0 overflow-hidden">
        <img
          src={`https://placehold.co/48x48/e8eef5/b0bcd4?text=📚`}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
      </div>
      <RiskPill level={risk} />
      <button type='button' className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
        Approve
      </button>
      <button type='button' className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
        Reject
      </button>
    </div>
  )
}


interface VerificationRowProps {
  initials: string
  name: string
  meta: string
}

function VerificationRow({ initials, name, meta }: Readonly<VerificationRowProps>) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
      </div>
      <button type='button' className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
        Approve
      </button>
      <button type='button' className="border border-navy-700 text-navy-700 dark:text-white dark:border-white/30 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        Reject
      </button>
    </div>
  )
}

interface DisputeRowProps {
  title: string
  meta: string
}

function DisputeRow({ title, meta }: Readonly<DisputeRowProps>) {
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
      <button type='button' className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors">
        Review
      </button>
    </div>
  )
}


export default function AdminDashboard() {
  const navigate = useNavigate()

  const [pendingVerifications, setPendingVerifications] = useState<CaseSummary[]>([]);
  const [activeDisputes, setactiveDisputes] = useState<CaseSummary[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchDashboardData() {
      try {
        console.log("Fetching verifications...")
        const [verifications, disputes, users] = await Promise.all([
          getTopVerifications(5),
          getTopDisputes(5),
          getTotalUsers(),

        ]);
        

        if (active) {
          setPendingVerifications(verifications)
          setactiveDisputes(disputes)
          setTotalUsers(users)
          setLoading(false)
        }
      }
      catch {
        if (active) {
          setError('Failed to load dashboard data');
          setLoading(false)
        }
      }
    }
    fetchDashboardData();
    return () => { active = false; };

  }, []);
  if (loading) {
    return <p className="text-sm text-gray-600">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-sm text-gray-600">{error}</p>;
  }
  function getTimeAgo(ageHours: number): string {
    if (ageHours < 1) return 'Just now'
    if (ageHours < 24) return `${Math.round(ageHours)}h ago`
    const days = Math.round(ageHours / 24)
    return `${days}d ago`
  }
  const verificationRows = pendingVerifications.map((v) => ({
    initials: v.subjectInitials || '??',
    name: v.subjectName || 'Unknown',
    meta: `${v.title || 'Verification'} Submitted ${getTimeAgo(v.ageHours)}`,

  }));
  const disputeRows = activeDisputes.map((d) => ({
    title: d.title || 'Untitled dispute',
    meta: `Submitted ${getTimeAgo(d.ageHours)}`,
  }));
  const oldestVerificationAge = pendingVerifications.length > 0 ? getTimeAgo(pendingVerifications[0].ageHours) : 'None pending';

  const disputeSybtext = activeDisputes.length > 0 ? 'Needs attention' : 'All clear';
  return (
    <div className="space-y-6">

       <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
        Welcome, Admin
      </h1>


      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Pending Verifications"
          value={pendingVerifications.length}
          sub={`Oldest: ${oldestVerificationAge}`}
          subColor="text-amber-500"
          subIcon={<IconClock size={13} />}
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
          sub="12% this month"
          subColor="text-green-600"
          subIcon={<IconTrendingUp size={13} />}
        />
      </div>


      <div className="grid grid-cols-3 gap-4">


        <div className="col-span-2 bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-navy-700 dark:text-white">
              List Moderation Queue
            </h2>
            <button
              type='button'
              onClick={() => navigate('/admin/listings')}
              className="text-xs text-[#00aaff] hover:underline"
            >
              view all
            </button>
          </div>
{/*
          <ListingRow
            title="Chemistry Textbook - 3rd Ed"
            meta="CMY127 · R200 · Submitted 2hr ago"
            risk="High Risk"
          />
          <ListingRow
            title="HP Laptop 15' - Good condition"
            meta="UP · R4500 · Submitted 4h ago"
            risk="High Risk"
          />
          <ListingRow
            title="Calculus - Early Transcendentals"
            meta="WTW114 · R350 · Submitted 8h ago"
            risk="Med Risk"
          />
          <ListingRow
            title="Physics Lab Manual 2024"
            meta="PHY114 · R150 · Submitted 10h ago"
            risk="Med Risk"
          />

          this is all mock: we'll replace it
          */}
        </div>


        <div className="col-span-1 flex flex-col gap-4">


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
                view all
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
                view all
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
    </div>
  );
}