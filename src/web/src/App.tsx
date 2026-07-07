import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import { useAuthStore } from "./store/useAuthStore";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import OTP_verification from "./pages/auth/OTP_verification";
import UploadListing from "./pages/seller/UploadListing";
import EditListing from "./pages/seller/EditListing";

import HomePage from "./pages/auth/HomePage";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import ListingDetail from "./pages/buyer/ListingDetail";
import SellerDashboard from "./pages/seller/SellerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminListingQueue from "./pages/admin/AdminListingQueue";
import AdminDisputes from "./pages/admin/AdminDisputes";
import BrowseListings from "./pages/buyer/BrowseAllListing";
import Wishlist from "./pages/buyer/Wishlist";
import MyListings from "./pages/seller/MyListings";
import SellerListingDetail from "./pages/seller/SellerListingDetail";
import HelpCenter from "./pages/auth/HelpCenter";
import Profile from "./pages/auth/Profile";
const BASE_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser } = useAuthStore();

  useEffect(() => {
    fetch(`${BASE_URL}/auth/me`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          setUser({
            id: u.userId,
            name: u.firstName,
            initials: `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`,
            role: u.userRole,
          });
        }
      })
      .catch(() => { })
      .finally(() => setAuthChecked(true));
  }, [setUser]);
  if (!authChecked) {
    return <div>Loading...</div>;
  }
  return (
    <Routes>
      {/*<Route element={<AppLayout />}>*/}

      <Route path="/" element={<Navigate to="/auth/HomePage" replace />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/Login" element={<Login />} />
      <Route path="/auth/Signup" element={<Signup />} />
      <Route path="/auth/HomePage" element={<HomePage />} />
      <Route path="/verify-otp" element={<OTP_verification />} />
      <Route path="/auth/help-center" element={<HelpCenter />} />
      <Route path="/auth/profile" element={<Profile />} />


      <Route element={<AppLayout />}>
        <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="/listings/:id" element={<ListingDetail />} />{" "}
        {/*the id can be anything for now since the data is hardcoded*/}
        <Route path="/buyer/BuyerDashboard" element={<BuyerDashboard />} />
        <Route path="/buyer/listings" element={<BrowseListings />} />
        <Route path="/buyer/wishlist" element={<Wishlist />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/upload" element={<UploadListing />} />
        <Route path="/seller/editListing/:id" element={<EditListing />} />
        <Route path="/seller/listings" element={<MyListings />} />
        <Route path="/seller/listings/:id" element={<SellerListingDetail />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/listings" element={<AdminListingQueue />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
      </Route>
    </Routes>
  );
}
