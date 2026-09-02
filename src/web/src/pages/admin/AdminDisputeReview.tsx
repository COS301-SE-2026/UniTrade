import { useEffect, useState, useReducer } from 'react';
import { useNavigate, useParams } from 'react-router';
import { IconChevronRight, IconCircleCheck, IconCircleX, IconMail } from '@tabler/icons-react';
import {
  InfoRow,
  Panel,
  PersonCard,
  StatusBadge,
  DecisionButton,
  OutlineButton,
  NotesPanel,
  ConfirmModal,
} from './AdminReviewShared';
import { type CheckInEvidence, type DisputeDecision, type DisputeItem, type DisputeType, type ListingPhotos, type PersonSummary, type ReportInfo } from '../../types/mockAdmin';
import { getCaseById, decideCaseWithAction, type ButtonAction } from '../../services/adminService';
import type { CaseDetail, CaseType, ListingSnapshot, PartySummary, ApiError } from '../../types/admin_disputes';
import { getApiUrl } from '../../config';
import { LoadingState } from '../../components/layout/Spinner';


export interface DisputeCase {
  id: string
  type: DisputeType
  item: DisputeItem
  buyer: PersonSummary
  seller: PersonSummary
  datePlaced: string
  filedBy: 'Buyer' | 'Seller' | 'Applicant' | 'System'
  checkIn?: CheckInEvidence
  photos?: ListingPhotos
  report?: ReportInfo
  decision?: DisputeDecision
  listingId?: string
  suggestedDecision?: DisputeDecision
};

const typeBadge: Record<DisputeType, { label: string; tone: 'red' | 'amber' | 'blue' }> = {
  'no_show': { label: 'No-show', tone: 'red' },
  'listing_quality': { label: 'Listing quality', tone: 'amber' },
  'report_listing': { label: 'Report listing', tone: 'blue' },
};

const decisionLabel: Record<DisputeDecision, string> = {
  uphold: 'Dispute upheld',
  dismiss: 'Dispute dismissed',
  'more-info': 'Marked as needing more info',
  'side-buyer': 'Sided with buyer',
  'side-seller': 'Sided with seller',

  'remove-listing': 'Listing removed',
  'warn-seller': 'Seller warned',
};

const disputeConfirmTitles: Partial<Record<DisputeDecision, string>> = {
  'remove-listing': 'Are you sure you want to remove this listing?',
  'warn-seller': 'Are you sure you want to warn this seller?',
  dismiss: 'Are you sure you want to dismiss this dispute?'
};

const disputeConfirmMessages: Partial<Record<DisputeDecision, string>> = {
  'remove-listing': 'This will remove the listing from the platform and notify the seller.This cannot be undone',
  'warn-seller': 'You are about to issue a formal warning to this seller. The seller will be notified.',
  'dismiss': 'This will dismiss the dispute without taking any action.'
};

const finalDecisions: DisputeDecision[] = ['uphold', 'dismiss', 'side-buyer', 'side-seller', 'remove-listing', 'warn-seller'];

type State = {
  data: DisputeCase | null;
  loading: boolean;
  error: boolean;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: DisputeCase }
  | { type: 'FETCH_ERROR' };

function disputeReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: false };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: false };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
}

