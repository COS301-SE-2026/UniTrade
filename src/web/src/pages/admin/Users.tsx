import { useState } from 'react'
import { useNavigate } from 'react-router'
import { IconSearch } from "@tabler/icons-react"

export interface MockUser{
  id: string
  name: string
  intitials: string
  degree: string
  verificationStatus: 'Verified' | 'Pending' | 'Unverified'
  reputation: number
  strikesCount: number
}

const MockUsers: MockUser[] = [
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
    name: 'Kudzai Moyo',
    intitials: 'KM',
    degree: 'BCom Informatics, Y3',
    verificationStatus: 'Pending',
    reputation: 80,
    strikesCount: 0,
  },
  {
    id: '3',
    name: 'Sipho Dlamini',
    intitials: 'SD',
    degree: 'BSc Comp Sci, Y1',
    verificationStatus: 'Verified',
    reputation: 95,
    strikesCount: 1,
  },
]

export default function Users() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'strikes' | 'verified' | 'pending'>('all')
  const filteredUsers = MockUsers.filter((user) => {

  const foundMatch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
   user.degree.toLowerCase().includes(searchQuery.toLowerCase())

   if(!foundMatch) return false

    if (filter === 'strikes') return user.strikesCount > 0
    if (filter === 'verified') return user.verificationStatus === 'Verified'
    if (filter === 'pending') return user.verificationStatus === 'Pending'
    return true
  }) 


const total =  MockUsers.length
const numVerfied= MockUsers.filter((user) => user.verificationStatus === 'Verified').length
const numPending = MockUsers.filter((user) => user.verificationStatus === 'Pending').length

  return (
    <div className='p-8 space-y-6 max-w-6xl'>
      <div className="relative max-w-md">
        <IconSearch className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
        <input
          type="text"
          placeholder='search...'
          value ={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
      </div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2"> Users</h1>

      <div className="grid grid-cols-3 gap-6 max-w-3xl">
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Total Users</div>

          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center shadow-sm">
      
          <div>
            <div className="text-2xl font-bold text-gray-900">{numVerfied}</div>
            <div className="text-xs text-gray-500">Verified</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center shadow-sm">
          <div>
            <div className="text-2xl font-bold text-gray-900">{numPending}</div>
            <div className="text-xs text-gray-500">Pending verification</div>
          </div>
        </div>
      </div>

      <div className="flex item-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${filter === 'all' ? 'bg-[#0a1931] text-white' 
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            All</button>
            <button 
            type ="button"
            onClick={() => setFilter('strikes')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              filter === 'strikes' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              Has Strikes
            </button>
            <button 
            type ="button"
            onClick={() => setFilter('verified')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              filter === 'verified' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className=" border-b border-gray-100 text-xs text-gray-500 font-semibold">
              <th className="py-4 px-6">Student</th>
              <th className="py-4 px-6">Verification</th>
              <th className="py-4 px-6">Reputation</th>
              <th className="py-4 px-6">Strikes</th>
              <th className="py-4 px-6 text-right">Actions</th>
              </tr> </thead> 
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                   <td className="py-4 px-6 flex items-center space-x-3"> 
                    <div className="w-10 h-10 rounded-full bg-[#0a1931] text-white flex items-center justify-center font-bold text-xs">
                      {user.intitials}
                      </div> 
                      <div>
                        <div className="font-bold text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {user.degree}
                        </div>
                      </div>
                      </td>
                      <td className="py-4 px-6">
                        {user.verificationStatus === 'Verified' ? (
                          <span className="px-3 py-1 inline-block rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                            </span>
                            ):(
                              <span className="px-3 py-1 inline-block rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Pending
                            </span>
                            )}
                            </td>
                      <td className="py-4 px-6 font-bold text-gray-800">{user.reputation}</td>
                      <td className="py-4 px-6 font-bold text-gray-800">{user.strikesCount > 0 ? (
                        <span className="text-red-600"> {user.strikesCount} </span>) 
                      : ( 
                        <span className="text-gray-400">0</span>
                      )}</td>
                      <td className="py-4 px-6 text-right"> 
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="bg-[#0a1931] px-4 py-1.5 rounded-full text-xs font-semibold text-white hover:bg-[#153462] transition-colors cursor-pointer">

                        View
                      </button>
                            </td>   
                      </tr>
                ))}
                </tbody>
              </table>

              </div>
    </div>
    )
}