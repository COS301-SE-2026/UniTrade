
import  React  from 'react'
import { useNavigate, useParams } from 'react-router'
import { IconSearch, IconArrowLeft, IconStar } from "@tabler/icons-react"

const MockUsers: Record<string, any> = {
  '1': {
     id: '1',
    name: 'Tafadzwa Musiiwa',
    intitials: 'TM',
    degree: 'BSc Comp Sci, Y2',
    verificationStatus: 'Verified',
    reputation: 85,
    strikesCount: 2,
    strikes: [
      {
        id: 's1',
        reason: 'Listing quality mismatch',
        details: 'Items did not match reservation snapshot.',
        date: '14 May 2026',
        caseId: '#UT-2026-00512', 
      },
      {
        id:'s2',
        reason:'Refused photo request',
        details:'Seller declined to provide additional photos during a dispute review',
        date: '14 May 2026',
        caseId: '#UT-2026-00512',
      },
    ],
    recentListings: [
      { id: 'l1', title: 'Calculus - Early Transcendentals', status: 'Reserved' },
      { id: 'l2', title: 'Data Structures Notes', status: 'Live' },
    ],
  },
  '2': {
    id: '2',
    name: 'Kudzai Moyo',
    initials: 'KM',
    degree: 'BCom Informatics, Y3',
    university: 'University of Pretoria',
    verificationStatus: 'Pending',
    reputation: 80,
    strikesCount: 0,
    strikes: [],
    recentListings: [
      { id: 'l3', title: 'Database Systems Textbook', status: 'Live' },
    ],
  },
}

export default function ViewUser() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Listig Queue</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}