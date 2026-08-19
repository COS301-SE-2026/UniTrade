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

 async function handleDecision(decision: DisputeDecision) {
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
                    still deciding if its email or messaging the buyer or the seller 
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
        <div className="w-16 h-16 rounded-lg bg-gray-100 darkLbg-navy-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {dispute.item.imageUrl && (
            <img src = {dispute.item.imageUrl} alt = {dispute.item.title} className = "w-full h-full object-cover" />
          )}
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

function CheckInPanel({checkIn}: Readonly<{checkIn: NonNullable<DisputeCase['checkIn']>}>) {

    return (
    <Panel title="Check-in and PIN evidence">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">
            Buyer checked in
            </p>
          <StatusLine ok={checkIn.buyerCheckedIn} okLabel={`Checked in at ${checkIn.buyerCheckInTime ?? ''}`} notOkLabel="Not checked in" />
        </div>
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">
            Seller checked in
            </p>
          <StatusLine ok={checkIn.sellerCheckedIn} okLabel={`Checked in at ${checkIn.sellerCheckInTime ?? ''}`} notOkLabel="Not checked in" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        <InfoRow label="PIN status" value={checkIn.pinEntered ? 'Entered' : 'Not entered'} />
        <InfoRow label="Check-in window" value={checkIn.checkInWindow} />
      </div>
    </Panel>
    )

}

function StatusLine({ ok, okLabel, notOkLabel }: Readonly<{ ok: boolean; okLabel: string; notOkLabel: string }>) {
  return ok ? (
    <span className="flex items-center gap-1 text-sm text-green-600">
      <IconCircleCheck size={16} /> {okLabel}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-sm text-red-600">
      <IconCircleX size={16} /> {notOkLabel}
    </span>
  )
}

function PhotoComparisonPanel({ photos }: Readonly<{ photos: NonNullable<DisputeCase['photos']> }>) {
  return (
    <Panel title="Listing snapshot vs buyer photos">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Snapshot at Reservation
            </p>
          <div className="grid grid-cols-2 gap-2">
            {photos.snapshotPhotos.map((emoji, i) => (
              <div
                key={`snapshot-${i}`}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-2xl"
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Buyer's Photos
            </p>
          <div className="grid grid-cols-2 gap-2">
            {photos.buyerPhotos.map((url, i) => (
              <div
                key={`buyer-${i}`}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center overflow-hidden"
              >
                {url && <img src = {url} alt = {`Buyer photo ${i + 1}`} className = "w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function ReportReasonPanel({ reason }: Readonly<{ reason: string }>) {
  return (
    <Panel title="Report reason">
      <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-white/70 italic">
        "{reason}"
        </p>
      </div>
    </Panel>
  )
}

function DecisionConfirmation({
  dispute,
  decision,
  onBack,
}: Readonly<{ dispute: DisputeCase; decision: DisputeDecision; onBack: () => void }>) {
  const isFinal = finalDecisions.includes(decision)

  return (
    <div>
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border ${
          isFinal
            ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
        }`}
      >
        {isFinal ? (
          <IconMail size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <IconCircleCheck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-sm font-semibold text-navy-700 dark:text-white">{decisionLabel[decision]}</p>
          {isFinal ? (
            <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
              {dispute.buyer.name} and {dispute.seller.name} will be notified of this outcome by email.
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
              No email sent yet
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-xs font-semibold text-[#00aaff] hover:underline"
      >
        Back to Disputes
      </button>
    </div>
  )
}

function DecisionActions({
  type,
  submitting,
  onDecide,
}: Readonly<{ type: DisputeType; submitting: DisputeDecision | null; onDecide: (d: DisputeDecision) => void }>) {
  if (type === 'no-show') {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <DecisionButton tone="danger" disabled={!!submitting} onClick={() => onDecide('uphold')}>
          {submitting === 'uphold' ? 'Upholding…' : 'Uphold'}
        </DecisionButton>
        <DecisionButton tone="neutral" disabled={!!submitting} onClick={() => onDecide('dismiss')}>
          {submitting === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
        </DecisionButton>
        <DecisionButton tone="neutral" disabled={!!submitting} onClick={() => onDecide('more-info')}>
          {submitting === 'more-info' ? 'Requesting…' : 'Ask for More Info'}
        </DecisionButton>
      </div>
    )
  }

  if (type === 'listing-quality') {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <DecisionButton tone="success" disabled={!!submitting} onClick={() => onDecide('side-buyer')}>
          {submitting === 'side-buyer' ? 'Saving…' : 'Side with Buyer'}
        </DecisionButton>
        <DecisionButton tone="neutral" disabled={!!submitting} onClick={() => onDecide('side-seller')}>
          {submitting === 'side-seller' ? 'Saving…' : 'Side with Seller'}
        </DecisionButton>
        <DecisionButton tone="danger" disabled={!!submitting} onClick={() => onDecide('dismiss')}>
          {submitting === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
        </DecisionButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <DecisionButton tone="danger" disabled={!!submitting} onClick={() => onDecide('remove-listing')}>
        {submitting === 'remove-listing' ? 'Removing…' : 'Remove Listing'}
      </DecisionButton>
      <DecisionButton tone="neutral" disabled={!!submitting} onClick={() => onDecide('warn-seller')}>
        {submitting === 'warn-seller' ? 'Warning…' : 'Warn Seller'}
      </DecisionButton>
      <DecisionButton tone="neutral" disabled={!!submitting} onClick={() => onDecide('dismiss')}>
        {submitting === 'dismiss' ? 'Dismissing…' : 'Dismiss Report'}
      </DecisionButton>
    </div>
  )
}

