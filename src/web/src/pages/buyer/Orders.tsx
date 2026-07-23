//import { useNavigate } from 'react-router-dom'
//import React,{ /*useEffect, useCallback,*/ useState } from 'react'
//import { Search, Bell, Sun, Star, Loader2, AlertCircle } from 'lucide-react'

export interface Order {
  id: string;
  refNum: string;
  title: string;
  condition: string;
  sellerName: string;
  sellerInitials: string;
  price: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  rating: number;
}

export type OrderFilterTab = 'all' |'semester' |  'awaiting'

/*const mockOrders: Order[] =[
  {
  id: '1',
  refNum: 'OR1234',
  title: 'Calculus - Early Transcendentals',
  condition: 'Good',
  sellerName:'Tafadzwa Musiiwa',
  sellerInitials: 'TM',
  price:280,
  date: '14 June 2025',
  status: 'Completed' ,
  rating: 5,
  }
];
*/

export default function Orders(){
 // const [activeTab, setActiveTab] = useState<OrderFilterTab>('all');

  return(
    <main className='flex-1 flex flex-col overflow-y-auto'>
      orders here. 
    </main>
  )
}