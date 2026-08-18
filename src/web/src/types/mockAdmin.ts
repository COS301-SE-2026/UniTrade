//need to replace this whole file and then putting it inot the listsitngs file 
//once the backend points are set up
import textbook from 'assets/bio-textbook.jpg'

export type DisputeType = 'no-show' | 'listing-quality' | 'report-listing'

export type DisputeDecision = 'uphold' | 'dismiss' | 'more-info' | 'side-buyer' | 'side-seller' | 'remove-listing' | 'warn-seller'

export type VerificationDecision = 'approve' | 'resubmit' | 'reject'

export interface PersonSummary {
    id:string
    initials:string
    name: string
    faculty: string
    reputationScore: number
    reviewAverage: number
    reviewCount: number
}

export interface Strike {
    id: string
    reason: string
    date: string
    issuedBy: string
}

export interface DisputeItem {
    title: string
    condition: string
    category: string
    moduleCode: string
    price: string
    status: 'Reserved' | 'Disputed' | 'Live' | 'Resolved'
    imageUrl?: string
}

export interface CheckInEvidence {
    buyerCheckedIn: boolean
    buyerCheckInTime?: string
    sellerCheckedIn: boolean
    sellerCheckInTime?: string
    pinEntered: boolean
    checkInWindow: string
}

export interface ListingPhotos {
    snapshotPhotos: string[]
    buyerPhotos: string[]
}

export interface ReportInfo {
  reason: string
  reportedBy: PersonSummary
}

export interface DisputeCase {
  id: string
  type: DisputeType
  item: DisputeItem
  buyer: PersonSummary
  seller: PersonSummary
  datePlaced: string
  filedBy: 'Buyer' | 'Seller'
  checkIn?: CheckInEvidence
  photos?: ListingPhotos
  report?: ReportInfo
  decision?: DisputeDecision
  decisionNote?: string
}

export interface VerificationCase {
  id: string
  applicant: PersonSummary
  university: string
  degree: string
  email: string
  domainValid: boolean
  document: { name: string; 
              uploadedDate: string; 
              sizeLabel: string; 
              url: string 
            }
  submittedDate: string
  slaLabel: string
  slaOverdue: boolean
  decision?: VerificationDecision
}

export interface UserReputationProfile {
  id: string
  name: string
  initials: string
  faculty: string
  university: string
  memberSince: string
  reviewAverage: number
  reviewCount: number
  reputationScore: number
  strikes: Strike[]
}