import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getUsers } from '../../services/adminService'
import type { UserListItem } from '../../types/admin_disputes'
import { LoadingState } from '../../components/layout/Spinner'
import {
  IconUsers,
  IconCircleCheck,
  IconCalendarDue,
  IconXMark
} from "@tabler/icons-react"

type SortBy = 'Name A-Z' | 'Name Z-A';
type Filter = "All" | "With Strikes" | "Verified" | "Pending";

const PAGE_SIZE = 6;

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
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [filter, setFilter] = useState<Filter>('All');
  const [sortBy, setSortBy] = useState<SortBy>('Name A-Z');
  const [currentPage, setCurrentPage] = useState(1);
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
          reputation: u.reputationScore,
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
    const q = searchQuery.toLowerCase();
    const matchSearch = user.name.toLowerCase().includes(q) ||
      user.degree.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (filter === 'With Strikes') return user.strikesCount > 0
    if (filter === 'Verified') return user.verificationStatus === 'Verified'
    if (filter === 'Pending') return user.verificationStatus === 'Pending'
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name);
    return sortBy === 'Name A-Z' ? cmp : -cmp;
  });

  
  const listKey = `${filter}|${sortBy}|${searchQuery}`;
  const [lastListKey, setLastListKey] = useState(listKey);
  if (lastListKey !== listKey) {
    setLastListKey(listKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = sortedRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const total = rows.length
  const WithStrikes = rows.filter((user) => user.strikesCount > 0)
  const numWithStrikes = WithStrikes.length
  const numVerified = rows.filter((user) => user.verificationStatus === 'Verified').length
  const numPending = rows.filter((user) => user.verificationStatus === 'Pending').length

  const filters: { label: Filter; count: number }[] = [
    { label: "All", count: total },
    { label: "Verified", count: numVerified },
    { label: "Pending", count: numPending },
    { label: "With Strikes", count: numWithStrikes },
  ];

  if (loading) { return <LoadingState message="Loading users..." /> }

  if (error) {
    return <p className='text-sm text-red-700'>{error}</p>;
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800"> Users</h1>
       <p className="text-sm text-gray-600 mt-1">
          View all student users registered on the application. </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {[
          {
            label: "Total Users",
            value: total,
            icon: <IconUsers size={20} />,
          },
          {
            label: "Verified",
            value: numVerified,
            icon: <IconCircleCheck size={20} />,
          },
          {
            label: "Pending Verification",
            value: numPending,
            icon: <IconCalendarDue size={20} />,
          },
          {
            label: "With Strikes",
            value: numWithStrikes,
            icon: <IconXMark size={20} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3"
          >
            <span className="text-navy-700 dark:text-white">{stat.icon}</span>
            <div>
              <div className="text-2xl font-bold text-navy-700 dark:text-white">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
<div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          {filters.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              className={`px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-semibold cursor-pointer transition-colors 
                ${filter === label
                  ? "bg-navy-700 text-white border-navy-700"
                  : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <select
            aria-label="Sort users"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortBy);
              setCurrentPage(1);
            }}
            className='px-4 py-1.5 bg-white dark:bg-navy-800 border border-gray-300 dark:border-white/10 rounded-full text-xs font-medium text-gray-600 dark:text-white/80 focus:outline-hidden cursor-pointer w-full sm:w-auto'
          >
            <option value="Name A-Z">Sort: Name A-Z</option>
            <option value="Name Z-A">Sort: Name Z-A</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className=" border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-semibold uppercase">
              <th className="py-4 px-6">Student</th>
              <th className="py-4 px-6">Verification</th>
              <th className="py-4 px-6">Reputation</th>
              <th className="py-4 px-6">Strikes</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr> </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className='py-6 text-center text-gray-600'>
                  No users match your criteria.
                </td>
              </tr>) : (
              paginatedRows.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-navy-700 text-white flex items-center justify-center font-bold text-xs">
                      {user.initials}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-gray-600 text-xs">
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
                      <span className="text-gray-600">0</span>
                    )}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="bg-navy-700 px-4 py-1.5 rounded-full text-xs font-semibold text-white hover:bg-navy-500 transition-colors cursor-pointer">

                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
      {sortedRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 whitespace-nowrap">
            Showing {(safePage - 1) * PAGE_SIZE + 1}-
            {Math.min(safePage * PAGE_SIZE, sortedRows.length)} of{" "}
            {sortedRows.length} users
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold border transition-colors ${currentPage === page
                    ? "bg-navy-700 text-white border-navy-700"
                    : "bg-white dark:bg-navy-800 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/10 hover:bg-gray-50"
                    }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}