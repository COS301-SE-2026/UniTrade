
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
   