import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '../../store/useAuthStore'
import{
  IconShoppingBag,
  IconCurrencyDollar,
  IconClock,
  IconHeart,
  IconArrowUpRight,
  IconChevronDown,
}from '@tabler/icons-react'


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
        <p className={`text-xs mt-1 ${subColour}`}>{subText}</p>
      </div>
    </div>
  )
}

function ProductCard({
  title,
  price,
  image
}: {
  title: string
  price: string
  image: string
}) {
  return (
    <div className = "border border-gray-200 rounded-xl p-3 flex flex-col gap-3">

      <div className = {'w-full h-36 rounded-lg ${image} flex items-center justify-center'}>
        <IconShoppingBag size={40} className= "text-white/60" />
      </div>
      <p className = "text-sm font-semibold text-gray-800">{title}</p>
      <p className = "text-sm text-gray-500">{price}</p>
      <button className = "w-full py-2 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-[#002244] transition-colors">
        Reserve
      </button>
      <button className="w-full py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
        Add to Wishlist
      </button>
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