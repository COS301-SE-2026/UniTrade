import { useNavigate, Link } from 'react-router'
import {
  IconAlertTriangle,
  IconClock,
  IconFlag,
  IconUsers,
  IconGavel,
  //IconTrendingUp,
} from '@tabler/icons-react'
import { getTopDisputes, getTopVerifications, getTotalUsers, getFlaggedListings,getUsers,getAuditEntries,getCaseCounts } from '../../services/adminService'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
 import type {ReactNode} from 'react'
//import { countDistinct } from 'firebase/firestore/pipelines'

 const EMPTY_GUID ='00000000-0000-0000-0000-000000000000'

 /*function timeAgo(ageHours: number): string {
  if(ageHours < 1) return 'just now'
  if(ageHours < 24) return `${Math.round(ageHours)}h ago`
  return `${Math.round(ageHours/24)}d ago`
 }
  */

 function shortAge(ageHours:number): string{
    if(ageHours < 1) return '1h'
  if(ageHours < 24) return `${Math.round(ageHours)}h`
  return `${Math.round(ageHours/24)}d`
 }

 function actorLabel(actorId?: string): string {
  if(!actorId || actorId === EMPTY_GUID) return 'System'
  return 'Admin'
 }

 function Skeleton({className=''}:Readonly<{className?: string}>){
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />

 }

 function ErrorNote({what}:Readonly<{what: string}>) {
  return(
    <p className="text-sm text-red-700 dark:text-red-400" role="alert">
      Could not load {what}. Reload the page to try again.
      </p>
  )
 }

 function Empty({children}: Readonly<{children: ReactNode}>){
  return <p className="text-sm text-gray-600 dark:text-gray-300">{
    children}</p>
 }

interface StatCardProps {
  title: string
  to: string
  loading: boolean
  error:boolean
  value?: number | string
  sub?: string
  subColor?: string
  icon?: ReactNode
  badge?: string
}

