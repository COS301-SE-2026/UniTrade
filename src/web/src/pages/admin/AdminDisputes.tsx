import { useState } from 'react'
import { useNavigate } from 'react-router'
import { IconSearch, IconRadio,IconMenu2 } from "@tabler/icons-react"
import chemImg from '../../assets/images/bio-textbook.jpg'
import calcImg from '../../assets/images/calculus-textbook.jpg'
import laptopImg from '../../assets/images/hp-laptop.jpg'

export interface MockDispute{
  id: string
  title: string
  buyer: string
  seller: string
  timeAgo: string
  type: 'No-show' | 'Listing quality' | 'Report'
  image: string
}

const MockDisputes: MockDispute[] = [
  {
    id: '1',
    title: 'Chemistry Textbook - 3rd Ed',
    buyer: 'SK',
    seller: 'MT',
    timeAgo: '1 day ago',
    type: 'No-show',
    image: chemImg,
  },

    {
    id: '2',
    title: 'HP Laptop 15" - Good condition',
    buyer: 'SK',
    seller: 'MT',
    timeAgo: '1 day ago',
    type: 'Listing quality',
    image: laptopImg,
  },
      {
    id: '3',
    title: 'Calculus Textbook -Early Transcendentals 8th Ed',
    buyer: 'SK',
    seller: 'MT',
    timeAgo: '1 day ago',
    type: 'Report',
    image: calcImg,
  }
]

  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'No-show' | 'Listing quality' | 'Report' | 'all'>('all')
  const filteredDisputes = MockDisputes.filter((dispute) => {

  const foundMatch = dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
   dispute.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispute.seller.toLowerCase().includes(searchQuery.toLowerCase())


   if(!foundMatch) return false

    if (filter === 'No-show') return dispute.type === 'No-show'
    if (filter === 'Listing quality') return dispute.type === 'Listing quality'
    if (filter === 'Report') return dispute.type === 'Report'
    return true
  }) 


const totalDisputes =  MockDisputes.length
const numNoShow= MockDisputes.filter((dispute) => dispute.type === 'No-show').length
const numListingQuality = MockDisputes.filter((dispute) => dispute.type === 'Listing quality').length
const numReport = MockDisputes.filter((dispute) => dispute.type === 'Report').length


export default function AdminDisputes() {
  return (
       <div className='p-8 space-y-6 max-w-6xl'>
         <div className="relative max-w-xs">
           <div className='absolute left-3 top-2.5 flex items-center space-x-1 text-gray-400' />
           <IconMenu2 className="h-4 w-4" />
           <span className="text-xs 0">=</span>
           </div>
           <input
             type="text"
             placeholder='search...'
             value ={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-9 py-2 bg-gray-200/60 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1931]" />
        <IconSearch className='absolute right-3 top-2.5 h-4 w-4 text-gray-400' />
    </div>
  )
}