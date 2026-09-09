import { Routes, Route, Navigate, useParams } from "react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import AppLayout from "./components/layout/AppLayout";
import { useAuthStore } from "./store/useAuthStore";
import { getApiUrl } from "./config";
import ChatLayout from "./components/ChatLayout";
import { RealtimeProvider } from "./providers/RealtimeProvider";
/*
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import OtpVerification from "./pages/auth/OtpVerification";
import UploadListing from "./pages/seller/UploadListing";
import EditListing from "./pages/seller/EditListing";
import AdminVerificationReview from "./pages/admin/AdminVerificationReview";
import AdminDisputeReview from "./pages/admin/AdminDisputeReview";

import HomePage from "./pages/auth/HomePage";
import Orders from "./pages/buyer/Orders";
import Sales from "./pages/seller/MySales"
import OrderDetails from "./pages/buyer/OrderDetails";
import ListingDetail from "./pages/buyer/ListingDetail";
import SellerDashboard from "./pages/seller/SellerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminListingQueue from "./pages/admin/AdminListingQueue";
import AdminDisputes from "./pages/admin/AdminDisputes";
import Users from "./pages/admin/Users";
import ViewUser from "./pages/admin/ViewUser";

import BrowseListings from "./pages/buyer/BrowseAllListing";
import Wishlist from "./pages/buyer/Wishlist";
import Reservations from "./pages/buyer/Reservation";
import ReservationDetails from "./pages/buyer/ReservationDetails";
import MyListings from "./pages/seller/MyListings";
import SellerListingDetail from "./pages/seller/SellerListingDetail";
import HelpCenter from "./pages/auth/HelpCenter";
import Profile from "./pages/auth/Profile";
import ChatPage from "./pages/chat/ChatPage";
import SellerReservations from "./pages/seller/SellerReservation";
*/


