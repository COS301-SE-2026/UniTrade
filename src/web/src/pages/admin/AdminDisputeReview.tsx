import {useEffect , useState} from 'react'
import {useNavigate, useParams} from 'react-router'
import {IconCircleCheck, IconCircleX, IconMail} from '@tabler/icons-react'
import {
    Breadcrumb, 
    InfoRow, 
    Panel, 
    PersonCard, 
    StatusBadge, 
    DecisionButton,
    OutlineButton,
    NotesPanel,
} from './AdminReviewShared'
import {getMockDisputeById, type DisputeCase, type DisputeDecision, type DisputeType} from '../../types/mockAdmin'

const typeBadge: Record<DisputeType, { label: string; tone: 'red' | 'amber' | 'blue' }> = {
  'no-show': { label: 'No-show', tone: 'red' },
  'listing-quality': { label: 'Listing quality', tone: 'amber' },
  'report-listing': { label: 'Report listing', tone: 'blue' },
}

const decisionLabel: Record<DisputeDecision, string> = {
  uphold: 'Dispute upheld',
  dismiss: 'Dispute dismissed',
  'more-info': 'Marked as needing more info',
  'side-buyer': 'Sided with buyer',
  'side-seller': 'Sided with seller',
  'remove-listing': 'Listing removed',
  'warn-seller': 'Seller warned',
}

const finalDecisions: DisputeDecision[] = ['uphold', 'dismiss', 'side-buyer', 'side-seller', 'remove-listing', 'warn-seller']

export default function AdminDisputeReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dispute, setDispute] = useState<DisputeCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<DisputeDecision | null>(null)
  const [completedDecision, setCompletedDecision] = useState<DisputeDecision | null>(null)
  const [decisionNote, setDecisionNote] = useState('')


  useEffect(() => {
    let active = true
    setLoading(true)
    getMockDisputeById(id ?? '').then((data) => {
      if (active) {
        setDispute(data ?? null)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [id])

 async function handleDecison(decision: DisputeDecision) {
    if(!dispute) return
    setSubmitting(decision)
    setTimeout(() => {
        setSubmitting(null)
        setCompletedDecision(decision)
    }, 400)
 }

 if(loading) {
    return < p className =  "text-sm text-gray-400">
        Loading case...
    </p>
 }

 if(!dispute){
    return <p className = " text-sm text-gray-400">
        Disputes case not found
    </p>
 }

 const badge = typeBadge[dispute.type]

 return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb trail={['Active Disputes', 'Case Review']} />
        <StatusBadge label={badge.label} tone={badge.tone} />
      </div>

      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">Case #{dispute.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ItemPanel dispute={dispute} />

          {dispute.type === 'no-show' && dispute.checkIn && <CheckInPanel checkIn={dispute.checkIn} />}
          {dispute.type === 'listing-quality' && dispute.photos && <PhotoComparisonPanel photos={dispute.photos} />}
          {dispute.type === 'report-listing' && dispute.report && <ReportReasonPanel reason={dispute.report.reason} />}

          <Panel title="Actions">
            <div className="mb-4">
              <OutlineButton onClick={() => navigate(`/listings/${dispute.id}`)}>View Listing</OutlineButton>
            </div>

            {completedDecision ? (
              <DecisionConfirmation dispute={dispute} decision={completedDecision} onBack={() => navigate('/admin/disputes')} />
            ) : (
              <>
                <div className="mb-4">
                  <label htmlFor="decision-note" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Add context for the outcome email (optional)
                  </label>
                  <textarea
                    id="decision-note"
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="e.g. Reasoning the parties should see in the email…"
                    rows={2}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3 py-2 text-navy-700 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-navy-700 resize-none"
                  />
                </div>
                <DecisionActions type={dispute.type} submitting={submitting} onDecide={handleDecision} />
              </>
            )}
          </Panel>

          <NotesPanel caseId={dispute.id} />
        </div>

        <div className="space-y-4">
          <PersonCard title="Seller" person={dispute.seller} />
          {dispute.type === 'report-listing' && dispute.report ? (
            <PersonCard title="Reported by" person={dispute.report.reportedBy} />
          ) : (
            <PersonCard title="Buyer" person={dispute.buyer} />
          )}
          <Panel title="Dispute Info">
            <InfoRow label="Dispute ID" value={`#${dispute.id}`} />
            <InfoRow label="Date Placed" value={dispute.datePlaced} />
            <InfoRow label="Filed by" value={dispute.filedBy} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function ItemPanel({ dispute }: Readonly<{ dispute: DisputeCase }>) {
  return (
    <Panel title="Item">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-2xl flex-shrink-0">
          {dispute.item.imageUrl}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#00aaff]">
            {dispute.item.title}
        </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Condition: {dispute.item.condition}
            </p>
          <p className="text-xs text-gray-400">
            Category: {dispute.item.category}
            </p>
          <p className="text-xs text-gray-400">
            Module Code: {dispute.item.moduleCode}
            </p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
        <InfoRow label="Item price" value={dispute.item.price} />
        <InfoRow label="Status" value={<StatusBadge label={dispute.item.status} tone="blue" />} />
      </div>
    </Panel>
  )
}


