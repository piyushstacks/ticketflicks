import React, { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import Loading from "./components/Loading";

// ── Lazy-loaded pages (code-split per route) ────────────────────────────────
const Home                  = lazy(() => import("./pages/Home"));
const Movies                = lazy(() => import("./pages/Movies"));
const MovieDetails          = lazy(() => import("./pages/MovieDetails"));
const SeatLayout            = lazy(() => import("./pages/SeatLayout"));
const SeatLayoutNew         = lazy(() => import("./pages/SeatLayout_New"));
const BuyTicketsFlow        = lazy(() => import("./pages/BuyTicketsFlow"));
const MovieShowSelector     = lazy(() => import("./components/MovieShowSelector"));
const MyBooking             = lazy(() => import("./pages/MyBookings_New"));
const Favorite              = lazy(() => import("./pages/Favorite"));
const Upcoming              = lazy(() => import("./pages/Upcoming"));
const UpcomingMovieDetails  = lazy(() => import("./pages/UpcomingMovieDetails"));
const FeedbackForm          = lazy(() => import("./pages/FeedbackForm"));
const Theatre               = lazy(() => import("./pages/Theatres"));
const Login                 = lazy(() => import("./pages/Login"));
const Signup                = lazy(() => import("./pages/Signup"));
const ForgotPassword        = lazy(() => import("./pages/ForgotPassword"));
const VerifyOtp             = lazy(() => import("./pages/VerifyOtp"));
const ResetPassword         = lazy(() => import("./pages/ResetPassword"));
const ChangePassword        = lazy(() => import("./pages/ChangePassword"));
const VerifyEmail           = lazy(() => import("./pages/VerifyEmail"));
const Profile               = lazy(() => import("./pages/Profile"));
const EditProfile           = lazy(() => import("./pages/EditProfile"));
const TheatreVerifyWrapper  = lazy(() => import("./pages/TheatreVerifyWrapper"));
const RegistrationPending   = lazy(() => import("./pages/RegistrationPending"));

// Admin
const Layout                = lazy(() => import("./pages/admin/Layout"));
const AdminDashboard        = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTheatres         = lazy(() => import("./pages/admin/AdminTheatres"));
const AdminPayments         = lazy(() => import("./pages/admin/AdminPayments"));
const AdminMovies           = lazy(() => import("./pages/admin/AdminMovies"));
const AdminShows            = lazy(() => import("./pages/admin/AdminShows"));
const AdminBookings         = lazy(() => import("./pages/admin/AdminBookings"));
const AdminPaymentsList     = lazy(() => import("./pages/admin/AdminPaymentsList"));
const AddShows              = lazy(() => import("./pages/admin/AddShows"));
const ListShows             = lazy(() => import("./pages/admin/ListShows"));
const ListBookings          = lazy(() => import("./pages/admin/ListBookings"));
const ListFeedbacks         = lazy(() => import("./pages/admin/ListFeedbacks"));

// Manager
const ManagerLayout         = lazy(() => import("./pages/manager/ManagerLayout"));
const ManagerDashboard      = lazy(() => import("./pages/manager/ManagerDashboard"));
const ManagerMovies         = lazy(() => import("./pages/manager/ManagerMovies"));
const ManagerShows          = lazy(() => import("./pages/manager/ManagerShows"));
const ManagerScreens        = lazy(() => import("./pages/manager/ManagerScreens"));
const ManagerBookings       = lazy(() => import("./pages/manager/ManagerBookings"));

// Shared page-level Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <Loading />
  </div>
);

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isManagerRoute = location.pathname.startsWith("/manager");

  const { user } = useAppContext();

  return (
    <>
      <Toaster />
      {!isAdminRoute && !isManagerRoute && <Navbar />}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/buy-tickets/:id" element={<BuyTicketsFlow />} />
        <Route path="/select-show/:id" element={<MovieShowSelector />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/seat-layout/:showId" element={<SeatLayoutNew />} />
        <Route path="/upcoming-movies" element={<Upcoming />} />
        <Route path="/upcoming-movies/:id" element={<UpcomingMovieDetails />} />
        <Route path="/my-bookings" element={<MyBooking />} />
        <Route path="/loading/:nextUrl" element={<Loading />} />
        <Route path="/favorite" element={<Favorite />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        <Route path="/theatres" element={<Theatre />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/theatre-verify" element={<TheatreVerifyWrapper />} />
        <Route path="/registration-pending" element={<RegistrationPending />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            user?.role === "admin" ? (
              <Layout />
            ) : user ? (
              <Navigate to="/" />
            ) : (
              <div className="min-h-screen flex justify-center items-center">
                <Login />
              </div>
            )
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="theatres" element={<AdminTheatres />} />
          <Route path="movies" element={<AdminMovies />} />
          <Route path="shows" element={<AdminShows />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments-list" element={<AdminPaymentsList />} />
          <Route path="payments/:theatreId" element={<AdminPayments />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="list-bookings" element={<ListBookings />} />
          <Route path="feedbacks" element={<ListFeedbacks />} />
        </Route>

        {/* Manager Routes */}
        <Route
          path="/manager/*"
          element={
            user?.role === "manager" ? (
              <ManagerLayout />
            ) : user ? (
              <Navigate to="/" />
            ) : (
              <div className="min-h-screen flex justify-center items-center">
                <Login />
              </div>
            )
          }
        >
          <Route index element={<ManagerDashboard />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="movies" element={<ManagerMovies />} />
          <Route path="shows" element={<ManagerShows />} />
          <Route path="screens" element={<ManagerScreens />} />
          <Route path="bookings" element={<ManagerBookings />} />
        </Route>
      </Routes>
      </Suspense>
      {!isAdminRoute && !isManagerRoute && <Footer />}
    </>
  );
};

export default App;
