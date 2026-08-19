import { useState } from 'react'
import { useNavigate } from 'react-router'


const MOCK_USERS = [
 { id: '1',
  name: 'Tafadzwa Musiiwa',
  intitials: 'TM',
  degree: 'BSc Comp Sci, Y2',
  verificationStatus: 'Verified',
  reputation: 85,
  strikesCount: 2,
},
{id: '2',
  name: 'Tafadzwa Musiiwa',
  intitials: 'TM',
  degree: 'BSc Comp Sci, Y2',
  verificationStatus: 'Verified',
  reputation: 80,
  strikesCount: 2,
},
{id: '3',
  name: 'Tafadzwa Musiiwa',
  intitials: 'TM',
  degree: 'BSc Comp Sci, Y2',
  verificationStatus: 'Verified',
  reputation: 85,
  strikesCount: 2,
},
]

export default function Users() {
    const navigate= useNavigate()
  const [filter, setFilter] = useState<'all' | 'strikes' | 'verified' | 'pending'>('all') 
  const filteredUsers = MOCK_USERS.filter((user) => {
    if (filter === 'strikes') return user.strikesCount > 0
    if (filter === 'verified') return user.verificationStatus === 'Verified'
    if (filter === 'pending') return user.verificationStatus === 'Pending'
    return true
  })


  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Listig Queue</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}