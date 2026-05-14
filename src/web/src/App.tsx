import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AppLayout from './components/layout/AppLayout'
import { useAuthStore } from './store/useAuthStore'
import Login from './pages/autho/Login'
import Signup from './pages/autho/Signup'
import UploadListing from './pages/seller/UploadListing'

import BuyerDashboard from './pages/buyer/BuyerDashboard'
import SellerDashboard from './pages/seller/SellerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminListingQueue from './pages/admin/AdminListingQueue'
import AdminDisputes from './pages/admin/AdminDisputes'

export default function App() {
  const { user, setUser } = useAuthStore()

  useEffect(() => {
    // Temporary: change role to 'buyer' | 'seller' | 'admin' to test different sidebars
    setUser({
      id: '1',
      name: 'Tafadzwa Musiiwa',
      initials: 'TM',
      role: 'buyer',
    })
  }, [])

  return (
    <Routes>
      
      <Route path="/autho/login" element={<Login />} />
      <Route path="/autho/signup" element={<Signup />} />
      <Route element={<AppLayout />}>


       
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

       
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />

        
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/upload" element={<UploadListing />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/listings" element={<AdminListingQueue />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
      </Route>
      <Route path="*" element={<Navigate to="/autho/login" replace />} />
    </Routes>
  )
}