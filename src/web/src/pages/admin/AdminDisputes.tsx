import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {IconFlag} from '@tabler/icons-react'
import {StatusBadge} from './AdminReviewShared'
import {getMockDisputes, type DisputeCase, type DisputeType} from '../../types/mockAdmin'

const typeBadge: Record<DisputeType, {label: string; tone: 'red' | 'amber' | 'blue'}> ={

  'no-show': { label: 'No-show', tone: 'red' },
  'listing-quality': { label: 'Listing quality', tone: 'amber' },
  'report-listing': { label: 'Report listing', tone: 'blue' },

}
export default function AdminDisputes() {
  const navigate = useNavigate()
  const [disputes, setDisputes] = useState<DisputeCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMockDisputes().then((data) => {
      setDisputes(data)
      setLoading(false)
  })
}, [])


  return (
    <div>
      <h1 className = "text-2xl font-bold text-navy-700 dark:text-white mb-1">
        Disputes
      </h1>
      <p className = "text-sm text-gray-500 dark:text-white/50 mb-4">
      Active disputes waiting on a decision</p>

      <div className = "bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      {loading && <p className = "p-5 text-sm text-gray-400">
        Loading disputes...
       </p>
       }

       {!loading && disputes.length === 0 && (
          <p className="p-5 text-sm text-gray-400">No active disputes.</p>
        )}

        {!loading &&
          disputes.map((dispute) => {
            const badge = typeBadge[dispute.type]
            return (
              <button
                type="button"
                key={dispute.id}
                onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-lg flex-shrink-0">
                  {dispute.item.imageUrl && (
                    <img src={dispute.item.imageUrl} alt={dispute.item.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-700 dark:text-white truncate">
                    {dispute.item.title}
                    </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    #{dispute.id} · Filed by {dispute.filedBy} · {dispute.datePlaced}
                  </p>
                </div>
                <StatusBadge label={badge.label} tone={badge.tone} />
                <IconFlag size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            )
          })}
      </div>
    </div>
  )
}