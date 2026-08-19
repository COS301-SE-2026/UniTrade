import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { IconSearch, IconRadio } from "@tabler/icons-react"

const MOCK_USERS = [
  {
    id: '1',
    name: 'Tafadzwa Musiiwa',
    intitials: 'TM',
    degree: 'BSc Comp Sci, Y2',
    verificationStatus: 'Verified',
    reputation: 85,
    strikesCount: 2,
  },
  {
    id: '2',
    name: 'Tafadzwa Musiiwa',
    intitials: 'TM',
    degree: 'BSc Comp Sci, Y2',
    verificationStatus: 'Verified',
    reputation: 80,
    strikesCount: 2,
  },
  {
    id: '3',
    name: 'Tafadzwa Musiiwa',
    intitials: 'TM',
    degree: 'BSc Comp Sci, Y2',
    verificationStatus: 'Verified',
    reputation: 85,
    strikesCount: 2,
  },
]

export default function Users() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'strikes' | 'verified' | 'pending'>('all')
  const filteredUsers = MOCK_USERS.filter((user) => {
    if (filter === 'strikes') return user.strikesCount > 0
    if (filter === 'verified') return user.verificationStatus === 'Verified'
    if (filter === 'pending') return user.verificationStatus === 'Pending'
    return true
  })


  return (
    <div className='p-8 space-y-6 max-w-6xl'>
      <div className="relative max-w-md">
        <IconSearch className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
        <input
          type="text"
          placeholder='search...'
          className="w-full pl-9 pr-4 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-non focus:ring-2 focus:ring-navy-500" />
      </div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Users</h1>

      <div className="grid grid-cols-3 gap-6 max-w-3xl">
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="text-xs text-gray-500">Total Users</div>

          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center shadow-sm">
          <IconRadio className='h-5 w-5 text-gray-700' />
          <div>
            <div className="text-2xl font-bold text-gray-900">7</div>
            <div className="text-xs text-gray-500">Verified</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center shadow-sm">
          <div>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-xs text-gray-500">Pending verification</div>
          </div>
        </div>
      </div>

      <div className="flex item-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${filter === 'all' ? 'bg-navy-500 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
          >
            All</button>
            <button 
            type ="button"
            onClick={() => setFilter('strikes')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              filter === 'strikes' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
            >
              Has Strikes
            </button>
            <button 
            type ="button"
            onClick={() => setFilter('verified')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              filter === 'verified' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
            >
              Verified
            </button>
            <button 
            type ="button"
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              filter === 'pending' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
            >
              Pending 
            </button>
            </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow hidden">
        <table className="w-full text-left tborder-collapse">
          <thead>
            <tr className=" border-b border-gray-100 text-xs text-gray-500 font-semibold">
              <th className="py-4 px-6">Student</th>
              <th className="py-4 px-6">Verification</th>
              <th className="py-4 px-6">Reputation</th>
              <th className="py-4 px-6">Strikes</th>
              <th className="py-4 px-6 text-right">Actions</th>
              </tr> </thead> </table>

</div>
 


    </div>)
}