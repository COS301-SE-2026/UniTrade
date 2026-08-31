import { useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { IconFileText, IconCircleCheck } from '@tabler/icons-react';
import { Breadcrumb, InfoRow, Panel, PersonCard, StatusBadge, DecisionButton } from './AdminReviewShared';
import { type VerificationCase, type VerificationDecision } from '../../types/mockAdmin';
import type { CaseDetail, ApiError } from '../../types/admin_disputes';
import { decideCase, getCaseById } from '../../services/adminService';
import { useToast } from '../../components/layout/useToast';
import { getApiUrl } from '../../config';


type State = {
  data: VerificationCase | null;
  loading: boolean;
  error: boolean;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: VerificationCase }
  | { type: 'FETCH_ERROR' };

function verificationReducer(state: State, action: Action): State {
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
function transformVerificationDetail(detail: CaseDetail): VerificationCase {
  const subject = detail.subject;
  const applicant = subject ? {
    id: detail.subject.userId,
    name: detail.subject.name,
    initials: detail.subject.initials,
    faculty: detail.subject.faculty ?? "Unknown",
    reviewAverage: detail.subject.reviewAverage,
    reputationScore: detail.subject.reputationScore,
    strikeCount: detail.subject.strikeCount,
    reviewCount: detail.subject.reviewCount
  } :
    {
      id: '', initials: '?', name: 'Unknown user', faculty: 'N/A', reputationScore: 0, reviewAverage: 0, reviewCount: 0
    };

  const evidence = detail.evidence;
  const slaHours = detail.slaHours;
  const slaOverdue = detail.slaBreached;
  const slaLabel = slaOverdue ? `${Math.round(detail.ageHours - slaHours)}h overdue` : `${Math.round(slaHours - detail.ageHours)}h remaining`;
  const hasDocument = !!evidence.proofDocument;

  return {
    id: detail.caseId,
    applicant,
    university: evidence.university ?? "N/A",
    degree: evidence.degree ?? "N/A",
    email: evidence.email ?? "N/A",
    domainValid: evidence.domainValid ?? false,
    document: {
      name: hasDocument ? 'Proof of Registration' : 'Not yet submitted',
      uploadedDate: new Date(detail.submittedAt).toLocaleDateString('en-ZA'),
      sizeLabel: 'Unknown size',
      url: hasDocument
        ? `${getApiUrl()}/admin/cases/${detail.caseId}/document`
        : '#',
    }, submittedDate: new Date(detail.submittedAt).toLocaleDateString('en-ZA'
    ),
    slaLabel,
    slaOverdue,

  };
}

export default function AdminVerificationReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(verificationReducer, {
    data: null,
    loading: true,
    error: false,
  });
  const [submitting, setSubmitting] = useState<VerificationDecision | null>(null);

  useEffect(() => {
    let active = true;

    dispatch({ type: 'FETCH_START' });

    getCaseById(id ?? '')
      .then((data) => {
        if (active && data) {
          if (data.type === 'verification') {
            dispatch({ type: 'FETCH_SUCCESS', payload: transformVerificationDetail(data) });
          } else {
            dispatch({ type: 'FETCH_ERROR' });
          }
        }
        else {
          dispatch({ type: 'FETCH_ERROR' });
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

  async function handleDecision(decision: VerificationDecision) {
    if (!state.data) return;
    setSubmitting(decision);

    try {
      await decideCase(state.data.id, { decision });
      showToast('success', 'Decision submitted successfully');
      navigate('/admin/verifications');

    } catch (error) {
      const apiError = error as ApiError;
      showToast('error', apiError.message || 'Failed to submit decision');
      setSubmitting(null);
    }
    finally {
      setSubmitting(null);
    }
  }

  if (state.loading) {
    return <p className="text-sm text-gray-600">Loading verification…</p>;
  }

  if (state.error || !state.data) {
    return <p className="text-sm text-gray-600">Verification case not found.</p>;
  }

  const record = state.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb trail={['Verifications', 'Case Review']} />
        <StatusBadge label="Verification" tone="green" />
      </div>

      <h1 className="text-2xl font-bold text-navy-700 dark:text-white">Case #{record.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Account details">
            <InfoRow label="University" value={record.university} />
            <InfoRow label="Degree" value={record.degree} />
            <InfoRow label="Email" value={record.email} />
            <InfoRow
              label="Domain check"
              value={
                <span className={`flex items-center gap-1 ${record.domainValid ? 'text-green-600' : 'text-red-600'}`}>
                  <IconCircleCheck size={14} />
                  {record.domainValid ? 'Valid SA domain' : 'Domain could not be verified'}
                </span>
              }
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <IconFileText size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-navy-700 dark:text-white">{record.document.name}</p>
                  <p className="text-xs text-gray-400">
                    Uploaded {record.document.uploadedDate} · {record.document.sizeLabel}
                  </p>
                </div>
              </div>
              {record.document.url !== '#' ? (<a href={record.document.url} className="text-xs font-semibold text-[#00aaff] hover:underline">
                View
              </a>) : (
                <span className='text-xs text-gray-400'>Document not available</span>
              )}

            </div>
          </Panel>

          <Panel title="Actions">
            <div className="flex flex-col sm:flex-row gap-3">
              <DecisionButton tone="success" disabled={!!submitting} onClick={() => handleDecision('approve')}>
                {submitting === 'approve' ? 'Approving…' : 'Approve'}
              </DecisionButton>
              <DecisionButton tone="neutral" disabled={!!submitting} onClick={() => handleDecision('resubmit')}>
                {submitting === 'resubmit' ? 'Requesting…' : 'Request Resubmission'}
              </DecisionButton>
              <DecisionButton tone="danger" disabled={!!submitting} onClick={() => handleDecision('reject')}>
                {submitting === 'reject' ? 'Rejecting…' : 'Reject'}
              </DecisionButton>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Resubmission asks the applicant to re-upload proof of registration without closing the case.
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <PersonCard title="Applicant" person={record.applicant} />
          <Panel title="Case Info">
            <InfoRow label="Case ID" value={`#${record.id}`} />
            <InfoRow label="Submitted" value={record.submittedDate} />
            <InfoRow
              label="SLA status"
              value={<span className={record.slaOverdue ? 'text-red-600' : 'text-green-600'}>{record.slaLabel}</span>}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}