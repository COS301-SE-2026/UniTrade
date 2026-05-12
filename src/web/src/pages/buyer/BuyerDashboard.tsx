import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '../../store/useAuthStore'
import{
  IconShoppingBag,
  IconCurrencyDollar,
  IconClock,
  IconHeart,
  IconArrowUpRight,
  IconChevronDown,
}from '@tabler/icon-react'


function StatCard({
  title,
  value,
  subText,
  subColour,
  icon,
}: {
  title: string
  value: string
  subText: string
  subColour: string
  icon: React.ReactNode
}){
  return(
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      <div className="bg-[#003366] px-4 py-2 flex items-center justify-between">
        <p className="text-white text-sm font-bold">{title}</p>
        <span className="text-white/70">{icon}</span>
      </div>
    
      <div className="px-4 py-3">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className={`text-xs mt-1 ${subColor}`}>{subText}</p>
      </div>
    </div>
  )
}


export default function BuyerDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Buyer Dashboard</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}