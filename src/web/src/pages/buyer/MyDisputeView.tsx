import { useEffect, useReducer } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  IconAlertTriangle,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import {
  InfoRow,
  Panel,
  PersonCard,
  StatusBadge,
} from "../admin/AdminReviewShared";
import {
  type CheckInEvidence,
  type DisputeItem,
  type DisputeType,
  type ListingPhotos,
  type PersonSummary,
  type ReportInfo,
} from "../../types/mockAdmin";
import { getMyCaseById } from "../../services/adminService";
import type {
  CaseDetail,
  ListingSnapshot,
  PartySummary,
  ViewerRole,
} from "../../types/admin_disputes";
import { getApiUrl } from "../../config";
import { LoadingState } from "../../components/layout/Spinner";

export interface MyDisputeCase {
  id: string;
  type: DisputeType;
  item: DisputeItem;
  buyer: PersonSummary;
  seller: PersonSummary;
  datePlaced: string;
  filedBy: "Buyer" | "Seller" | "Applicant" | "System";
  checkIn?: CheckInEvidence;
  photos?: ListingPhotos;
  report?: ReportInfo;
  status: string;
  listingId?: string;
  viewerRole: ViewerRole;
}

const typeBadge: Record<
  DisputeType,
  { label: string; tone: "red" | "amber" | "blue" }
> = {
  no_show: { label: "No-show", tone: "red" },
  listing_quality: { label: "Listing quality", tone: "amber" },
  report_listing: { label: "Report listing", tone: "blue" },
};

const statusMeta: Record<string, { label: string; tone: "red" | "amber" | "blue" | "green" | "gray" }> = {
  pending: { label: "Pending review", tone: "amber" },
  under_review: { label: "Under review", tone: "amber" },
  resubmission: { label: "Awaiting resubmission", tone: "amber" },
  resolved: { label: "Resolved", tone: "green" },
  dismissed: { label: "Dismissed", tone: "gray" },
};

type State = {
  data: MyDisputeCase | null;
  loading: boolean;
  error: boolean;
  forbidden: boolean;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: MyDisputeCase }
  | { type: "FETCH_ERROR" }
  | { type: "FETCH_FORBIDDEN" };

function disputeReducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: false, forbidden: false };
    case "FETCH_SUCCESS":
      return { data: action.payload, loading: false, error: false, forbidden: false };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: true };
    case "FETCH_FORBIDDEN":
      return { ...state, loading: false, forbidden: true };
    default:
      return state;
  }
}



  const mapPerson = (p: PartySummary | undefined) => {
    if (!p) {
      return {
        id: "", initials: "?", name: "Unknown", faculty: "N/A",
        reputationScore: 0, reviewAverage: 0, reviewCount: 0,
      };
    }
    return {
      id: p.userId, name: p.name, initials: p.initials,
      faculty: p.faculty ?? "Unknown", reviewAverage: p.reviewAverage,
      reputationScore: p.reputationScore, strikeCount: p.strikeCount, reviewCount: 0,
    };
  };

  function transformCaseDetail(detail: CaseDetail, viewerRole: ViewerRole): MyDisputeCase {
  const apiBase = getApiUrl();

  const buildItemFromSnapshot = (
    snapshot?: ListingSnapshot,
    currentStatus?: string | null,
  ): DisputeItem => {
    if (!snapshot) {
      return {
        title: "Unknown Item", condition: "N/A", category: "N/A",
        moduleCode: "N/A", price: "N/A", status: currentStatus ?? "Unknown",
      };
    }
    return {
      title: snapshot.title, condition: snapshot.condition,
      category: snapshot.categoryName || "N/A",
      moduleCode: snapshot.courseTags?.[0] || "N/A",
      price: `R${snapshot.price.toFixed(2)}`,
      status: currentStatus ?? "Unknown",
      imageUrl: snapshot.photoRefs?.[0]
        ? `${apiBase}${snapshot.photoRefs[0].replace(/^\/api/, "")}`
        : undefined,
    };
  };

  const subject = detail.subject;
  const counterparty = detail.counterParty;

  const roleMap: Record<string, "Buyer" | "Seller" | "Applicant" | "System"> = {
    buyer: "Buyer", seller: "Seller", applicant: "Applicant", system: "System",
  };
  const filedBy = roleMap[detail.filedByRole] ?? "Unknown";

  let item: DisputeItem = {
    title: "Unknown Item", condition: "N/A", category: "N/A",
    moduleCode: "N/A", price: "N/A", status: "Reserved",
  };

  let checkIn: CheckInEvidence | undefined;
  let photos: ListingPhotos | undefined;
  let report: ReportInfo | undefined;
  let listingId: string | undefined;
  const ev = detail.evidence;

  if (detail.type === "no_show") {
    checkIn = {
      buyerCheckedIn: ev.buyerCheckedIn ?? false,
      buyerCheckInTime: ev.buyerCheckInTime ?? undefined,
      sellerCheckedIn: ev.sellerCheckedIn ?? false,
      sellerCheckInTime: ev.sellerCheckInTime ?? undefined,
      pinEntered: ev.pinStatus === "confirmed",
      checkInWindow: ev.checkInWindowClosesAt
        ? `Closes at ${new Date(ev.checkInWindowClosesAt).toLocaleString()}`
        : "No window set",
    };
  }
  if (detail.type == "listing_quality") {
    if (ev.snapshot) {
      item = buildItemFromSnapshot(ev.snapshot, ev.currentListingStatus);
      listingId = ev.snapshot.listingId;
    }
    photos = {
      snapshotPhotos: ev.snapshot?.photoRefs ?? [],
      buyerPhotos: ev.buyerPhotos ?? [],
    };
  }
  if (detail.type == "report_listing") {
    if (ev.snapshot) {
      item = buildItemFromSnapshot(ev.snapshot, ev.currentListingStatus);
    }
    listingId = ev.listingId;
    report = {
      reason: ev.reportReason || "No reason provided",
      reportedBy: counterparty
        ? mapPerson(counterparty)
        : { id: "", initials: "?", name: "Unknown", faculty: "N/A", reputationScore: 0, reviewAverage: 0, reviewCount: 0 },
    };
  }

  return {
    id: detail.caseId,
    type: detail.type as DisputeType,
    item,
    buyer: counterparty
      ? mapPerson(counterparty)
      : { id: "", initials: "?", name: "Unknown", faculty: "N/A", reputationScore: 0, reviewAverage: 0, reviewCount: 0 },
    seller: mapPerson(subject),
    datePlaced: new Date(detail.submittedAt).toLocaleDateString("en-ZA"),
    filedBy,
    checkIn,
    photos,
    report,
    status: detail.status,
    listingId,
    viewerRole,
  };
}

