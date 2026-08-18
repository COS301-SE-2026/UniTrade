
export type CaseType =
       | 'verification'
       | 'listing_quality'
       | 'report_listing'
       |'no_show'

export type CaseStatus =
       | 'pending'
       | 'resolved'

export type VerificationDecision =
       | 'approve'
       | 'reject'
       | 'resubmit'

export type DisputeDecision =
       | 'uphold'
       | 'dismiss'
       | 'request_info'

//assumptions for now as I'm waiting for som confirmation from backend
export type Outcome = 
       | 'strike'
       | 'removeListing'
       | 'refusalFlag'

export type PinStatus =
       | 'not_entered'
       | 'entered_incorrect'
       | 'entered_correct'
   
export type VerificationStatus = 'verified' | 'pending' | 'rejected';

//for the admintoken this is not clear, so might change aftetr confirmation from backend

export interface AdminTokenClaims {
    sub: string;
    role: 'admin' | 'student';
    exp: number;
    iat: number;
}


//evidence types 
export interface VerificationEvidence {
    university: string;
    degree: string;
    year: number;
    email: string;
    proofDocumentUrl: string; //the url to the actual proof of registration
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
}

//discriminated union keyed by casetype
export type TypedCase = 
    | {
        type: 'verification';
        evidence: VerificationEvidence;
        allowedDecisions: VerificationDecision[];
    }
    | {
        type: 'listing_quality';
        evidence: ListingQualityEvidence;
        allowedDecisions: DisputeDecision[]
    }
    | {
        type: 'no_show';
        evidence: NoShowEvidence;
        allowedDecisions: DisputeDecision[];
    };

export interface CaseSummary {
    caseId: string;
    type: CaseType;
    status: CaseStatus;
    subjectUserId: string;
    submittedAt: string;
    ageHours: number;
}

export interface CaseDetail extends CaseSummary {
    evidence: TypedCase['evidence'];
    history: CaseHistoryEntry[];
}

export interface CaseHistoryEntry {
    timestamp: string;
    actor: string;
    action: string;
    details?: Record<string, unknown>;
}

//decision types

export interface VerificationDecisionRequest {
    caseType: 'verification';
    decision: VerificationDecision;
    reason?: string;
}

export type DisputeDecisionRequest = 
    | {
        caseType: 'listing_quality' | 'report_listing' | 'no_show';
        decision: 'uphold';
        outcomes: [Outcome, ...Outcome[]];
        reason?: string;
    }
    | {
        caseType: 'listing_quality' | 'report_listing' | 'no_show';
        decision: 'dismiss' | 'request_info';
        outcomes?: never;
        reason?: string;
    }

export type DecisionRequest = VerificationDecisionRequest | DisputeDecisionRequest;