function StatCard({ title,to,loading,error, value, sub, subColor = 'text-gray-600', icon,badge}: Readonly<StatCardProps>) {
  return (
  <Link
  to={to}
 className="block bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-navy-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600 transition-colors">
      <div className="bg-navy-700 px-4 py-2 flex items-center justify-between">
        <p className="text-white font-semibold text-sm">{title}</p>

        {badge && <span className="bg-red-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">{badge}</span>}
        
      </div>
      <div className="px-4 py-4">
        {loading ? (<>

        <Skeleton className="h-8 w-16"
         />
<Skeleton className="h-3 w-28 mt-2"
         />
        </>
        ): error ? (
          <p className='text-xs text-red-700 dark:text-red-400'>Unavailable</p>
        ) : (
          <>

        <p className="text-3xl font-bold text-navy-700 dark:text-white">{value}</p>
        {sub && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${subColor}`}>
          {icon}
          <span>{sub}</span>
        </div> 
        )}
        </>
        )}  
      </div>
    </Link>
    
    )}

interface PanelProps {
  title: string
  viewAllTo?: string 
  loading: boolean
  error: boolean
  what:string
  isEmpty: boolean
  emptyText: string
  children: ReactNode
}



function Panel({ title,viewAllTo,loading,error,what,isEmpty,emptyText,children }:Readonly<PanelProps>){
  let body: ReactNode
  if(loading)
  {
    body = (
      <div className="space-y-3">
        {[0,1,2].map((i)=>(
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-7 w-16 rounded-full" />
              </div>
        ))}
      </div>
    )
  }
  else if(error){
    body=<ErrorNote what={what} />
  }
  else if (isEmpty) {
    body = <Empty>{emptyText}</Empty>
  } else{
    body =children
  }

  return (
    <section className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className='text-base font-semibold text-navy-700 dark:text-white'>{title}</h2>
        {viewAllTo && (
          <Link to={viewAllTo} className="text-xs text-sky-700 hover:underline">View all </Link>
        )}
      </div>
      {body}
      </section>
  )
  }

  function ReviewButton({ to}: Readonly<{ to: string }>) {
const navigate=useNavigate()
return(
  <button
  type="button"
  onClick={() => navigate(to)}
  className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex-shrink-0">
    Review</button>
)
  }

  const rowClass="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0"




export default function AdminDashboard() {
  const verifications = useQuery({
    queryKey: [...queryKeys.verifications(), 'dashboard'],
    queryFn: () => getTopVerifications(5),
  })

  const disputes = useQuery({
    queryKey: [...queryKeys.disputes(), 'dashboard'],
    queryFn: () => getTopDisputes(5),
  })


    const flagged = useQuery({
    queryKey: [...queryKeys.flaggedListings(), 'dashboard'],
    queryFn: () => getFlaggedListings(),
  })

    const totalUsers = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'totalUsers'],
    queryFn: () => getTotalUsers(),
  })

    const verifiedUsers = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'usersVerified'],
    queryFn: async() => (await getUsers({ verificationStatus: 'verified', limit:1})).total,
  })

   const pendingUsers = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'usersPending'],
    queryFn: async() => (await getUsers({ verificationStatus: 'pending',limit:1})).total,
  })

      const strikeUsers = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'usersWithStrikes'],
    queryFn: () => getUsers({hasStrikes:true, limit:1}),
  })

      const audit = useQuery({
    queryKey: ['admin','audit','recent'],
    queryFn: () => getAuditEntries({limit:20}),
  })

      const counts = useQuery({
    queryKey: [...queryKeys.dashboardStats(), 'caseCounts'],
    queryFn: getCaseCounts,
  })

  const vList =verifications.data ?? []
  const dList = disputes.data ?? []
  const fList = flagged.data ??[]
  const aList = audit.data?.entries ?? []

  const cc = counts.data
  const plus = cc?.truncated ? '+' : ''
  const slaBreached = cc?.slaBreached ?? 0
  const strikeCount = strikeUsers.data?.total ?? 0

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Pending Verifications"
          to="/admin/verifications"
          loading={counts.isLoading}
          error={counts.isError}
          value={ `${cc?.pendingVerifications ?? 0}${plus}`}
          sub={
            cc?.oldestVerificationHours != null
            ?
            `Oldest ${shortAge(cc.oldestVerificationHours)}`
          :'Nothing waiting'
        }
          subColor={cc?.oldestVerificationHours !=null ? "text-amber-700": 'text-green-700'}
          icon={<IconClock size={13} />}
        />

        <StatCard
          title="Active disputes"
          to="/admin/disputes"
          loading={counts.isLoading}
          error={counts.isError}
          value={ `${cc?.activeDisputes?? 0}${plus}`}
          sub={slaBreached > 0 ? `${slaBreached} past SLA` : (cc?.activeDisputes ?? 0) > 0 ? 'All within SLA': 'Nothing open'}
            
          subColor={slaBreached > 0 ?  "text-red-700" :'text-green-700'}
          icon={<IconAlertTriangle size={13} />}
          badge={slaBreached > 0 ? 'SLA breached' : undefined}
        />


          <StatCard
          title="Flagged listings"
          to="/admin/listings?status=under_review"
          loading={flagged.isLoading}
          error={flagged.isError}
          value={ fList.length}
          sub={
             fList.length>0 ? 'Under review' :'Nothing flagged'}
          subColor={ fList.length >0 ? "text-amber-700": 'text-green-700'}
          icon={<IconFlag size={13} />}
          />

          <StatCard
          title="Total users"
          to="/admin/users"
          loading={totalUsers.isLoading}
          error={totalUsers.isError}
          value={totalUsers.data ?? 0}
          sub={
             verifiedUsers.data !== undefined && pendingUsers.data !== undefined
            ? `${verifiedUsers.data} verified, ${pendingUsers.data} pending`: undefined}
          
         
          icon={<IconUsers size={13} />}
          />

      <StatCard
          title="Users with strikes"
          to="/admin/users?hasStrikes=true"
          loading={strikeUsers.isLoading}
          error={strikeUsers.isError}
          value={strikeCount}
          sub={strikeCount > 0 ? 'Have active strikes' : 'No strikes issued'}
          subColor={strikeCount > 0 ? 'text-amber-700' : 'text-green-700'}
          icon={<IconGavel size={13} />}
        />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          title="Student verifications"
          viewAllTo="/admin/verifications"
          loading={verifications.isLoading}
          error={verifications.isError}
          what="verifications"
          isEmpty={vList.length === 0}
          emptyText="All clear, no pending verifications."
        >
          {vList.slice(0, 5).map((v) => (
            <div key={v.caseId} className={rowClass}>
              <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {v.subjectInitials || '??'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">{v.subjectName || 'Unknown'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Waiting {shortAge(v.ageHours)}
                  {v.submittedAt ? ` (submitted ${new Date(v.submittedAt).toLocaleDateString()})` : ''}
                </p>
              </div>
              <ReviewButton to={`/admin/verifications/${v.caseId}`} />
            </div>
          ))}
        </Panel>
 
        <Panel
          title="Active disputes"
          viewAllTo="/admin/disputes"
          loading={disputes.isLoading}
          error={disputes.isError}
          what="disputes"
          isEmpty={dList.length === 0}
          emptyText="All clear, no active disputes."
        >
          {dList.slice(0, 5).map((d) => (
            <div key={d.caseId} className={rowClass}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">{d.title || 'Untitled dispute'}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {d.type && (
                    <span className="text-[11px] bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full">
                      {String(d.type).replace(/_/g, ' ')}
                    </span>
                  )}
                  {/* <span className="text-xs text-gray-600 dark:text-gray-300">{timeAgo(d.ageHours)}</span> */}
                  {d.slaBreached && (
                    <span className="text-[11px] bg-red-600 text-white font-semibold px-2 py-0.5 rounded-full">SLA breached</span>
                  )}
                </div>
              </div>
              <ReviewButton to={`/admin/disputes/${d.caseId}`} />
            </div>
          ))}
        </Panel>
 
        <Panel
          title="Flagged listings"
          viewAllTo="/admin/listings?status=under_review"
          loading={flagged.isLoading}
          error={flagged.isError}
          what="flagged listings"
          isEmpty={fList.length === 0}
          emptyText="All clear, no listings under review."
        >
          {fList.slice(0, 5).map((l) => {
            const risk = String(l.riskLevel ?? 'low')
            const riskStyle =
              risk === 'high'
                ? 'bg-red-600 text-white'
                : risk === 'medium'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-800'
            return (
              <div key={l.listingId} className={rowClass}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">{l.title || 'Untitled listing'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${riskStyle}`}>{risk} risk</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{l.reasons?.[0] ?? 'No reason recorded'}</span>
                  </div>
                </div>
                <ReviewButton to={`/admin/listings/flagged/${l.listingId}`} />
              </div>
            )
          })}
        </Panel>
      </div>
 
      <Panel
        title="Recent activity"
        loading={audit.isLoading}
        error={audit.isError}
        what="activity"
        isEmpty={aList.length === 0}
        emptyText="No activity recorded yet."
      >
        {aList.map((e) => {
          const who = actorLabel(e.actorId)
          return (
            <div key={e.id} className={rowClass}>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  who === 'System' ? 'bg-gray-200 text-gray-800' : 'bg-sky-100 text-sky-900'
                }`}
              >
                {who}
              </span>
              <p className="flex-1 min-w-0 text-sm text-navy-700 dark:text-white truncate">
                {String(e.action).replace(/_/g, ' ')}
                {e.entityType ? `, ${e.entityType}` : ''}
              </p>
              <time className="text-xs text-gray-600 dark:text-gray-300 flex-shrink-0" dateTime={e.timestamp}>
                {new Date(e.timestamp).toLocaleString()}
              </time>
            </div>
          )
        })}
      </Panel>
    </div>
  )}