function transformCaseDetail(detail: CaseDetail): DisputeCase {


  const mapPerson = (p: PartySummary | undefined) => {
    if (!p) {
      return { id: '', initials: '?', name: 'Unknown', faculty: 'N/A', reputationScore: 0, reviewAverage: 0, reviewCount: 0 }
    }
    return {
      id: p.userId,
      name: p.name,
      initials: p.initials,
      faculty: p.faculty ?? "Unknown",
      reviewAverage: p.reviewAverage,
      reputationScore: p.reputationScore,
      strikeCount: p.strikeCount,
      reviewCount: 0
    };
  };
  const apiBase = getApiUrl();

  const buildItemFromSnapshot = (snapshot?: ListingSnapshot, currentStatus?: string | null): DisputeItem => {
    if (!snapshot) {
      return {
        title: 'Unknown Item',
        condition: 'N/A',
        category: 'N/A',
        moduleCode: 'N/A',
        price: 'N/A',
        status: currentStatus ?? 'Unkonwn',
      };
    }
    return {
      title: snapshot.title,
      condition: snapshot.condition,
      category: snapshot.courseTags?.join(', ') || 'N/A',
      moduleCode: snapshot.courseTags?.[0] || 'N/A',
      price: `R${snapshot.price.toFixed(2)}`,
      status: currentStatus ?? 'Unknown',
      imageUrl: snapshot.photoRefs?.[0] ? `${apiBase}${snapshot.photoRefs[0].replace(/^\/api/, '')}` : undefined // if not rendering in prod.. check the element if its missing an api
    };
  };

  const subject = detail.subject;
  const counterparty = detail.counterParty;

  const roleMap: Record<string, 'Buyer' | 'Seller' | 'Applicant' | 'System'> = {
    buyer: 'Buyer',
    seller: 'Seller',
    applicant: 'Applicant',
    system: 'System',
  };
  const filedBy = roleMap[detail.filedByRole] ?? 'Unknown';

  let item: DisputeItem = {
    title: 'Unknown Item',
    condition: 'N/A',
    category: 'N/A',
    moduleCode: 'N/A',
    price: 'N/A',
    status: 'Reserved',
  };

  let checkIn: CheckInEvidence | undefined = undefined;
  let photos: ListingPhotos | undefined = undefined;
  let report: ReportInfo | undefined = undefined;
  let listingId: string | undefined = undefined;
  const ev = detail.evidence;

  if (detail.type === 'no_show') {
    checkIn = {
      buyerCheckedIn: ev.buyerCheckedIn ?? false,
      buyerCheckInTime: ev.buyerCheckInTime ?? undefined,
      sellerCheckedIn: ev.sellerCheckedIn ?? false,
      sellerCheckInTime: ev.sellerCheckInTime ?? undefined,
      pinEntered: ev.pinStatus === 'confirmed',
      checkInWindow: ev.checkInWindowClosesAt ? `Closes at ${new Date(ev.checkInWindowClosesAt).toLocaleString()}` : 'No window set',

    };
  }
  if (detail.type == 'listing_quality') {
    if (ev.snapshot) {
      item = buildItemFromSnapshot(ev.snapshot, ev.currentListingStatus);
      listingId = ev.snapshot.listingId;
    }
    photos = {
      snapshotPhotos: ev.snapshot?.photoRefs ?? [],
      buyerPhotos: ev.buyerPhotos ?? [],
    };
  }
  if (detail.type == 'report_listing') {
    if (ev.snapshot) {
      item = buildItemFromSnapshot(ev.snapshot, ev.currentListingStatus);
    }
    listingId = ev.listingId;
    report = {
      reason: ev.reportReason || 'No reason provided',
      reportedBy: counterparty ? mapPerson(counterparty) : { id: '', initials: '?', name: 'Unknown', faculty: 'N/A', reputationScore: 0, reviewAverage: 0, reviewCount: 0 },
    };
  }
  let suggestedDecision: DisputeDecision | undefined;
  if (detail.type === "listing_quality" && detail.suggestedDecision) {
    suggestedDecision = detail.suggestedDecision as DisputeDecision;
  }
  return {
    id: detail.caseId,
    type: detail.type as DisputeType,

    item,
    buyer: counterparty ? mapPerson(counterparty) : { id: '', initials: '?', name: 'Unknown', faculty: 'N/A', reputationScore: 0, reviewAverage: 0, reviewCount: 0 },
    seller: mapPerson(subject),
    datePlaced: new Date(detail.submittedAt).toLocaleDateString('en-ZA'),
    filedBy,
    checkIn,
    photos,
    report,
    decision: undefined,
    listingId,
    suggestedDecision
  };
};

