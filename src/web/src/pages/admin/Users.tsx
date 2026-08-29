import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getUsers } from '../../services/adminService'
import type { UserListItem } from '../../types/admin_disputes'

export interface UserRow {
  id: string
  name: string
  initials: string
  degree: string
  verificationStatus: 'Verified' | 'Pending' | 'Unverified'
  reputation: number
  strikesCount: number
}
function getInitials(name: string) {
  return name.trim().split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

}
function mapVerificationStatus(status: string): 'Verified' | 'Pending' | 'Unverified' {
  if (status === 'verified') return 'Verified';
  if (status === 'pending') return 'Pending';
  return 'Unverified';
}


export default function Users() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'strikes' | 'verified' | 'pending'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getUsers()
      .then((response) => {

        const mapped = response.users.map((u: UserListItem) => ({
          id: u.userId,
          name: u.name,
          initials: getInitials(u.name),
          degree: u.degree,
          verificationStatus: mapVerificationStatus(u.verificationStatus),
          reputation: Math.round(u.reviewAverage * 20),
          strikesCount: u.strikeCount,

        }));
        if (active) {
          setRows(mapped);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load users');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = rows.filter((user) => {
    const matchSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.degree.toLowerCase().includes(searchQuery.toLowerCase());


    if (!matchSearch) return false;
    if (filter === 'strikes') return user.strikesCount > 0
    if (filter === 'verified') return user.verificationStatus === 'Verified'
    if (filter === 'pending') return user.verificationStatus === 'Pending'
    return true;
  });


  const total = rows.length
  const numVerified = rows.filter((user) => user.verificationStatus === 'Verified').length
  const numPending = rows.filter((user) => user.verificationStatus === 'Pending').length

  if (loading) {
    return <p className='text-sm text-gray-400'>Loading users...</p>;
  }
  if (error) {
    return <p className='text-sm text-red-600'>{error}</p>;
  }

  return (
    <div className='space-y-6'>

      <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800"> Users</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div>
            <div className="text-2xl font-bold text-navy-700 dark:text-white">{total}</div>
            <div className="text-xs text-gray-400 mt-0.5">Total Users</div>

          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">

          <div>
            <div className="text-2xl font-bold text-navy-700 dark:text-white">{numVerified}</div>
            <div className="text-xs text-gray-400 mt-0.5">Verified</div>
          </div>
        </div>
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div>
            <div className="text-2xl font-bold text-navy-700 dark:text-white">{numPending}</div>
            <div className="text-xs text-gray-400 mt-0.5">Pending verification</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${filter === 'all' ? 'bg-[#0a1931] text-white'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
        >
          All</button>
        <button
          type="button"
          onClick={() => setFilter('strikes')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${filter === 'strikes' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Has Strikes
        </button>
        <button
          type="button"
          onClick={() => setFilter('verified')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${filter === 'verified' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Verified
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${filter === 'pending' ? 'bg-[#0a1931] text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
        >
          Pending
        </button>
      </div>

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-x-auto">
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
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className='py-6 text-center text-gray-400'>
                  No users match your criteria.
                </td>
              </tr>) : (
              filteredRows.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#0a1931] text-white flex items-center justify-center font-bold text-xs">
                      {user.initials}
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
                    ) : user.verificationStatus === 'Pending' ? (
                      <span className="px-3 py-1 inline-block rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-block rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Unverified
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
              ))
            )}
          </tbody>
        </table>

      </div>
    </div>
  )
}