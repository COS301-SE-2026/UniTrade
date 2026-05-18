import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IconLayoutDashboard,
    IconSearch,
    IconPackage,
    IconNotes,
    IconBoxPadding,
} from '@tabler/icons-react'

//Types needed 
type ListingStatus = 'live' | 'pending' | 'draft' | 'rejected'

interface Listing {
    id:string
    title: string
    meta: string
    price: string
    status: ListingStatus
    views: number
    image: string
}

//Mock Data
const mockListings: Listing[] = [
  { id: '1', title: 'Chemistry Textbook - 3rd Ed', meta: 'CMY127 · Listed 7 May 2026',     price: 'R250',  status: 'live',     views: 42, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CH' },
  { id: '2', title: 'HP Laptop 15" - Good Condition', meta: 'Electronics · Listed 5 May 2026', price: 'R4500', status: 'live',     views: 25, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=LP' },
  { id: '3', title: 'Geometry Set - Unopened',     meta: 'Stationery · Listed 4 May 2026',  price: 'R250',  status: 'pending',  views: 68, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=GS' },
  { id: '4', title: 'Calculus - Early Transcendentals', meta: 'WTW114 · Listed 3 May 2026', price: 'R350',  status: 'draft',    views: 89, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CA' },
  { id: '5', title: 'Molecular Biology - 6th Ed',  meta: 'BIO226 · Listed 3 May 2026',     price: 'R350',  status: 'rejected', views: 89, image: 'https://placehold.co/48x48/1a3a7a/ffffff?text=MB' },
]