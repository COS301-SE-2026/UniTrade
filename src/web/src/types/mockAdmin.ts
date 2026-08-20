//need to replace this whole file and then putting it inot the listsitngs file 
//once the backend points are set up
import textbook from '../assets/bio-textbook.jpg'

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

export type ListingRiskLevel = 'High Risk' | 'Medium Risk' | 'Low Risk'
export type ListingQueueDecision = 'approve' | 'reject' | 'flag'

export interface CaseNote {
    id:string
    author: string
    content: string
    createdAt: string
}

export interface ListingQueueItem {
  id: string
  title: string
  moduleCode: string
  price: string
  condition: string
  category: string
  description: string
  imageUrl: string
  risk: ListingRiskLevel
  riskReasons: string[]
  submittedAgo: string
  seller: PersonSummary
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

const Mahadio: PersonSummary = {
    id: 'user-1',
    initials: 'MT',
    name: 'Mahadio Tlaka',
    faculty: 'EBIT',
    reputationScore: 75,
    reviewAverage: 4.5,
    reviewCount: 12
}

const Tafadzwa: PersonSummary = {
    id: 'user-2',
    initials: 'TM',
    name: 'Tafadzwa Musiiwa',
    faculty: 'EBIT',
    reputationScore: 90,
    reviewAverage: 4.8,
    reviewCount: 20
}

const Zelamene: PersonSummary = {
  id: 'user-4',
  initials: 'ZS',
  name: 'Zelamene Shazi',
  faculty: 'EBIT',
  reputationScore: 82,
  reviewAverage: 4.6,
  reviewCount: 14,
}

/*const Sabira: PersonSummary = {
  id: 'user-3',
  initials: 'SK',
  name: 'Sabira Kaire',
  faculty: 'EBIT',
  reputationScore: 88,
  reviewAverage: 4.8,
  reviewCount: 15,
}*/


const mockDisputes: DisputeCase[] = [
    {
        id: 'dispute-1',
        type: 'no-show',
        item: {
            title: 'Difficult calculas textbook',
            condition: 'Like new',
            category: 'Textbook',
            moduleCode: 'WTW 114',
            price: 'R850',
            status: 'Reserved',
            imageUrl: textbook
        },
        buyer: Mahadio,
        seller: Tafadzwa,
        datePlaced: '12 March 2026',
        filedBy: 'Buyer',
        checkIn: {
            buyerCheckedIn: false,
            sellerCheckedIn: true,
            sellerCheckInTime: '10:15',
            pinEntered: false,
            checkInWindow: '10:00 - 10:30'
        },
    },
    {
        id: 'dispute-2',
        type: 'listing-quality',
        item: {
            title: 'Difficult calculas textbook',
            condition: 'Like new',
            category: 'Textbook',
            moduleCode: 'WTW 114',
            price: 'R850',
            status: 'Reserved',
            imageUrl: textbook
        },
        buyer: Mahadio,
        seller: Tafadzwa,
        datePlaced: '12 March 2026',
        filedBy: 'Buyer',
        photos: {
            snapshotPhotos: [textbook, textbook],
            buyerPhotos: [textbook]
        },
    },
    {
        id: 'dispute-3',    
        type: 'report-listing',
        item: {
            title: 'Difficult calculas textbook',
            condition: 'Like new',
            category: 'Textbook',
            moduleCode: 'WTW 114',
            price: 'R850',
            status: 'Live',
            imageUrl: textbook
        },
        buyer: Mahadio,
        seller: Tafadzwa,
        datePlaced: '12 March 2026',
        filedBy: 'Buyer',
        report: {
            reason: 'The book is not in good quality as was desribed in the listing',
            reportedBy: Mahadio
        },
    },
]

const mockVerifications: VerificationCase[] = [
    {
        id: 'verification-1',
        applicant: Mahadio,
        university: 'University of Pretoria',
        degree: 'BSC Computer Science',
        email: 'u23545098@tuks.co.za',
        domainValid: true,
        document: {
            name: 'Proof of Registration.pdf',
            uploadedDate: '12 March 2026',
            sizeLabel: '1.2 MB',
            url: 'minions the rise of gru'
        },
        submittedDate: '12 March 2026',
        slaLabel: '2.5 days ago- overdue',
        slaOverdue: true
    },
]

/*const sabira: PersonSummary = {
    id: 'user-3',
    initials: 'SK',
    name: 'Sabira Kaire',
    faculty: 'EBIT',
    reputationScore: 88,
    reviewAverage: 4.8,
    reviewCount: 15,
}*/

const mockReputationProfiles: UserReputationProfile[] = [
    {
        id: 'user-1',
        name: 'Mahadio Tlaka',
        initials: 'MT',
        faculty: 'EBIT',
        university: 'University of Pretoria',
        memberSince: '12 March 2026',
        reviewAverage: 4.5,
        reviewCount: 12,
        reputationScore: 75,
        strikes: [
        {
            id: 'strike-1',
            reason: 'No-show for a reserved listing',
            date: '12 March 2026',
            issuedBy: 'Admin'
        },
        {
            id: 'strike-2',
            reason: 'Poor quality listing reported by buyer',
            date: '15 March 2026',
            issuedBy: 'Admin'
        },
    ],
},
]


const mockListingQueue: ListingQueueItem[] = [
  {
    id: 'LQ-1001',
    title: 'Chemistry Textbook - 3rd Ed',
    moduleCode: 'CMY127',
    price: 'R200',
    condition: 'Good',
    category: 'Book',
    description: 'Chemistry textbook, 3rd edition, some highlighting in the first three chapters. Selling because I switched modules.',
    imageUrl: textbook,
    risk: 'High Risk',
    riskReasons: ['Price is 40% below similar listings', 'Seller account created 2 days ago'],
    submittedAgo: '2h ago',
    seller: Tafadzwa,
  },
  {
    id: 'LQ-1002',
    title: "HP Laptop 15' - Good condition",
    moduleCode: '-',
    price: 'R4500',
    condition: 'Good',
    category: 'Electronics',
    description: 'HP Laptop, 15 inch, 8GB RAM, 256GB SSD. Light wear on the lid, works perfectly. Charger included.',
    imageUrl: textbook,
    risk: 'High Risk',
    riskReasons: ['High-value electronics item', 'No proof of ownership attached'],
    submittedAgo: '4h ago',
    seller: Zelamene,
  },
  {
    id: 'LQ-1003',
    title: 'Calculus - Early Transcendentals',
    moduleCode: 'WTW114',
    price: 'R350',
    condition: 'Fair',
    category: 'Book',
    description: 'Calculus textbook, some water damage on the back cover but all pages intact and readable.',
    imageUrl: textbook,
    risk: 'Medium Risk',
    riskReasons: ['Condition described as "Fair" — flagged for photo review'],
    submittedAgo: '8h ago',
    seller: Tafadzwa,
  },
  {
    id: 'LQ-1004',
    title: 'Physics Lab Manual 2024',
    moduleCode: 'PHY114',
    price: 'R150',
    condition: 'Good',
    category: 'Book',
    description: 'This year\'s lab manual, barely used, no writing inside.',
    imageUrl: textbook,
    risk: 'Medium Risk',
    riskReasons: ['Duplicate title recently listed by another seller'],
    submittedAgo: '10h ago',
    seller: Zelamene,
  },
]

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 200))

