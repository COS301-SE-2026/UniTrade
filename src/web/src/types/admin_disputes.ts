export type CaseType =
  | "verification"
  | "listing_quality"
  | "report_listing"
  | "no_show";

export type CaseStatus = "pending" | "resolved" | "under_review" | "dismissed";
export type SnapshotStatus = 'live' | 'pending' | 'draft' | 'rejected' | 'reserved' | 'sold'

export type Decision =
  | "approve"
  | "reject"
  | "resubmit"
  | "uphold"
  | "dismiss"
  | "request_info";

//assumptions for now as I'm waiting for som confirmation from backend
export type Outcome = "strike" | "remove_listing" | "refusal_flag";

export type PinStatus =
  | "not_entered"
  | "entered_incorrect"
  | "entered_correct"
  | "pending"
  | "confirmed";

export type VerificationStatus = "verified" | "pending" | "rejected";

//for the admintoken this is not clear, so might change aftetr confirmation from backend

export interface AdminTokenClaims {
  sub: string;
  role: "admin" | "student";
  exp: number;
  iat: number;
}

//evidence types
export interface VerificationEvidence {
  university: string;
  degree: string;
  year: number;
  email: string;
  proofDocumentUrl?: string; //the url to the actual proof of registration
}

export interface ListingQualityEvidence {
  snapshot: ListingSnapshot;
  photos: string[];
  sellerRefusedPhotos: boolean;
}

export interface ReportListingEvidence {
  listingId: string;
  reportReason: string;
  snapshot: ListingSnapshot;
}

export interface NoShowEvidence {
  meetupId: string;
  buyerCheckedIn: boolean;
  sellerCheckedIn: boolean;
  pinStatus: PinStatus;
  meetupWindowStart: string;
  meetupWindowEnd: string;
}

//the actual listing snapshot
export interface ListingSnapshot {
  listingId: string;
  reservationId: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  courseTags: string[];
  photoRefs: string[];
  capturedAt: string;
  status: SnapshotStatus;
  categoryName?: string;
}

export interface CaseEvidence {
  // verification
  university?: string;
  degree?: string;
  year?: number;
  email?: string;
  domainValid?: boolean;
  proofDocument?:string;
  // listing_quality
  snapshot?: ListingSnapshot;
  buyerPhotos?: string[];
  sellerRefusedPhotos?: boolean;
  currentListingStatus?: string | null;
  //report_listing
  listingId?: string;
  reportReason?: string;
  //no_show
  meetupId?: string;
  buyerCheckedIn?: boolean;
  buyerCheckInTime?: string | null;
  sellerCheckedIn?: boolean;
  sellerCheckInTime?: string | null;
  pinStatus?: string;
  checkInWindowClosesAt?: string | null;

}

export interface CaseSummary {
  caseId: string;
  type: CaseType;
  status: CaseStatus;
  subjectUserId: string;
  submittedAt: string;
  ageHours: number;
  slaHours: number;
  slaBreached: boolean;
  title?: string;
  subjectInitials?: string;
  counterpartyInitials?: string;
  subjectName?: string;
  subjectDegree?: string;
  subjectYear?: number;
  hasDocument?: boolean;
}
export interface PartySummary {
  userId: string;
  name: string;
  initials: string;
  faculty: string | null;
  reviewAverage: number;
  reputationScore: number;
  strikeCount: number;
  reviewCount: number;
}
export interface CaseDetail extends CaseSummary {
  subject: PartySummary;
  counterParty?: PartySummary;
  evidence: CaseEvidence;
  history: unknown[];
  filedByRole: string;
  filedByUserId?: string;
  slaHours: number;
  slaBreached: boolean;
  suggestedDecision?: 'uphold'|'dismiss';
  suggestedOutcomes?: string[];
}

export interface CaseHistoryEntry {
  timestamp: string;
  actor: string;
  action: string;
  details?: Record<string, unknown>;
}

export interface DecisionRequest {
  decision: Decision;
  outcomes?: Outcome[];
  reason?: string;
}
//dispute filing tuypes
export interface NoShowFiling {
  type: "no_show";
  reservationId: string;
  description?: string;
}

export interface ListingQualityFiling {
  type: "listing_quality";
  reservationId: string;
  sellerRefusedPhotos: boolean;
  photos?: string[];
  description?: string;
}

export interface ReportListingFiling {
  type: "report_listing";
  listingId: string;
  description: string;
}

export type DisputeFiling =
  | NoShowFiling
  | ListingQualityFiling
  | ReportListingFiling;

export interface Strike {
  strikeId: string;
  userId: string;
  type: Outcome;
  reason: string;
  sourceCaseId: string;
  createdByAdminId: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

export interface UserReputation {
  userId: string;
  name: string;
  email: string;
  universityName: string;
  degree: string;
  year: number;
  verificationStatus: VerificationStatus;
  reviewAverage: number;
  reputationScore: number;
  reviewCount: number;
  strikes: Strike[];
}

export interface UserListItem {
  userId: string;
  name: string;
  email: string;
  degree: string;
  year: number;
  verificationStatus: VerificationStatus;
  reviewAverage: number;
  reputationScore: number;
  strikeCount: number;
}

export type PublishListingResponse = Record<string, never>;

export interface PublishListingError {
  error: "SELLER_NOT_VERIFIED";
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  error?: string;
}

export type ListCasesResponse = {
  cases: CaseSummary[];
  total?: number;
};

export interface FileCaseResponse {
  caseId: string;
}

export type GetCaseResponse = CaseDetail;
export type DecideCaseResponse = CaseDetail;

export interface ListAuditResponse {
  entries: AuditEntry[];
  total: number;
}
export type GetListingSnapshotResponse = ListingSnapshot;

export interface ListUsersResponse {
  users: UserListItem[];
  total: number;
}

export interface ListCasesParams {
  type?: CaseType;
  status?: CaseStatus;
  sort?: "age" | "ageDesc";
  page?: number;
  limit?: number;
}

export interface ListAuditParams {
  entityId?: string;
  actorId?: string;
  page?: number;
  limit?: number;
}

export interface ListUserParams {
  verificationStatus?: VerificationStatus;
  hasStrikes?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserListing {
  listingId: string;
  title: string;
  status: string;
  price: number;
  createdAt: string;
  imageUrl?: string | null;
}
