import { useState } from 'react'
import { useNavigate } from 'react-router'
//import { IconSearch,IconMenu2 } from "@tabler/icons-react"
import chemImg from '../../assets/bio-textbook.jpg'
import calcImg from '../../assets/calculas-textbook.jpg'
import laptopImg from '../../assets/hp-laptop.jpg'

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
    id: 'dispute-1',
    title: 'Chemistry Textbook - 3rd Ed',
    buyer: 'SK',
    seller: 'MT',
    timeAgo: '1 day ago',
    type: 'No-show',
    image: chemImg,
  },

    {
    id: 'dispute-2',
    title: 'HP Laptop 15" - Good condition',
    buyer: 'SK',
    seller: 'MT',
    timeAgo: '1 day ago',
    type: 'Listing quality',
    image: laptopImg,
  },
      {
    id: 'dispute-3',
    title: 'Calculus Textbook -Early Transcendentals 8th Ed',
    buyer: 'SK',
    seller: 'MT',
    timeAgo: '1 day ago',
    type: 'Report',
    image: calcImg,
  }
]

 


const totalDisputes =  MockDisputes.length
const numNoShow= MockDisputes.filter((dispute) => dispute.type === 'No-show').length
const numListingQuality = MockDisputes.filter((dispute) => dispute.type === 'Listing quality').length
const numReport = MockDisputes.filter((dispute) => dispute.type === 'Report').length


export default function AdminDisputes() {
    const [searchQuery, /*setSearchQuery*/] = useState('')
  const [filter, setFilter] = useState<'No-show' | 'Listing quality' | 'Report' | 'all'>('all')
  const navigate = useNavigate()
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
  return (
       <div className='space-y-6'>
         {/*<div className="relative max-w-xs">
           <div className='absolute left-3 top-2.5 flex items-center space-x-1 text-gray-400'>
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
    </div>*/}

       <div>
      <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">Active Disputes</h1>
      <p className="text-xs text-gray-400 mt-1">Manage all the Dsiputes in one place.</p>
      </div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
    <div className="text-2xl font-bold text-navy-700 dark:text-white">{totalDisputes}
    </div>
    <div className="text-xs text-gray-400 mt-0.5">Total Disputes</div>
</div>

<div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
  <div>
    <div className="text-2xl font-bold text-navy-700 dark:text-white">{numNoShow}
    </div>
    <div className="text-xs text-gray-400 mt-0.5">No Show</div>
</div>
</div>

<div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
     <div className="text-2xl font-bold text-navy-700 dark:text-white">{numListingQuality}
    </div>
    <div className="text-xs text-gray-400 mt-0.5">Listing Quality</div>
</div>

<div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
    <div className="text-2xl font-bold text-navy-700 dark:text-white">{numReport}
    </div>
    <div className="text-xs text-gray-400 mt-0.5">Report</div>
</div>
</div>

 <div className="flex-items-center space-x-3 pt-2">
          <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${
              filter === 'all'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              All
            </button>


            <button
          type="button"
          onClick={() => setFilter('No-show')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${
              filter === 'No-show'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              No-show
            </button>


                      <button
          type="button"
          onClick={() => setFilter('Listing quality')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${
              filter === 'Listing quality'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              Quality
            </button>


                      <button
          type="button"
          onClick={() => setFilter('Report')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors 
            ${
              filter === 'Report'
              ? 'bg-[#0a1931] text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            >
              Report
            </button>
            </div>


     <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs text-gray-400 font-normal">
            <th className="py-3 px-4">Listing</th>
            <th className="py-3 px-4 text-center">Dispute type</th>
            <th className="py-3 px-4 text-right pr-12">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredDisputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50/50 tansition-colors">
             <td className="py-4 px-4 flex items-center space-x-3">
                  <img
                    src={dispute.image}
                    alt={dispute.title}
                    className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{dispute.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Buyer: {dispute.buyer} &bull; Seller: {dispute.seller} &bull; {dispute.timeAgo}
                    </div>
                  </div>
                </td>

            <td className="py-4 px-4 text-center">
              <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${
                dispute.type === 'No-show'
                ? 'bg-rose-200 text-rose-700'
                :dispute.type === 'Listing quality'
                ? 'bg-amber-100 text-amber-700'
                :'bg-sky-200 text-sky-700'
              }`}>
                {dispute.type}
              </span>
            </td>

            <td className="py-4 px-4 text-right">
              <div className="flex items-center justify-end space-x-2">
                <button
                type="button"
                onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                className="bg-[#0a1931] text-white px-5 py-1.5 rounded-full font-semibold hover:bg-[#153462] 
                transition-colors cursor-pointer">
                  Review
                </button>
                  <button
                type="button"

                className="bg-white text-[#0a1931] border px-5 py-1.5 border-gray-300 rounded-full font-semibold hover:bg-gray-50
                transition-colors cursor-pointer text-[10px] leading-tight">
                  Message Seller
                </button>
                 <button
                type="button"

                className="bg-white text-[#0a1931] border px-5 py-1.5 border-gray-300 rounded-full font-semibold hover:bg-gray-50
                transition-colors cursor-pointer text-[10px] leading-tight">
                  Message Buyer
                </button>
              </div>
            </td>
                </tr>
              ))}
            </tbody>
            </table></div>       
</div>
  )
}