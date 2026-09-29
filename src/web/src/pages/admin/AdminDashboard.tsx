import { useNavigate, Link } from 'react-router'
import {
  IconAlertTriangle,
  IconClock,
  IconFlag,
  //IconTrendingUp,
} from '@tabler/icons-react'
import { getTopDisputes, getTopVerifications, getTotalUsers, getFlaggedListings,getUsers,getAuditEntries,getCaseCounts } from '../../services/adminService'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
 import type {ReactNode} from 'react'
//import { countDistinct } from 'firebase/firestore/pipelines'

 const EMPTY_GUID ='00000000-0000-0000-0000-000000000000'

 function timeAgo(ageHours: number): string {
  if(ageHours < 1) return 'just now'
  if(ageHours < 24) return `${Math.round(ageHours)}h ago`
  return `${Math.round(ageHours/24)}d ago`
 }

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
      Couldnt load {what}. Reload the page to try again.
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

interface VerificationRowProps {
  id: string
  initials: string
  name: string
  meta: string
}

function Panel({ title,viewAllTo,loading,error,what,isEmpty,emptyText,children }:Readonly<PanelProps>){
  let body: ReactNode
  if(loading)
  {
    body = (
      <div className="space-y-3">
        {[0,1,2].map((i)=>(
          <div key={i} className="flex items center gap-3">
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

function VerificationRow({ id, initials, name, meta }: Readonly<VerificationRowProps>) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 dark:text-white">{name}</p>
        <p className="text-xs text-gray-600 mt-0.5">{meta}</p>
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
        <p className="text-xs text-gray-600 mt-0.5">{meta}</p>
      </div>
      <button type='button' onClick={() => navigate(`/admin/disputes/${id}`)} className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors">
        Review
      </button>
    </div>
  )
}


export default function AdminDashboard() {
 }