export default function AdminDisputeReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(disputeReducer, {
    data: null,
    loading: true,
    error: false,
  });
  const [submitting, setSubmitting] = useState<DisputeDecision | null>(null);
  const [completedDecision, setCompletedDecision] = useState<DisputeDecision | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [pendingConfirmDecision, setPendingConfirmDecision] = useState<DisputeDecision | null>(null);
  useEffect(() => {
    let active = true;

    dispatch({ type: 'FETCH_START' });

    getCaseById(id ?? '').then((data) => {
      if (active) {
        // check response though
        dispatch({ type: 'FETCH_SUCCESS', payload: transformCaseDetail(data) });
      }
    })
      .catch(() => {
        if (active) {
          dispatch({ type: 'FETCH_ERROR' });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleDecision(decision: DisputeDecision) {
    if (!state.data) return;
    setSubmitting(decision);
    setDecisionError(null);
    try {
      await decideCaseWithAction(state.data.id, state.data.type as CaseType, decision as ButtonAction, decisionNote.trim() || undefined);
      setCompletedDecision(decision);
    } catch (error) {
      const apiError = error as ApiError;
      setDecisionError(apiError.message || 'Failed to submit decision.');
    } finally {
      setSubmitting(null);
    }
  }

  function handleDecisionClick(decision: DisputeDecision) {
    if (disputeConfirmTitles[decision]) {
      setPendingConfirmDecision(decision);
    } else {
      handleDecision(decision);
    }
  }


  if (state.loading) {
    return <LoadingState message="Loading case..." />;
  }

  if (state.error || !state.data) {
    return <p className="text-sm text-gray-600">Dispute case not found</p>;
  }

  const dispute = state.data;
  const badge = typeBadge[dispute.type as DisputeType];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className='flex items-center gap-1.5 text-sm text-gray-400'>
          <button type='button' onClick={() => navigate('/admin/disputes')}
            className='text-[#00aaff] hover:underline cursor-pointer'
          >Active Disputes

          </button>
          <IconChevronRight size={12} />
          <span className='text-gray-400'></span>
          <span className='text-gray-600' >Case Review</span>
        </div>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </div>

      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">Case #{dispute.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ItemPanel dispute={dispute} />

          {dispute.type === 'no_show' && dispute.checkIn && <CheckInPanel checkIn={dispute.checkIn} />}
          {dispute.type === 'listing_quality' && dispute.photos && <PhotoComparisonPanel photos={dispute.photos} />}
          {dispute.type === 'report_listing' && dispute.report && <ReportReasonPanel reason={dispute.report.reason} />}

          <Panel title="Actions">
            <div className="mb-4">
              <OutlineButton onClick={() => navigate(`/buyer/listings/${dispute.listingId ?? dispute.id}`)} disabled={!dispute.listingId}>View Listing</OutlineButton>
            </div>

            {completedDecision ? (
              <DecisionConfirmation dispute={dispute} decision={completedDecision} onBack={() => navigate('/admin/disputes')} />
            ) : (
              <>
                <div className="mb-4">
                  
                  <textarea
                    id="decision-note"
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="e.g. Reasoning the parties should see in the email…"
                    rows={2}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3 py-2 text-navy-700 dark:text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-navy-700 resize-none"
                  />
                </div>
                {decisionError && (
                  <div className='text-sm text-red-600 mb-3'>{decisionError}</div>
                )}
                <DecisionActions type={dispute.type} submitting={submitting} onDecide={handleDecisionClick} suggestedDecision={dispute.suggestedDecision} />
              </>
            )}
          </Panel>

          <NotesPanel caseId={dispute.id} />
        </div>

        <div className="space-y-4">
          <PersonCard title="Seller" person={dispute.seller} />
          {dispute.type === 'report_listing' && dispute.report ? (
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

      {pendingConfirmDecision && (
        <ConfirmModal
          title={disputeConfirmTitles[pendingConfirmDecision] ?? 'Are you sure?'}
          message={disputeConfirmMessages[pendingConfirmDecision] ?? 'This action cannot be undone.'}
          confirmLabel={decisionLabel[pendingConfirmDecision]}
          tone={pendingConfirmDecision === 'remove-listing' ? 'danger' :
            'neutral'
          }
          submitting={!!submitting}
          onCancel={() => setPendingConfirmDecision(null)}
          onConfirm={() => {

            handleDecision(pendingConfirmDecision);
            setPendingConfirmDecision(null);
          }}
        />
      )}
    </div>
  );
}

function ItemPanel({ dispute }: Readonly<{ dispute: DisputeCase }>) {

  if (dispute.type === 'no_show') {
    return (
      <Panel title='Item'
      ><p className='text-sm text-gray-500 dark:text-white/50 italic'>Item details are not available for no-show disputes.</p></Panel>
    );
  }
  return (
    <Panel title="Item">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg bg-gray-100 darkLbg-navy-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {dispute.item.imageUrl && (
            <img src={dispute.item.imageUrl} alt={dispute.item.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#00aaff]">{dispute.item.title}</p>
          <p className="text-xs text-gray-600 mt-0.5">Condition: {dispute.item.condition}</p>
          <p className="text-xs text-gray-600">Category: {dispute.item.category}</p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
        <InfoRow label="Item price" value={dispute.item.price} />
        <InfoRow label="Status" value={<StatusBadge label={dispute.item.status} tone="blue" />} />
      </div>
    </Panel>
  );
}

function CheckInPanel({ checkIn }: Readonly<{ checkIn: NonNullable<DisputeCase['checkIn']> }>) {
  return (
    <Panel title="Check-in and PIN evidence">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Buyer checked in</p>
          <StatusLine
            ok={checkIn.buyerCheckedIn}
            okLabel={`Checked in at ${checkIn.buyerCheckInTime ?? ''}`}
            notOkLabel="Not checked in"
          />
        </div>
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Seller checked in</p>
          <StatusLine
            ok={checkIn.sellerCheckedIn}
            okLabel={`Checked in at ${checkIn.sellerCheckInTime ?? ''}`}
            notOkLabel="Not checked in"
          />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        <InfoRow label="PIN status" value={checkIn.pinEntered ? 'Entered' : 'Not entered'} />
        <InfoRow label="Check-in window" value={checkIn.checkInWindow} />
      </div>
    </Panel>
  );
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
  );
}

function PhotoComparisonPanel({ photos }: Readonly<{ photos: NonNullable<DisputeCase['photos']> }>) {
  const apiBase = getApiUrl();
  return (
    <Panel title="Listing snapshot vs buyer photos">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Snapshot at Reservation</p>
          <div className="grid grid-cols-2 gap-2">
            {photos.snapshotPhotos.map((url, i) => {
              const imageSrc = url.startsWith('/api') ? `${apiBase}${url.replace(/^\/api/, '')}` : url;
              return (


                <div
                  key={`snapshot-${i}`}
                  className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-2xl"
                >
                  <img src={imageSrc} alt={`Snapshot ${i + 1}`} className='w-full h-full object-cover' />
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Buyer's Photos</p>
          <div className="grid grid-cols-2 gap-2">
            {photos.buyerPhotos.map((url, i) => (
              <div
                key={`buyer-${i}`}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center overflow-hidden"
              >
                {url && <img src={url} alt={`Buyer photo ${i + 1}`} className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ReportReasonPanel({ reason }: Readonly<{ reason: string }>) {
  return (
    <Panel title="Report reason">
      <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-white/70 italic">"{reason}"</p>
      </div>
    </Panel>
  );
}

function DecisionConfirmation({
  dispute,
  decision,
  onBack,
}: Readonly<{ dispute: DisputeCase; decision: DisputeDecision; onBack: () => void }>) {
  const isFinal = finalDecisions.includes(decision);

  return (
    <div>
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border ${isFinal
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
            <p className="text-xs text-gray-500 dark:text-white/60 mt-1">No email sent yet</p>
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
  );
}

function DecisionActions({
  type,
  submitting,
  onDecide,
  suggestedDecision
}: Readonly<{ type: DisputeType; submitting: DisputeDecision | null; onDecide: (d: DisputeDecision) => void; suggestedDecision?: DisputeDecision }>) {


  if (type === 'no_show') {
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
    );
  }

  if (type === 'listing_quality') {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <DecisionButton tone="success" disabled={!!submitting} onClick={() => onDecide('side-buyer')}>
          {submitting === 'side-buyer' ? 'Saving…' : 'Side with Buyer'}
          {suggestedDecision === 'uphold' && (
            <span className='ml-2 text-xs text-blue-500'>(recommended)</span>
          )}
        </DecisionButton>
        <DecisionButton tone="neutral" disabled={!!submitting} onClick={() => onDecide('side-seller')}>
          {submitting === 'side-seller' ? 'Saving…' : 'Side with Seller'}
          {suggestedDecision === 'dismiss' && (
            <span className='ml-2 text-xs text-blue-500'>(recommended)</span>
          )}
        </DecisionButton>
        <DecisionButton tone="danger" disabled={!!submitting} onClick={() => onDecide('dismiss')}>
          {submitting === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
          {suggestedDecision === 'dismiss' && (
            <span className='ml-2 text-xs text-blue-500'>(recommended)</span>
          )}
        </DecisionButton>
      </div>
    );
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
  );
}