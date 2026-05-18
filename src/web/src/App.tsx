import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AppLayout from './components/layout/AppLayout'
import { useAuthStore } from './store/useAuthStore'
import OTP_verification from './pages/auth/OTP_verification'
import BuyerDashboard from './pages/buyer/BuyerDashboard'
import ListingDetail from './pages/buyer/ListingDetail'
import SellerDashboard from './pages/seller/SellerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminListingQueue from './pages/admin/AdminListingQueue'
import AdminDisputes from './pages/admin/AdminDisputes'
import MyListings from './pages/seller/MyListings'
import SellerListingDetail from './pages/seller/SellerListingDetail'

export default function App() {
  const { setUser } = useAuthStore()

  useEffect(() => {
    // Temporary: change role to 'buyer' | 'seller' | 'admin' to test different sidebars
    setUser({
      id: '1',
      name: 'Tafadzwa Musiiwa',
      initials: 'TM',
      role: 'admin',
    })
  }, [])

  return (
    <Routes>
      <Route path="/verify-otp" element={<OTP_verification />} />
      <Route element={<AppLayout />}>
       
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

       
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/listings/:id" element={<ListingDetail />} /> {/*the id can be anything for now since the data is hardcoded*/}

        
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/listings" element={<MyListings />} />
        <Route path="/seller/listings/:id" element={<SellerListingDetail />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/listings" element={<AdminListingQueue />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
      </Route>
    </Routes>
  )
}