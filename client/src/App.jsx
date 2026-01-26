import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import SeatLayout from "./pages/SeatLayout";
import BuyTicketsFlow from "./pages/BuyTicketsFlow";
import MyBooking from "./pages/MyBookings";
import Favorite from "./pages/Favorite";
import { Toaster } from "react-hot-toast";
import Layout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTheatres from "./pages/admin/AdminTheatres";
import AdminPayments from "./pages/admin/AdminPayments";
import AddShows from "./pages/admin/AddShows";
import ListShows from "./pages/admin/ListShows";
import ListBookings from "./pages/admin/ListBookings";
import { useAppContext } from "./context/AppContext";
import Loading from "./components/Loading";
import Upcoming from "./pages/Upcoming";
import UpcomingMovieDetails from "./pages/UpcomingMovieDetails";
import ListFeedbacks from "./pages/admin/ListFeedbacks";
import FeedbackForm from "./pages/FeedbackForm";
import Theatre from "./pages/Theatres";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import VerifyEmail from "./pages/VerifyEmail";
import TheatreVerifyWrapper from "./pages/TheatreVerifyWrapper";
import ManagerLayout from "./pages/manager/ManagerLayout";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerShows from "./pages/manager/ManagerShows";
import ManagerScreens from "./pages/manager/ManagerScreens";
import ManagerBookings from "./pages/manager/ManagerBookings";

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isManagerRoute = location.pathname.startsWith("/manager");

  const { user } = useAppContext();

  return (
    <>
      <Toaster />
      {!isAdminRoute && !isManagerRoute && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/buy-tickets/:id" element={<BuyTicketsFlow />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/seat-layout/:id" element={<SeatLayout />} />
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
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/theatre-verify" element={<TheatreVerifyWrapper />} />

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
          <Route path="shows" element={<ManagerShows />} />
          <Route path="screens" element={<ManagerScreens />} />
          <Route path="bookings" element={<ManagerBookings />} />
        </Route>
      </Routes>
      {!isAdminRoute && !isManagerRoute && <Footer />}
    </>
  );
};

export default App;