//import Login from "./pages/auth/Login";
/*
import NoConversationsSelected from "./pages/chat/NoConversationsSelected";
import MeetupDetails from "./pages/payment/MeetupDetails";
import Redirect from "./pages/payment/Redirect";
import GeneratePin from "./pages/payment/GeneratePin";
import EnterPin from "./pages/payment/EnterPin";
import PaymentComplete from "./pages/payment/PaymentComplete";
import { RealtimeProvider } from "./providers/RealtimeProvider";
import BrandingStyleDoc from "./pages/auth/BrandingStyleDoc";
import ProofOfRegistrationUpload from "./pages/auth/UploadProofOfRegistration";
import SavedSearches from "./pages/buyer/SavedSearches";
*/
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const OtpVerification = lazy(() => import("./pages/auth/OtpVerification"));
const UploadListing = lazy(() => import("./pages/seller/UploadListing"));
const EditListing = lazy(() => import("./pages/seller/EditListing"));
const AdminVerificationReview = lazy(() => import("./pages/admin/AdminVerificationReview"));
const AdminDisputeReview = lazy(() => import("./pages/admin/AdminDisputeReview"));
const HomePage = lazy(() => import("./pages/auth/HomePage"));
const Orders = lazy(() => import("./pages/buyer/Orders"));
const Sales = lazy(() => import("./pages/seller/MySales"));
const OrderDetails = lazy(() => import("./pages/buyer/OrderDetails"));
const ListingDetail = lazy(() => import("./pages/buyer/ListingDetail"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminListingQueue = lazy(() => import("./pages/admin/AdminListingQueue"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const Users = lazy(() => import("./pages/admin/Users"));
const ViewUser = lazy(() => import("./pages/admin/ViewUser"));
const BrowseListings = lazy(() => import("./pages/buyer/BrowseAllListing"));
const Wishlist = lazy(() => import("./pages/buyer/Wishlist"));
const Reservations = lazy(() => import("./pages/buyer/Reservation"));
const ReservationDetails = lazy(() => import("./pages/buyer/ReservationDetails"));
const MyListings = lazy(() => import("./pages/seller/MyListings"));
const SellerListingDetail = lazy(() => import("./pages/seller/SellerListingDetail"));
const HelpCenter = lazy(() => import("./pages/auth/HelpCenter"));
const Profile = lazy(() => import("./pages/auth/Profile"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const SellerReservations = lazy(() => import("./pages/seller/SellerReservation"));
const NoConversationsSelected = lazy(() => import("./pages/chat/NoConversationsSelected"));
const MeetupDetails = lazy(() => import("./pages/payment/MeetupDetails"));
const Redirect = lazy(() => import("./pages/payment/Redirect"));
const GeneratePin = lazy(() => import("./pages/payment/GeneratePin"));
const EnterPin = lazy(() => import("./pages/payment/EnterPin"));
const PaymentComplete = lazy(() => import("./pages/payment/PaymentComplete"));
const BrandingStyleDoc = lazy(() => import("./pages/auth/BrandingStyleDoc"));
const ProofOfRegistrationUpload = lazy(() => import("./pages/auth/UploadProofOfRegistration"));
const SavedSearches = lazy(() => import("./pages/buyer/SavedSearches"));  


function RedirectToMessages({ role }: Readonly<{ role: "buyer" | "seller" }>) {
  const { reservationId } = useParams<{ reservationId: string }>();
  return <Navigate to={`/${role}/messages/${reservationId}`} replace />;
}
export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser } = useAuthStore();

  useEffect(() => {
    fetch(`${getApiUrl()}/auth/me`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const u = data.user ?? data;
          if (u?.userId) {
            setUser({
              id: u.userId,
              name: u.firstName,
              initials: `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`,
              role: u.userRole,
            });
          }

        }
      })
      .catch(() => { })
      .finally(() => setAuthChecked(true));
  }, [setUser]);
  if (!authChecked) {
    return <div>Loading...</div>;
  }
  return (
    <RealtimeProvider>
      <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/*<Route element={<AppLayout />}>*/}

        <Route path="/" element={<Navigate to="/auth/HomePage" replace />} />
        <Route path="/auth/Login" element={<Login />} />
        <Route path="/auth/Signup" element={<Signup />} />
        <Route path="/auth/HomePage" element={<HomePage />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/auth/help-center" element={<HelpCenter />} />
        <Route path="/auth/profile" element={<Profile />} />
        <Route path="/auth/Brand-style-doc" element={<BrandingStyleDoc />} />
        <Route path="/auth/ProofUpload" element={<ProofOfRegistrationUpload />} />
        

        <Route element={<AppLayout />}>
          <Route path="/admin/verifications/:id" element={<AdminVerificationReview />} />
          <Route path="/admin/disputes/:id" element={<AdminDisputeReview />} />
          <Route path="/buyer/orders" element={<Orders />} />
          <Route path="/buyer/orders/:reservationId" element={<OrderDetails />} />
          <Route path="/seller/sales" element={<Sales />} />
          <Route path="/seller/sales/:reservationId" element={<OrderDetails />} />
          <Route path="/buyer/listings/:id" element={<ListingDetail />} />{" "}
          {/*the id can be anything for now since the data is hardcoded*/}
          <Route path="/buyer/listings" element={<BrowseListings />} />
          <Route path="/buyer/wishlist" element={<Wishlist />} />
          <Route path="/buyer/reservations" element={<Reservations />} />
          <Route path = "/buyer/saved-searches" element={<SavedSearches />} />
          <Route path="/seller/reservations" element={<SellerReservations />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/upload" element={<UploadListing />} />
          <Route path="/seller/editListing/:id" element={<EditListing />} />
          <Route path="/seller/listings" element={<MyListings />} />
          <Route path="/seller/listings/:id" element={<SellerListingDetail />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
          <Route path="/admin/listings" element={<AdminListingQueue />} />
          <Route path="/admin/disputes" element={<AdminDisputes />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/users/:userId" element={<ViewUser />} />

          <Route path="/buyer/messages" element={<ChatLayout role="buyer" />}>
            <Route index element={<NoConversationsSelected />} />
            <Route path=":reservationId" element={<ChatPage />} />
          </Route>
          <Route path="/seller/messages" element={<ChatLayout role="seller" />}>
            <Route index element={<NoConversationsSelected />} />
            <Route path=":reservationId" element={<ChatPage />} />
          </Route>
          <Route
            path="/buyer/reservations/:reservationId/chat"
            element={<RedirectToMessages role="buyer" />}
          />
          <Route
            path="/seller/reservations/:reservationId/chat"
            element={<RedirectToMessages role="seller" />}
          />

          <Route path="/payment/meetup" element={<MeetupDetails />} />
          <Route path="/payment/payfast-redirect" element={<Redirect />} />

          <Route path="/payment/generate-pin" element={<GeneratePin />} />
          <Route path="/payment/buyer-pin" element={<EnterPin />} />
          <Route path="/payment/payment-complete" element={<PaymentComplete />} />

          <Route path="/buyer/reservations/:reservationId" element={<ReservationDetails />} />
          <Route path="/seller/reservations/:reservationId" element={<ReservationDetails />} />
        </Route>
        {<Route path="*" element={<Navigate to="/auth/HomePage" replace />} />}

      </Routes>
      </Suspense>
    </RealtimeProvider>
  );
}
