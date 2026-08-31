import { useEffect, useReducer } from 'react';
import { useParams } from 'react-router';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Breadcrumb, Panel, StarRating } from './AdminReviewShared';
import type { UserReputation } from '../../types/admin_disputes';
import { getUserReputation } from '../../services/adminService';
import { LoadingState } from '../../components/layout/Spinner';

interface StrikeDisplay {
  id: string;
  reason: string;
  date: string;
  issuedBy: string;
}

interface ProfileDisplay {
  id: string;
  name: string;
  initials: string;
  faculty: string;
  university: string;
  memberSince: string;
  reviewAverage: number;
  reviewCount: number;
  reputationScore: number;
  strikes: StrikeDisplay[];

}

type State = {
  data: ProfileDisplay | null;
  loading: boolean;
  error: boolean;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ProfileDisplay }
  | { type: 'FETCH_ERROR' };

function reputationReducer(state: State, action: Action): State {
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
function getInitials(name: string): string {
  return name.trim().split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function mapRealToDisplay(real: UserReputation): ProfileDisplay {
  return {
    id: real.userId,
    name: real.name,
    initials: getInitials(real.name),
    faculty: real.degree,
    university: real.universityName,
    memberSince: 'N/A',
    reviewAverage: real.reviewAverage,
    reviewCount: real.reviewCount,
    reputationScore: Math.round(real.reviewAverage * 20),
    strikes: real.strikes.map((s) => ({
      id: s.strikeId,
      reason: s.reason,
      date: formatDate(s.createdAt),
      issuedBy: 'Admin', // fetch admin name later
    })),
  };
}
export default function AdminUserReputation() {
  const { id } = useParams<{ id: string }>();
  const [state, dispatch] = useReducer(reputationReducer, {
    data: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let active = true;

    dispatch({ type: 'FETCH_START' });

    getUserReputation(id ?? '')
      .then((data) => {
        if (active) {
          if (data) {
            const mapped = mapRealToDisplay(data);
            dispatch({ type: 'FETCH_SUCCESS', payload: mapped });
          } else {
            dispatch({ type: 'FETCH_ERROR' });
          }
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

  if (state.loading) {
    return <LoadingState message = "Loading user..." />
  }

  if (state.error || !state.data) {
    return <p className="text-sm text-gray-400">User was not found.</p>;
  }

  const profile = state.data;

  return (
    <div className="space-y-4">
      <Breadcrumb trail={['Users', profile.name]} />

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {profile.initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            {profile.name}
          </h1>
          <p className="text-sm text-gray-400">
            {profile.faculty} · {profile.university} · Member since {profile.memberSince}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Review Average">
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-navy-700 dark:text-white">{profile.reviewAverage.toFixed(1)}</p>
            <div className="pb-1">
              <StarRating value={profile.reviewAverage} />
              <p className="text-xs text-gray-400 mt-1">
                {profile.reviewCount} reviews
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-400">Reputation Score</span>
            <span className="text-sm font-semibold text-navy-700 dark:text-white">
              {profile.reputationScore}%
            </span>
          </div>
        </Panel>

        <Panel title="Strikes">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-2xl font-bold ${profile.strikes.length > 0 ? 'text-red-600' : 'text-navy-700 dark:text-white'
                }`}
            >
              {profile.strikes.length}
            </span>
            <span className="text-xs text-gray-400">
              {profile.strikes.length === 1 ? 'strike on record' : 'strikes on record'}
            </span>
          </div>

          {profile.strikes.length === 0 ? (
            <p className="text-sm text-gray-400">No strikes on record.</p>
          ) : (
            <div className="space-y-2">
              {profile.strikes.map((strike) => (
                <div
                  key={strike.id}
                  className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20"
                >
                  <IconAlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-navy-700 dark:text-white">{strike.reason}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {strike.date} · Issued by {strike.issuedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}