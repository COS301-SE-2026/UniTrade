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


export default function AdminDisputes() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">Disputes</h1>
      <p className="text-sm text-gray-500 dark:text-white/50">Coming soon.</p>
    </div>
  )
}