import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  IconLayoutDashboard,
  IconSwitchHorizontal,
  IconSettings,
  IconShieldCheck,
  IconListCheck,
  IconFlag,
  IconUsers,
  IconChartBar,
  IconPackage,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconShoppingBag,IconHeart, IconBookmark, IconMessage, IconUser
} from '@tabler/icons-react'
import { useAuthStore } from '../../store/useAuthStore'
import { authService } from '../../services/authService'
import { useState, useEffect, useRef } from 'react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  badge?: number
}

interface NavSection {
  heading: string
  items: NavItem[]
}

const buyerNav: NavSection[] = [
  {
    heading: 'Main',
    items: [
      { label: 'Browse Listings', to: '/buyer/listings', icon: <IconLayoutDashboard size={18} /> },
      { label: 'Switch', to: '/switch', icon: <IconSwitchHorizontal size={18} /> },
      { label: 'My Orders', to: '/orders', icon: <IconShoppingBag size={18} />, badge: 3 },
      { label: 'My Wishlist', to: '/wishlist', icon: <IconHeart size={18} /> },
      { label: 'My Reservations', to: '/buyer/reservations', icon: <IconBookmark size={18} />, badge: 2 },
    ],
  },
  {
    heading: 'Account',
    items: [
      { label: 'Messages', to: '/messages', icon: <IconMessage size={18} />, badge: 5 },
      { label: 'Profile', to: '/auth/profile', icon: <IconUser size={18} /> },
      //{ label: 'Settings', to: '/settings', icon: <IconSettings size={18} /> },
    ],
  },
]

const sellerNav: NavSection[] = [
  {
    heading: 'Main',
    items: [
      { label: 'My Listings', to: '/seller/listings', icon: <IconLayoutDashboard size={18} /> },
      { label: 'Switch', to: '/switch', icon: <IconSwitchHorizontal size={18} /> },
      { label: 'New Listing', to: '/seller/upload', icon: <IconPackage size={18} /> },
      { label: 'My Sales', to: '/seller/sales', icon: <IconShoppingBag size={18} />},
      { label: 'Reserved', to: '/seller/reservations', icon: <IconBookmark size={18} />, badge: 2 },
    ],
  },
  {
    heading: 'Account',
    items: [
      { label: 'Messages', to: '/messages', icon: <IconMessage size={18} />, badge: 5 },
      { label: 'Profile', to: '/auth/profile', icon: <IconUser size={18} /> },
      //{ label: 'Settings', to: '/settings', icon: <IconSettings size={18} /> },
    ],
  },
]

const adminNav: NavSection[] = [
  {
    heading: 'Main',
    items: [
      { label: 'Dashboard', to: '/admin/dashboard', icon: <IconLayoutDashboard size={18} /> },
      { label: 'Verifications', to: '/admin/verifications', icon: <IconShieldCheck size={18} />, badge: 14 },
      { label: 'Listing Queue', to: '/admin/listings', icon: <IconListCheck size={18} />, badge: 14 },
      { label: 'Disputes', to: '/admin/disputes', icon: <IconFlag size={18} />, badge: 3 },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { label: 'Users', to: '/admin/users', icon: <IconUsers size={18} /> },
      { label: 'Analytics', to: '/admin/analytics', icon: <IconChartBar size={18} /> },
      { label: 'Settings', to: '/admin/settings', icon: <IconSettings size={18} /> },
    ],
  },
]

interface UserPopoverProps {
  name: string
  initials: string
  roleLabel: string
  onClose: () => void
  onLogout: () => void 
  
}
function UserPopover({
  name, initials, roleLabel, onClose, onLogout,
}: UserPopoverProps){
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent){
      if (ref.current && !ref.current.contains(e.target as Node)){
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div 
    ref={ref}
    className="absolute bottom-16 left-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50"
    >
      <div className="flex items-center justify-end mb-4">
        
        <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
        aria-label="Close"
        >
          <IconX size={18} />
        </button>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <button

          className="w-10 h-10 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"
        >
          {initials}
        </button>
        
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-sky-400">{roleLabel}</p>
        </div>
      </div>
      <button
      onClick={onLogout}
      className="w-full bg-navy-700 text-white font-semibold text-sm rounded-full py-2.5 hover:bg-navy-500 transition-colors"
      >
        LOGOUT
      </button>
      <p 
      //onClick={auth/Terms-and-conditions}
      className="text-center text-xs text-gray-400 mt-3">Terms and conditions</p>
    </div>
  )
}
export default function Sidebar() {
  const { user, viewMode, toggleViewMode, clearUser } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [ShowPopover, setShowPopover] = useState(false)
  

  let sections: NavSection[] = []
  if (user?.role === 'admin') {
    sections = adminNav
  } else if (user?.role === 'student') {
    sections = viewMode === 'buyer' ? buyerNav : sellerNav
  }

  const handleSwitch = () => {
    if (user?.role !== 'student') return
    const newMode = viewMode === 'buyer' ? 'seller' : 'buyer'
    toggleViewMode()
    navigate(newMode === 'buyer' ? '/buyer/listings' : '/seller/listings')
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
       //Inacase there is an api call frontend doesn't fail
    } finally {
      clearUser()
      setShowPopover(false)
      navigate('/auth/login')
    }
  }
  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen bg-navy-700 text-white transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-16' : 'w-52'
      )}
    >
      
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10 overflow-hidden">
        <span className="text-base font-bold whitespace-nowrap">
          {collapsed ? 'UT' : 'UniTrade'}
        </span>
        {!collapsed && user?.role === 'admin' && (
          <span className="text-[10px] text-white/40 font-normal">Admin</span>
        )}
      </div>

      
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.heading}>
            {!collapsed && (
              <p className="px-4 pt-4 pb-1 text-[10px] uppercase tracking-widest text-white/40">
                {section.heading}
              </p>
            )}
            {section.items.map((item) => {
    
              if (item.label === 'Switch' && user?.role === 'student') {
                return (
                  <button
                    key={item.to}
                    onClick={handleSwitch}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-[12.5px] transition-colors',
                      'text-left bg-transparent cursor-pointer focus:outline-none', // fixes alignment
                      collapsed && 'justify-center px-0',
                      'text-white/75 hover:bg-white/5 hover:text-white'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="bg-[#00aaff] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                )
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-2.5 text-[12.5px] transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-navy-500 text-white'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="bg-[#00aaff] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {user && (
        <div
          className="relative">
          <div 
          onClick={() => setShowPopover((prev) => !prev)}
          className={clsx(
            'border-t border-white/10 p-3 flex items-center gap-2 overflow-hidden cursor-pointer hover:bg-white/5',
            collapsed && 'justify-center'
          )}
          >
            <div className="w-8 h-8 rounded-full bg-navy-500 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
              {user.initials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate">{user.name}</p>
                <p className="text=[10px] text-white/50 capitalize">
                {user.role === 'admin' ? 'Admin' : viewMode === 'buyer' ? 'Buyer' : 'Seller'} 
                </p>
                </div>
            )}
          </div>
          {ShowPopover && (
            <UserPopover 
              name={user.name}
               initials={user.initials}
               roleLabel={
                user.role === 'admin' ? 'Admin Account' : viewMode === 'buyer' ? 'Buyer Account' : 'Seller Account'
               }
               onClose={() => setShowPopover(false)}
               onLogout={handleLogout}
               />
          )}
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-navy-700 border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <IconChevronRight size={12} /> : <IconChevronLeft size={12} />}
      </button>
    </aside>
  )
}