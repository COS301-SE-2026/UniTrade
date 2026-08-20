
import  React  from 'react'
import { useNavigate, useParams } from 'react-router'
import { IconSearch, IconArrowLeft, IconStar, IconPointFilled } from "@tabler/icons-react"

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
  '3': {
    id: '3',
    name: 'Sipho Dlamini',
    initials:'SD',
    degree:'BSc Comp Sci, Y1',
    university:'University of Pretoria',
    verificationStatus:'Verified',
    reputation: 95,
    strikesCount: 1,
    strikes: [
      {
        id: 's3',
        reason:'Late Dispatch',
        details:'Failed to ship item within agreed 48-hour window.',
        date: '02 Aug 2026',
        caseId: '#UT-2026-00891',
      },
    ],
    recentListings: [
      { id: 'l4', title:'Linear Algebra Notes', status:'Live' },
    ],
  },
}

export default function ViewUser() {
    const {userId} = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const user = userId ? MockUsers[userId] : null
    
    if (!user) {  
      return(
        <div className="p-8 space y-4 max-w-6xl">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center space-x-1 text-sm text-gray-800 hover:text-black transition-colors cursor-pointer"
          >
            <IconArrowLeft size={16} />
            <span>Back to Users</span>
          </button>
          <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">User with ID <strong>{userId}</strong> not found.</div>     
        </div>
      )
      }

  return (
    <div className="p-8 space-y-4 max-w-6xl">
        <div className="relative max-w-md">
        <IconSearch className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
        <input
          type="text"
          placeholder='search...'
  className="w-full pl-9 pr-4 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
      </div>

      <button
        type="button"
        onClick={() => navigate('/admin/users')}
        className="flex items-center space-x-1 text-sm font-semibold text-gray-800 hover:text-black transition-colors cursor-pointer"
      >
        <IconArrowLeft className="w-4 h-4" />
        <span>Back to users</span>
      </button>

        <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-[#0a1931] text-white flex items-center justify-center font-bold text-xl">
          {user.initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-xs text-gray-500">
           <span>{user.degree}</span>
           <IconPointFilled className="w-2 h-2 text-gray-400 shrink-0"/>
           <span>{user.university} </span>
          </p>
          <div className="mt-1">
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                user.verificationStatus === 'Verified'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {user.verificationStatus}
            </span>
          </div>
        </div>
      </div>

    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Listig Queue</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>

<div className="col-span-5 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Reputation</h2>
      <div className="flex items-center space-x-1 text-amber-500">
        {
          [...Array(5)].map((_, index) => (
            <IconStar key={index} className="w-5 h-5 fill-current " />
          ))
        }
      </div>
      <div className="text-3xl font-bold text-gray-900">{user.reputation}%</div>
      </div>

      <div className= "bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
       <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Actions</h2>
      <div className="space-y-2">
     <button
    type="button"
    className="w-full py-2 px-4 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
     Message user
      </button>

    <button
    type="button"
    className="w-full py-2 px-4 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
    View all Listings
    </button>

    </div>

     </div>
      </div>
      </div>
      </div>
  )
}