export async function getMockDisputes(): Promise<DisputeCase[]> {
  return delay(mockDisputes)
}

export async function getMockDisputeById(id: string): Promise<DisputeCase | undefined> {
  return delay(mockDisputes.find((d) => d.id === id))
}

export async function getMockVerifications(): Promise<VerificationCase[]> {
  return delay(mockVerifications)
}

export async function getMockVerificationById(id: string): Promise<VerificationCase | undefined> {
  return delay(mockVerifications.find((v) => v.id === id))
}

export async function getMockUserReputation(id: string): Promise<UserReputationProfile | undefined> {
  return delay(mockReputationProfiles.find((p) => p.id === id) ?? mockReputationProfiles[0])
}


const mockCaseNotes: Record<string, CaseNote[]> = {
  'UT-2024-00481': [
    {
      id: 'n-1',
      author: 'Admin User',
      content: 'Reached out to seller for their side before making a call on this one.',
      createdAt: '12 May 2026, 15:10',
    },
  ],
}

export async function getMockCaseNotes(caseId: string): Promise<CaseNote[]> {
  return delay(mockCaseNotes[caseId] ?? [])
}

export async function addMockCaseNote(caseId: string, content: string, author = 'Admin User'): Promise<CaseNote> {
  const note: CaseNote = {
    id: `n-${Date.now()}`,
    author,
    content,
    createdAt: new Date().toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }
  mockCaseNotes[caseId] = [...(mockCaseNotes[caseId] ?? []), note]
  return delay(note)
}

export async function getMockUsers(): Promise<UserReputationProfile[]> {
  return delay(mockReputationProfiles)
}

export async function getMockListingQueue(): Promise<ListingQueueItem[]> {
  return delay(mockListingQueue)
}

export async function getMockListingQueueItem(id: string): Promise<ListingQueueItem | undefined> {
  return delay(mockListingQueue.find((l) => l.id === id))
}
