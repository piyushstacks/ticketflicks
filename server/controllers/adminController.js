import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import { clerkClient, getAuth } from "@clerk/express";

//API to check if user is admin
export const isAdmin = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const user = await clerkClient.users.getUser(userId);

    const isAdminUser = user.privateMetadata?.role === "admin";

    res.json({ success: true, isAdmin: isAdminUser });
  } catch (error) {
    console.error("[isAdmin]", error);
    res.json({ success: false, message: "not authorized", isAdmin: false });
  }
};

//API to get dashboard data
export const fetchDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    }).populate("movie");

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      activeShows,
      totalUser,
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error("[fetchDashboardData]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all shows
export const fetchAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    res.json({ success: true, shows });
  } catch (error) {
    console.error("[fetchAllShows]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all bookings
export const fetchAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .populate({ path: "show", populate: { path: "movie" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[fetchAllBookings]", error);
    res.json({ success: false, message: error.message });
  }
};
