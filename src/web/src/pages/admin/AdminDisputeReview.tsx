import { useEffect, useState, useReducer } from "react";
import { useNavigate, useParams } from "react-router";
import {
  IconAlertTriangle,
  IconBulb,
  //IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconMail,
} from "@tabler/icons-react";
import {
  InfoRow,
  Panel,
  PersonCard,
  StatusBadge,
  DecisionButton,
  OutlineButton,
  ConfirmModal,
  NotesPanel,
} from "./AdminReviewShared";
import {
  type CheckInEvidence,
  type DisputeDecision,
  type DisputeItem,
  type DisputeType,
  type ListingPhotos,
  type PersonSummary,
  type ReportInfo,
} from "../../types/mockAdmin";
import {
  getCaseById,
  decideCaseWithAction,
  getAuditEntries,
  type ButtonAction,
  strikeUser,
} from "../../services/adminService";
import type {
  CaseDetail,
  CaseType,
  ListingSnapshot,
  PartySummary,
  ApiError,
  Outcome,
  AuditEntry,
} from "../../types/admin_disputes";
import { getApiUrl } from "../../config";
import { LoadingState } from "../../components/layout/Spinner";
import { getSimilarListings } from "../../utils/similarListings";
import { listingsService } from "../../services/listingsService";
export interface DisputeCase {
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
  listingDiff?: { original: ListingSnapshot; current: ListingSnapshot };
  decision?: DisputeDecision;
  listingId?: string;
  suggestedDecision?: DisputeDecision;
  status?: string;
  resolvedAt?: string;

  suggestedOutcomes?: Outcome[];
}
import type { SimilarListing } from "../../types/listing";
//import type { Audit } from "lighthouse";
const typeBadge: Record<
  DisputeType,
  { label: string; tone: "red" | "amber" | "blue" }
> = {
  no_show: { label: "No-show", tone: "red" },
  listing_quality: { label: "Listing quality", tone: "amber" },
  report_listing: { label: "Report listing", tone: "blue" },
};

const decisionLabel: Record<DisputeDecision, string> = {
  uphold: "Uphold Dispute",
  dismiss: "Dismiss Dispute",
  "more-info": "Marked as needing more info",
  "side-buyer": "Side with buyer",
  "side-seller": "Side with seller",

  "remove-listing": "Ban Listing",
  "warn-seller": "Remove Listing",
};

const disputeConfirmTitles: Partial<Record<DisputeDecision, string>> = {
  "remove-listing": "Are you sure you want to permanently ban this listing?",
  "warn-seller": "Are you sure you want to remove this listing",
  dismiss: "Are you sure you want to dismiss this dispute?",

  uphold: "Are you sure you want to uphold this dispute?",
  "side-buyer": "Are you sure you want to side with the buyer?",
  "side-seller": "Are you sure you want to side with the seller?",
  "more-info": "Are you sure you want to request more information?",
};

const disputeConfirmMessages: Partial<Record<DisputeDecision, string>> = {
  "remove-listing":
    "This will permanently ban the listing from the platform and notify the seller.This cannot be undone",
  "warn-seller":
    "This will remove the listing and notify the seller, but they will be able to correct the issue and resubmit it for review.",
  dismiss: "This will dismiss the dispute without taking any action.",

  uphold: "This will uphold the dispute and apply a strike.",
  "side-buyer": "The outcomes you selected will be applied to the seller.",
  "side-seller":
    " You are deciding in favor of the seller. The dispute will be resolved.",
};

const finalDecisions: DisputeDecision[] = [
  "uphold",
  "dismiss",
  "side-buyer",
  "side-seller",
  "remove-listing",
  "warn-seller",
];

const OUTCOME_OPTIONS: { value: Outcome; label: string }[] = [
  {
    value: "warn_seller_resubmit",
    label: "Remove listing (seller may correct and resubmit)",
  },
  { value: "remove_listing", label: "Ban listing permanently" },
  { value: "strike", label: "Strike seller" },
  { value: "refusal_flag", label: "Refusal flag (seller refused photos)" },
];

