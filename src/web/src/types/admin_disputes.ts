
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

}

export interface NoShowEvidence {

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