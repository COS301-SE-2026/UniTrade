import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AppLayout from './components/layout/AppLayout'
import { useAuthStore } from './store/useAuthStore'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import UploadListing from './pages/seller/UploadListing'

import HomePage from './pages/auth/HomePage'

import BuyerDashboard from './pages/buyer/BuyerDashboard'
import SellerDashboard from './pages/seller/SellerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminListingQueue from './pages/admin/AdminListingQueue'
import AdminDisputes from './pages/admin/AdminDisputes'

export default function App() {
  const { setUser } = useAuthStore()

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
      <Route path="/" element={<HomePage/>} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/auth/HomePage" element={<HomePage />} />


      <Route element={<AppLayout />}>


       
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/buyer/BuyerDashboard" element={<BuyerDashboard />} />

        
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/upload" element={<UploadListing />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/listings" element={<AdminListingQueue />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
      </Route>
    </Routes>
  )
}