const DECISION_ERRORS: Record<string, string> = {
  outcome_required: "Pick at least one outcome before siding with the buyer.",
  outcomes_not_allowed: "Outcomes can only be applied when upholding.",
};

type State = {
  data: DisputeCase | null;
  loading: boolean;
  error: boolean;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: DisputeCase }
  | { type: "FETCH_ERROR" };

function disputeReducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: false };
    case "FETCH_SUCCESS":
      return { data: action.payload, loading: false, error: false };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
}

function transformCaseDetail(detail: CaseDetail): DisputeCase {
  const mapPerson = (p: PartySummary | undefined) => {
    if (!p) {
      return {
        id: "",
        initials: "?",
        name: "Unknown",
        faculty: "N/A",
        reputationScore: 0,
        reviewAverage: 0,
        reviewCount: 0,
      };
    }
    return {
      id: p.userId,
      name: p.name,
      initials: p.initials,
      faculty: p.faculty ?? "Unknown",
      reviewAverage: p.reviewAverage,
      reputationScore: p.reputationScore,
      strikeCount: p.strikeCount,
      reviewCount: 0,
    };
  };
  const apiBase = getApiUrl();

  const buildItemFromSnapshot = (
    snapshot?: ListingSnapshot,
    currentStatus?: string | null,
  ): DisputeItem => {
    if (!snapshot) {
      return {
        title: "Unknown Item",
        condition: "N/A",
        category: "N/A",
        moduleCode: "N/A",
        price: "N/A",
        status: currentStatus ?? "Unknown",
      };
    }
    return {
      title: snapshot.title,
      condition: snapshot.condition,
      category: snapshot.categoryName || "N/A",
      moduleCode: snapshot.courseTags?.[0] || "N/A",
      price: `R${snapshot.price.toFixed(2)}`,
      status: currentStatus ?? "Unknown",
      imageUrl: snapshot.photoRefs?.[0]
        ? `${apiBase}${snapshot.photoRefs[0].replace(/^\/api/, "")}`
        : undefined, // if not rendering in prod.. check the element if its missing an api
    };
  };

  const subject = detail.subject;
  const counterparty = detail.counterParty;

  const roleMap: Record<string, "Buyer" | "Seller" | "Applicant" | "System"> = {
    buyer: "Buyer",
    seller: "Seller",
    applicant: "Applicant",
    system: "System",
  };
  const filedBy = roleMap[detail.filedByRole] ?? "Unknown";

  let item: DisputeItem = {
    title: "Unknown Item",
    condition: "N/A",
    category: "N/A",
    moduleCode: "N/A",
    price: "N/A",
    status: "Reserved",
  };

  let checkIn: CheckInEvidence | undefined = undefined;
  let photos: ListingPhotos | undefined = undefined;
  let report: ReportInfo | undefined = undefined;
  let listingId: string | undefined = undefined;
  let listingDiff:
    | { original: ListingSnapshot; current: ListingSnapshot }
    | undefined = undefined;
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
  if (detail.type === "listing_quality") {
    if (ev.snapshot) {
      item = buildItemFromSnapshot(ev.snapshot, ev.currentListingStatus);
      listingId = ev.snapshot.listingId;
    }
    photos = {
      snapshotPhotos: ev.snapshot?.photoRefs ?? [],
      buyerPhotos: ev.buyerPhotos ?? [],
    };
  }
  if (detail.type === "report_listing") {
    if (ev.snapshot) {
      item = buildItemFromSnapshot(ev.snapshot, ev.currentListingStatus);
    }
    listingId = ev.listingId;
    report = {
      reason: ev.reportReason || "No reason provided",
      reportedBy: counterparty
        ? mapPerson(counterparty)
        : {
            id: "",
            initials: "?",
            name: "Unknown",
            faculty: "N/A",
            reputationScore: 0,
            reviewAverage: 0,
            reviewCount: 0,
          },
    };
    if (ev.originalSnapshot && ev.snapshot) {
      photos = {
        snapshotPhotos: ev.originalSnapshot.photoRefs ?? [],
        buyerPhotos: ev.snapshot.photoRefs ?? [],
      };
      listingDiff = { original: ev.originalSnapshot, current: ev.snapshot };
    }
  }
  let suggestedDecision: DisputeDecision | undefined;
  if (detail.type === "listing_quality" && detail.suggestedDecision) {
    suggestedDecision = detail.suggestedDecision as DisputeDecision;
  }
  return {
    id: detail.caseId,
    type: detail.type as DisputeType,

    item,
    buyer: counterparty
      ? mapPerson(counterparty)
      : {
          id: "",
          initials: "?",
          name: "Unknown",
          faculty: "N/A",
          reputationScore: 0,
          reviewAverage: 0,
          reviewCount: 0,
        },
    seller: mapPerson(subject),
    datePlaced: new Date(detail.submittedAt).toLocaleDateString("en-ZA"),
    filedBy,
    checkIn,
    photos,
    report,
    decision: undefined,
    listingId,
    listingDiff,
    suggestedDecision,
    suggestedOutcomes:
      detail.type === "listing_quality" ? detail.suggestedOutcomes : undefined,
    status: detail.status,
    resolvedAt: detail.resolvedAt ?? undefined,
  };
}