export default function MyDisputeView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const base = pathname.startsWith("/seller") ? "/seller" : "/buyer";
  const [state, dispatch] = useReducer(disputeReducer, {
    data: null, loading: true, error: false, forbidden: false,
  });

  useEffect(() => {
    let active = true;
    dispatch({ type: "FETCH_START" });

    getMyCaseById(id ?? "")
      .then((res) => {
        if (active) {
          dispatch({
            type: "FETCH_SUCCESS",
            payload: transformCaseDetail(res.detail, res.viewerRole),
          });
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 403) {
          dispatch({ type: "FETCH_FORBIDDEN" });
        } else {
          dispatch({ type: "FETCH_ERROR" });
        }
      });

    return () => { active = false; };
  }, [id]);

  if (state.loading) {
    return <LoadingState message="Loading dispute..." />;
  }
  if (state.forbidden) {
    return <p className="text-sm text-gray-600">You don't have access to this dispute.</p>;
  }
  if (state.error || !state.data) {
    return <p className="text-sm text-gray-600">Dispute not found</p>;
  }

  const dispute = state.data;
  const badge = typeBadge[dispute.type];
  const status = statusMeta[dispute.status] ?? { label: dispute.status, tone: "gray" as const };
  const isClosed = status.tone === "green" || status.tone === "gray";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => navigate(`${base}/disputes`)}
            className="text-[#00aaff] hover:underline cursor-pointer"
          >
            My Disputes
          </button>
          <IconChevronRight size={12} />
          <span className="text-gray-600">Dispute Details</span>
        </div>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ItemPanel dispute={dispute} />

          {dispute.type === "no_show" && dispute.checkIn && (
            <CheckInPanel checkIn={dispute.checkIn} />
          )}
          {dispute.type === "listing_quality" && dispute.photos && (
            <PhotoComparisonPanel photos={dispute.photos} viewerRole={dispute.viewerRole} />
          )}
          {dispute.type === "report_listing" && dispute.report && (
            <ReportReasonPanel reason={dispute.report.reason} />
          )}

          <Panel title="Status">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${status.tone === "green"
                  ? "bg-green-50 border-green-100"
                  : status.tone === "gray"
                    ? "bg-gray-50 border-gray-100"
                    : "bg-amber-50 border-amber-100"
                }`}
            >
              {status.tone === "green" ? (
                <IconCircleCheck size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <IconAlertTriangle size={18} className={`${status.tone === "gray" ? "text-gray-500" : "text-amber-600"} flex-shrink-0 mt-0.5`}
                 />
              )}
              <div>
                <p className="text-sm font-semibold text-navy-700 dark:text-white">{status.label}</p>
                <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
                  {isClosed 
                    ? "This dispute has been reviewed by an admin. You'll have been notified of the outcome by email."
                    : "An admin will review this dispute and you'll be notified of the outcome by email."}
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <PersonCard title="Seller" person={dispute.seller} />
          {dispute.type === "report_listing" && dispute.report ? (
            <PersonCard title="Reported by" person={dispute.report.reportedBy} />
          ) : (
            <PersonCard title="Buyer" person={dispute.buyer} />
          )}
          <Panel title="Dispute Info">
            <InfoRow label="Dispute ID" value={`#${dispute.id}`} />
            <InfoRow label="Date Placed" value={dispute.datePlaced} />
            <InfoRow label="Filed by" value={dispute.viewerRole === "filed_by_me" ? "You" : dispute.filedBy} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ItemPanel({ dispute }: Readonly<{ dispute: MyDisputeCase }>) {
  if (dispute.type === "no_show") {
    return (
      <Panel title="Item">
        <p className="text-sm text-gray-500 dark:text-white/50 italic">
          Item details are not available for no-show disputes.
        </p>
      </Panel>
    );
  }
  return (
    <Panel title="Item">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
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

function CheckInPanel({ checkIn }: Readonly<{ checkIn: NonNullable<MyDisputeCase["checkIn"]> }>) {
  return (
    <Panel title="Check-in and PIN evidence">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Buyer checked in</p>
          <StatusLine ok={checkIn.buyerCheckedIn} okLabel={`Checked in at ${checkIn.buyerCheckInTime ?? ""}`} notOkLabel="Not checked in" />
        </div>
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Seller checked in</p>
          <StatusLine ok={checkIn.sellerCheckedIn} okLabel={`Checked in at ${checkIn.sellerCheckInTime ?? ""}`} notOkLabel="Not checked in" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        <InfoRow label="PIN status" value={checkIn.pinEntered ? "Entered" : "Not entered"} />
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

function PhotoComparisonPanel({ photos,viewerRole, }: Readonly<{ photos: NonNullable<MyDisputeCase["photos"]>; viewerRole: ViewerRole; }>) {
  const apiBase = getApiUrl();
  return (
    <Panel title="Listing snapshot vs buyer photos">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Snapshot at Reservation</p>
          <div className="grid grid-cols-2 gap-2">
            {photos.snapshotPhotos.map((url, i) => {
              const imageSrc = url.startsWith("/api") ? `${apiBase}${url.replace(/^\/api/, "")}` : url;
              return (
                <div key={`snapshot-${i}`} className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-2xl">
                  <img src={imageSrc} alt={`Snapshot ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">{
            viewerRole === "filed_by_me" ? "Your Photos" : "Buyer's Photos"}</p>
          <div className="grid grid-cols-2 gap-2">
            {photos.buyerPhotos.map((url, i) => (
              <div key={`buyer-${i}`} className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center overflow-hidden">
                {url && <img src={url} alt={`Buyer Photo ${i + 1}`} className="w-full h-full object-cover" />}
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
      <div className="flex gap-3 rounded-lg border-l-4 border-gray-300 bg-gray-50 dark:bg-navy-700 p-4">
        <IconAlertTriangle size={18} className="text-gray-500 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">{reason}</p>
      </div>
    </Panel>
  );
}