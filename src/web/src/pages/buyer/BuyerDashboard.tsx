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

      <div className = {`w-full h-36 rounded-lg ${image} flex items-center justify-center`}>
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

function OrderRow({
  title,
  date,
  price,
  status,
  image,
}: {
  title: string
  date: string
  price: string
  status: 'Collected' | 'Pending' | 'Cancelled'
  image: string
}) {
  
  const statusStyles = {
    Collected: 'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      
      <div className={`w-10 h-10 rounded-full ${image} flex-shrink-0`} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-bold text-gray-800">{price}</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[status]}`}>
          {status}
        </span>
      </div>
    </div>
  )
}


export default function BuyerDashboard() {

  const { user } = useAuthStore()
  const navigate = useNavigate()

  const stats = [
    {
      title: 'Total Orders',
      value: '150',
      subText: '+12% this month',
      subColour: 'text-green-500',
      icon: <IconShoppingBag size={16} />,
    },
    {
      title: 'Total Spent',
      value: 'R1000',
      subText: '+12% this month',
      subColour: 'text-green-500',
      icon: <IconCurrencyDollar size={16} />,
    },
    {
      title: 'Pending Collection',
      value: '3',
      subText: 'Collection soon',
      subColour: 'text-orange-400',
      icon: <IconClock size={16} />,
    },
    {
      title: 'Wishlist Items',
      value: '5',
      subText: '2 price drops',
      subColour: 'text-red-400',
      icon: <IconHeart size={16} />,
    },

  ]

  
  const products = [
    { title: 'Biology Textbook', price: 'R1200', image: 'bg-orange-400' },
    { title: 'Laptop', price: 'R5000', image: 'bg-pink-400' },
    { title: 'Lab Coat', price: 'R50', image: 'bg-[#003366]' },
  ]

  
  const recentOrders = [
    { title: 'Textbook', date: '2 May 2026', price: 'R1200', status: 'Collected' as const, image: 'bg-orange-400' },
    { title: 'Lab Coat', date: '5 May 2026', price: 'R50', status: 'Pending' as const, image: 'bg-gray-300' },
    { title: 'Laptop', date: '4 May 2026', price: 'R5000', status: 'Cancelled' as const, image: 'bg-pink-400' },
  ]
  return (
   <div className="flex flex-col gap-6">

      <h1 className="text-2xl font-extrabold text-gray-800 uppercase">
        Welcome {user?.name?.split(' ')[0] ?? 'Back'}
      </h1>


      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

    
      <div className="grid grid-cols-3 gap-4">

  
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Suggested For You</h2>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
                Filter <IconChevronDown size={12} />
              </button>
              <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
                Sort <IconChevronDown size={12} />
              </button>
            </div>
          </div>

          <div className="flex justify-end mb-2">
            <button className="text-xs text-[#00aaff] hover:underline flex items-center gap-1">
              view all <IconArrowUpRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {products.map((p) => (
              <ProductCard key={p.title} {...p} />
            ))}
          </div>
        </div>

        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-2">Recent Orders</h2>
          {recentOrders.map((order) => (
            <OrderRow key={order.title} {...order} />
          ))}
        </div>

      </div>
    </div>
  )
}