export default function AdminDisputeReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(disputeReducer, {
    data: null,
    loading: true,
    error: false,
  });
  const [submitting, setSubmitting] = useState<DisputeDecision | null>(null);
  const [completedDecision, setCompletedDecision] =
    useState<DisputeDecision | null>(null);
  const [modalReason, setModalReason] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [pendingConfirmDecision, setPendingConfirmDecision] =
    useState<DisputeDecision | null>(null);
  const [, setSimilar] = useState<SimilarListing[]>([]);
  const [outcome, setOutcome] = useState<AuditEntry | null>(null);
  const isClosed =
    state.data?.status === "resolved" || state.data?.status === "dismissed";
  const caseId = state.data?.id;

  useEffect(() => {
    if (!isClosed || !caseId) return;
    let active = true;
    getAuditEntries({ entityId: caseId })
      .then((res) => {
        if (!active) return;
        const decisions = res.entries
          .filter((e) => e.action === "dispute_decision")
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
        setOutcome(decisions[0] ?? null);
      })
      .catch(() => {
        if (active) setOutcome(null);
      });

    return () => {
      active = false;
    };
  }, [isClosed, caseId]);

  const [pendingStrike, setPendingStrike] = useState<{
    userId: string;
    label: string;
    scope: "buyer" | "seller";
  } | null>(null);
  const [strikeReason, setStrikeReason] = useState("");
  const [striking, setStriking] = useState(false);
  const [strikeError, setStrikeError] = useState<string | null>(null);
  const [strikeSuccess, setStrikeSuccess] = useState<string | null>(null);
  const [struckUserIds, setStruckUserIds] = useState<Set<string>>(new Set());

  const [selectedOutcomes, setSelectedOutcomes] = useState<Outcome[]>([]);

  useEffect(() => {
    let active = true;

    dispatch({ type: "FETCH_START" });

    getCaseById(id ?? "")
      .then((data) => {
        if (active) {
          // check response though
          dispatch({
            type: "FETCH_SUCCESS",
            payload: transformCaseDetail(data),
          });
        }
      })
      .catch(() => {
        if (active) {
          dispatch({ type: "FETCH_ERROR" });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const listingId = state.data?.listingId;
    if (!listingId) return;
    (async () => {
      try {
        const [detail, browse] = await Promise.all([
          listingsService.getById(listingId),
          listingsService.getBrowseListings(),
        ]);
        setSimilar(getSimilarListings(detail, browse.listings, 4));
      } catch {
        setSimilar([]);
      }
    })();
  }, [state.data?.listingId]);

  async function handleDecision(
    decision: DisputeDecision,
    reason?: string,
    outcomes?: Outcome[],
  ) {
    if (!state.data) return;
    setSubmitting(decision);
    setDecisionError(null);
    try {
      await decideCaseWithAction(
        state.data.id,
        state.data.type as CaseType,
        decision as ButtonAction,
        reason?.trim() || undefined,
        outcomes,
      );
      setCompletedDecision(decision);
    } catch (error) {
      const apiError = error as ApiError;
      setDecisionError(
        DECISION_ERRORS[apiError.code] ??
          apiError.message ??
          "Failed to submit decision.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  function openStrikeModal(
    userId: string,
    label: string,
    scope: "buyer" | "seller",
  ) {
    setStrikeSuccess(null);
    setStrikeError(null);
    setStrikeReason("");
    setPendingStrike({ userId, label, scope });
  }
  async function handleStrikeSubmit() {
    if (!pendingStrike || !state.data) return;
    setStriking(true);
    setStrikeError(null);
    try {
      await strikeUser(
        pendingStrike.userId,
        strikeReason.trim(),
        state.data.id,
        pendingStrike.scope,
      );

      setStrikeSuccess(`Strike applied to ${pendingStrike.label}.`);
      setStruckUserIds((prev) => new Set(prev).add(pendingStrike.userId));
      setPendingStrike(null);
      setStrikeReason("");

      const fresh = await getCaseById(state.data.id);
      dispatch({ type: "FETCH_SUCCESS", payload: transformCaseDetail(fresh) });
    } catch (error) {
      const apiError = error as ApiError;
      setStrikeError(apiError.message || "Failed to apply strike.");
    } finally {
      setStriking(false);
    }
  }

  function handleDecisionClick(decision: DisputeDecision) {
    setPendingConfirmDecision(decision);
    setModalReason("");
    setSelectedOutcomes([]);
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
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <button
            type="button"
            onClick={() =>
              navigate(
                isClosed ? "/admin/disputes?view=closed" : "/admin/disputes",
              )
            }
            className="text-sky-700 hover:underline cursor-pointer"
          >
            {isClosed ? "Closed Disputes" : "Active Disputes"}
          </button>
          <IconChevronRight size={12} />
          <span className="text-gray-600"></span>
          <span className="text-gray-600">Case Review</span>
        </div>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </div>

      {/*<h1 className="text-2xl font-bold text-navy-700 dark:text-white">Case #{dispute.id}</h1>*/}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ItemPanel dispute={dispute} />

          {dispute.type === "no_show" && dispute.checkIn && (
            <CheckInPanel checkIn={dispute.checkIn} />
          )}
          {dispute.type === "listing_quality" && dispute.photos && (
            <PhotoComparisonPanel photos={dispute.photos} />
          )}

          {dispute.type === "report_listing" && dispute.photos && (
            <PhotoComparisonPanel
              photos={dispute.photos}
              title="Photos: at time of report vs now"
              labels={{
                left: "At time of report",
                right: "After seller's changes",
              }}
            />
          )}
          {dispute.type === "report_listing" && dispute.listingDiff && (
            <ListingDiffPanel diff={dispute.listingDiff} />
          )}
          {dispute.type === "report_listing" && dispute.report && (
            <ReportReasonPanel reason={dispute.report.reason} />
          )}

          <Panel title="Actions">
            <div className="flex flex-col gap-4">
              <OutlineButton
                onClick={() => {
                  if (dispute.listingId)
                    navigate(`/buyer/listings/${dispute.listingId}`);
                }}
                disabled={!dispute.listingId}
                className="text-center border-navy-700 text-navy-700"
              >
                View Listing
              </OutlineButton>

              {completedDecision ? (
                <DecisionConfirmation
                  dispute={dispute}
                  decision={completedDecision}
                  onBack={() => navigate("/admin/disputes")}
                />
              ) : isClosed ? (
                <ClosedOutcome
                  status={dispute.status ?? "resolved"}
                  resolvedAt={dispute.resolvedAt}
                  outcome={outcome}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {decisionError && (
                    <div className="text-sm text-red-600">{decisionError}</div>
                  )}

                  {dispute.suggestedDecision && (
                    <div className="flex items-start gap-2 rounded-lg border border-sky-200 px-4 py-3">
                      <IconBulb
                        size={16}
                        className="text-sky-600 shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-sky-900">
                        <span className="font-semibold">
                          System suggestion:
                        </span>{" "}
                        based on the evidence, this looks like a case to{" "}
                        <span className="font-semibold">
                          {recommendationText(dispute.suggestedDecision)}
                        </span>
                        . This is a guide — your judgement decides.
                      </p>
                    </div>
                  )}
                  <DecisionActions
                    type={dispute.type}
                    submitting={submitting}
                    onDecide={handleDecisionClick}
                    suggestedDecision={dispute.suggestedDecision}
                  />

                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                    <p className="text-xs font-medium text-gray-500">
                      Manual strike (conduct)
                    </p>
                    <p className="text-xs text-gray-500">
                      Penalise whichever party the evidence shows misbehaved —
                      including a false or vindictive reporter. Separate from
                      the decision above.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <OutlineButton
                        onClick={() =>
                          openStrikeModal(
                            dispute.seller.id,
                            dispute.seller.name || "seller","seller"
                          )
                        }
                        disabled={
                          !dispute.seller.id ||
                          struckUserIds.has(dispute.seller.id) ||
                          striking
                        }
                        className="text-center border-amber-600 text-amber-700"
                      >
                        {struckUserIds.has(dispute.seller.id)
                          ? "Struck ✓"
                          : `Strike ${dispute.seller.name || "seller"}`}
                      </OutlineButton>

                      {dispute.buyer.id && (
                        <OutlineButton
                          onClick={() =>
                            openStrikeModal(
                              dispute.buyer.id,
                              dispute.buyer.name,
                              "buyer"
                            )
                          }
                          disabled={
                            !dispute.buyer.id ||
                            struckUserIds.has(dispute.buyer.id) ||
                            striking
                          }
                          className="text-center border-amber-600 text-amber-700"
                        >
                          {struckUserIds.has(dispute.buyer.id)
                            ? "Struck ✓"
                            : `Strike ${dispute.buyer.name || "buyer"}`}
                        </OutlineButton>
                      )}
                    </div>

                    {strikeError && (
                      <p className="text-xs text-red-600">{strikeError}</p>
                    )}
                    {strikeSuccess && (
                      <p className="text-xs text-green-600">{strikeSuccess}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <PersonCard title="Seller" person={dispute.seller} />
          {dispute.type === "report_listing" && dispute.report ? (
            <PersonCard
              title="Reported by"
              person={dispute.report.reportedBy}
            />
          ) : (
            <PersonCard title="Buyer" person={dispute.buyer} />
          )}
          {dispute.type === "report_listing" && dispute.report ? (
            <Panel title="Dispute Info">
              <InfoRow label="Dispute ID" value={`#${dispute.id}`} />
              <InfoRow label="Date Placed" value={dispute.datePlaced} />
            </Panel>
          ) : (
            <>
              <Panel title="Dispute Info">
                <InfoRow label="Dispute ID" value={`#${dispute.id}`} />
                <InfoRow label="Date Placed" value={dispute.datePlaced} />
                <InfoRow label="Filed by" value={dispute.filedBy} />
              </Panel>
              <NotesPanel caseId={dispute.id} />
            </>
          )}
        </div>
      </div>

      {pendingConfirmDecision && (
        <ConfirmModal
          title={
            disputeConfirmTitles[pendingConfirmDecision] ?? "Are you sure?"
          }
          message={
            disputeConfirmMessages[pendingConfirmDecision] ??
            "This action cannot be undone."
          }
          confirmLabel={decisionLabel[pendingConfirmDecision]}
          tone={
            pendingConfirmDecision === "remove-listing" ? "danger" : "neutral"
          }
          submitting={!!submitting}
          confirmDisabled={
            pendingConfirmDecision === "side-buyer" &&
            selectedOutcomes.length === 0
          }
          reason={modalReason}
          setReason={setModalReason}
          onCancel={() => setPendingConfirmDecision(null)}
          onConfirm={() => {
            handleDecision(
              pendingConfirmDecision,
              modalReason,
              pendingConfirmDecision === "side-buyer"
                ? selectedOutcomes
                : undefined,
            );
            setPendingConfirmDecision(null);
          }}
        >
          {pendingConfirmDecision === "side-buyer" && (
            <fieldset className="mb-4 space-y-2">
              <legend className="text-xs font-medium text-gray-700 mb-1.5">
                Outcomes to apply <span className="text-red-500">*</span>
              </legend>
              {OUTCOME_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={selectedOutcomes.includes(value)}
                    onChange={(e) =>
                      setSelectedOutcomes((prev) =>
                        e.target.checked
                          ? [...prev, value]
                          : prev.filter((o) => o !== value),
                      )
                    }
                  />
                  <span>
                    {label}
                    {dispute.suggestedOutcomes?.includes(value) && (
                      <span className="ml-2 text-xs text-sky-600">
                        Suggested
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
        </ConfirmModal>
      )}

      {pendingStrike && (
        <ConfirmModal
          title={`Strike ${pendingStrike.label}?`}
          message="This applies a manual conduct strike to this user's account. They will be notified. This is separate from the dispute decision."
          confirmLabel="Apply strike"
          tone="danger"
          submitting={striking}
          reason={strikeReason}
          setReason={setStrikeReason}
          onCancel={() => {
            setPendingStrike(null);
            setStrikeReason("");
          }}
          onConfirm={handleStrikeSubmit}
        />
      )}
    </div>
  );
}
function recommendationText(d: DisputeDecision): string {
  if (d === "uphold") return "side with the buyer";
  if (d === "dismiss") return "side with the seller";
  return "review carefully";
}
function ItemPanel({ dispute }: Readonly<{ dispute: DisputeCase }>) {
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
            <img
              src={dispute.item.imageUrl}
              alt={dispute.item.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sky-700">
            {dispute.item.title}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Condition: {dispute.item.condition}
          </p>
          <p className="text-xs text-gray-600">
            Category: {dispute.item.category}
          </p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
        <InfoRow label="Item price" value={dispute.item.price} />
        <InfoRow
          label="Status"
          value={<StatusBadge label={dispute.item.status} tone="blue" />}
        />
      </div>
    </Panel>
  );
}

function CheckInPanel({
  checkIn,
}: Readonly<{ checkIn: NonNullable<DisputeCase["checkIn"]> }>) {
  return (
    <Panel title="Check-in and PIN evidence">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Buyer checked in</p>
          <StatusLine
            ok={checkIn.buyerCheckedIn}
            okLabel={`Checked in at ${checkIn.buyerCheckInTime ?? ""}`}
            notOkLabel="Not checked in"
          />
        </div>
        <div className="border border-gray-100 dark:border-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Seller checked in</p>
          <StatusLine
            ok={checkIn.sellerCheckedIn}
            okLabel={`Checked in at ${checkIn.sellerCheckInTime ?? ""}`}
            notOkLabel="Not checked in"
          />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
        <InfoRow
          label="PIN status"
          value={checkIn.pinEntered ? "Entered" : "Not entered"}
        />
        <InfoRow label="Check-in window" value={checkIn.checkInWindow} />
      </div>
    </Panel>
  );
}

function StatusLine({
  ok,
  okLabel,
  notOkLabel,
}: Readonly<{ ok: boolean; okLabel: string; notOkLabel: string }>) {
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

function PhotoComparisonPanel({
  photos,
  title = "Listing snapshot vs buyer photos",
  labels,
}: Readonly<{
  photos: NonNullable<DisputeCase["photos"]>;
  title?: string;
  labels?: { left: string; right: string };
}>) {
  const apiBase = getApiUrl();
  const leftLabel = labels?.left ?? "Snapshot at Reservation";
  const rightLabel = labels?.right ?? "Buyer's Photos";
  const resolveUrl = (url: string) =>
    url.startsWith("/api") ? `${apiBase}${url.replace(/^\/api/, "")}` : url;
  return (
    <Panel title={title}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">{leftLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {photos.snapshotPhotos.map((url, i) => (
              <div
                key={`snapshot-${i}`}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-2xl"
              >
                <img
                  src={resolveUrl(url)}
                  alt={`Snapshot ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">{rightLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {photos.buyerPhotos.map((url, i) => (
              <div
                key={`buyer-${i}`}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center overflow-hidden"
              >
                {url && (
                  <img
                    src={resolveUrl(url)}
                    alt={`Snapshot ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
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
        <IconAlertTriangle
          size={18}
          className="text-gray-500 shrink-0 mt-0.5"
        />
        <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">
          {reason}
        </p>
      </div>
    </Panel>
  );
}

function ListingDiffPanel({
  diff,
}: Readonly<{
  diff: { original: ListingSnapshot; current: ListingSnapshot };
}>) {
  const { original, current } = diff;
  const rows = [
    { label: "Title", before: original.title, after: current.title },
    {
      label: "Price",
      before: `R${original.price.toFixed(2)}`,
      after: `R${current.price.toFixed(2)}`,
    },
    {
      label: "Condition",
      before: original.condition,
      after: current.condition,
    },
    {
      label: "Description",
      before: original.description,
      after: current.description,
    },
  ].map((r) => ({ ...r, changed: r.before !== r.after }));

  return (
    <Panel title="Listing details: at time of report vs now">
      <div className="grid grid-cols-[100px_1fr_1fr] gap-x-4 gap-y-3">
        <div />
        <p className="text-xs font-bold text-gray-600">At time of report</p>
        <p className="text-xs font-bold text-gray-600">Now</p>

        {rows.map((row) => (
          <div key={row.label} className="contents">
            <p className="text-xs font-medium text-gray-500 self-start pt-0.5">
              {row.label}
            </p>
            <p
              className={`text-sm ${row.changed ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-white/80"}`}
            >
              {row.before}
            </p>

            <p
              className={`text-sm ${row.changed ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-700 dark:text-white/80"}`}
            >
              {row.after}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DecisionConfirmation({
  dispute,
  decision,
  onBack,
}: Readonly<{
  dispute: DisputeCase;
  decision: DisputeDecision;
  onBack: () => void;
}>) {
  const isFinal = finalDecisions.includes(decision);

  return (
    <div>
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border ${
          isFinal
            ? "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20"
            : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
        }`}
      >
        {isFinal ? (
          <IconMail size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <IconCircleCheck
            size={18}
            className="text-amber-600 flex-shrink-0 mt-0.5"
          />
        )}
        <div>
          <p className="text-sm font-semibold text-navy-700 dark:text-white">
            {decisionLabel[decision]}
          </p>
          {isFinal ? (
            <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
              {dispute.buyer.name} and {dispute.seller.name} will be notified of
              this outcome by email.
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
        className="mt-4 text-xs font-semibold text-sky-700 hover:underline"
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
}: Readonly<{
  type: DisputeType;
  submitting: DisputeDecision | null;
  onDecide: (d: DisputeDecision) => void;
  suggestedDecision?: DisputeDecision;
}>) {
  if (type === "no_show") {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <DecisionButton
          tone="danger"
          disabled={!!submitting}
          onClick={() => onDecide("uphold")}
        >
          {submitting === "uphold" ? "Upholding…" : "Uphold"}
        </DecisionButton>
        <DecisionButton
          tone="neutral"
          disabled={!!submitting}
          onClick={() => onDecide("dismiss")}
        >
          {submitting === "dismiss" ? "Dismissing…" : "Dismiss"}
        </DecisionButton>
      </div>
    );
  }

  if (type === "listing_quality") {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <DecisionButton
          tone="success"
          disabled={!!submitting}
          onClick={() => onDecide("side-buyer")}
        >
          {submitting === "side-buyer" ? "Saving…" : "Side with Buyer"}
        </DecisionButton>
        <DecisionButton
          tone="neutral"
          disabled={!!submitting}
          onClick={() => onDecide("side-seller")}
        >
          {submitting === "side-seller" ? "Saving…" : "Side with Seller"}
        </DecisionButton>
        <DecisionButton
          tone="danger"
          disabled={!!submitting}
          onClick={() => onDecide("dismiss")}
        >
          {submitting === "dismiss" ? "Dismissing…" : "Dismiss"}
        </DecisionButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <DecisionButton
        tone="danger"
        disabled={!!submitting}
        onClick={() => onDecide("remove-listing")}
      >
        {submitting === "remove-listing" ? "Banning..." : "Ban Listing"}
      </DecisionButton>
      <DecisionButton
        tone="neutral"
        disabled={!!submitting}
        onClick={() => onDecide("warn-seller")}
      >
        {submitting === "warn-seller" ? "Removing..." : "Remove Listing"}
      </DecisionButton>
      <DecisionButton
        tone="neutral"
        disabled={!!submitting}
        onClick={() => onDecide("dismiss")}
      >
        {submitting === "dismiss" ? "Dismissing…" : "Dismiss Report"}
      </DecisionButton>
    </div>
  );
}

function describeAuditDecision(newValue?: string | null): {
  headline: string;
  details: string[];
} {
  const raw = (newValue ?? "").toLowerCase();
  const [decisionPart, outcomesPart = ""] = raw.split(":");
  const decision = decisionPart.replace(/[_\s]/g, "");
  const outcomeKeys = outcomesPart
    .split(",")
    .map((s) => s.replace(/[_\s]/g, ""))
    .filter(Boolean);

  const outcomeLabels: Record<string, string> = {
    strike: "A strike was issued to the seller",
    removelisting: "The listing was removed",
    warnsellerresubmit:
      "The listing was removed; the seller may correct and resubmit",
    refusalflag: "The seller was flagged for refusing photos",
  };

  const headline = decision.startsWith("uphold")
    ? "Dispute upheld"
    : decision.startsWith("dismiss")
      ? "Dispute dismissed"
      : decision.startsWith("requestinfo")
        ? "More information requested"
        : "Dispute resolved";

  return {
    headline,
    details: outcomeKeys.map((k) => outcomeLabels[k]).filter(Boolean),
  };
}

function ClosedOutcome({
  status,
  resolvedAt,
  outcome,
}: Readonly<{
  status: string;
  resolvedAt?: string;
  outcome: AuditEntry | null;
}>) {
  const fallback =
    status === "dismissed" ? "Dispute dismissed" : "Dispute resolved";
  const { headline, details } = outcome
    ? describeAuditDecision(outcome.newValue)
    : { headline: fallback, details: [] as string[] };
  const decidedAt = outcome?.timestamp ?? resolvedAt;
  const dismissed = status === "dismissed";

  return (
    <div
      className={`rounded-lg border p-4 ${dismissed ? "bg-gray-50 border-gray-100" : "bg-green-50 border-green-100"}`}
    >
      <div className="flex items-start gap-3">
        <IconCircleCheck
          size={18}
          className={`${dismissed ? "text-gray-500" : "text-green-600"} flex-shrink-0 mt-0.5`}
        />
        <div>
          <p className="text-sm font-semibold text-navy-700 dark:text-white">
            {headline}
          </p>
          {details.map((d) => (
            <p
              key={d}
              className="text-xs text-gray-500 dark:text-white/60 mt-1"
            >
              {d}
            </p>
          ))}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-white/5">
        <InfoRow
          label="Decided on"
          value={
            decidedAt ? new Date(decidedAt).toLocaleString("en-ZA") : "Unknown"
          }
        />
        <InfoRow
          label="Admin reason"
          value={outcome?.reason || "No reason recorded"}
        />
      </div>
    </div>
  );
}
