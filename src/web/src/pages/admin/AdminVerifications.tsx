import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {getMockVerifications, type VerificationCase } from '../../types/mockAdmin'

export default function AdminVerifications() {

  const navigate = useNavigate()
  const [verifications, setVerifications] = useState<VerificationCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMockVerifications().then((data) => {
      setVerifications(data)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h1 className = "font-['Fraunces'] font-normal text-[32px] text-gray-800">
        Verifications
      </h1>
      <p className = "text-sm text-gray-500 dark:text-white/50 mb-4">
      Student Accounts waiting on document review 
      </p>

      <div className = "bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      {loading && <p className = "p-5 text-sm text-gray-400">
        Loading verifications...
      </p>
      }

      {!loading && verifications.length === 0 && (
          <p className="p-5 text-sm text-gray-400">No pending verifications.</p> //dont forget to add taht spinner once everything is integrated 
        )}

        {!loading &&
          verifications.map((record) => (
            <button
              type="button"
              key={record.id}
              onClick={() => navigate(`/admin/verifications/${record.id}`)}
              className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {record.applicant.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-700 dark:text-white">{record.applicant.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {record.university} · {record.degree}
                </p>
              </div>
              <span className={`text-xs font-medium ${record.slaOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                {record.slaLabel}
              </span>
            </button>
          ))}

      </div>
    </div>
  )
}