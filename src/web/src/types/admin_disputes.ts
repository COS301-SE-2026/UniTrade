
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