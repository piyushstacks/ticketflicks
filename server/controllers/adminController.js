import mongoose from "mongoose";
import { inngest } from "../inngest/index.js";
import BookingNew from "../models/Booking_new.js";
import ShowNew from "../models/Show_new.js";
import UserNew from "../models/User_new.js";
import TheaterNew from "../models/Theater_new.js";
import ScreenNew from "../models/Screen_new.js";
import MovieNew from "../models/Movie_new.js";
import bcryptjs from "bcryptjs";
import sendEmail from "../configs/nodeMailer.js";

export const isAdmin = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    const isAdminUser = user && user.role === "admin";
    res.json({ success: true, isAdmin: isAdminUser });
  } catch (error) {
    res.json({ success: false, message: "not authorized", isAdmin: false });
  }
};

//API to get dashboard data
export const fetchDashboardData = async (req, res) => {
  try {
    const bookings = await BookingNew.find({ isPaid: true });
    const activeShows = await ShowNew.find({
      showDate: { $gte: new Date() },
    }).populate("movie_id");

    const totalUser = await UserNew.countDocuments();

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

// Get pending theatre registrations - New
export const getPendingTheatres = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const pendingTheatres = await TheaterNew.find({ approval_status: "pending" })
      .populate("manager_id", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, theatres: pendingTheatres });
  } catch (error) {
    console.error("[getPendingTheatres]", error);
    res.json({ success: false, message: error.message });
  }
};

// Approve theatre registration - New
export const approveTheatre = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;
    const { action } = req.body; // "approve" or "decline"

    if (!["approve", "decline"].includes(action)) {
      return res.json({ success: false, message: "Invalid action" });
    }

    const theatre = await TheaterNew.findById(theatreId);
    console.log("[DEBUG] approveTheatre - theatre found:", theatre?._id);
    console.log("[DEBUG] approveTheatre - raw manager_id:", theatre?.manager_id);
    
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    // Look up manager directly instead of populate
    let manager = null;
    if (theatre.manager_id) {
      manager = await UserNew.findById(theatre.manager_id);
      console.log("[DEBUG] approveTheatre - manager lookup result:", manager?._id, manager?.name);
    }
    
    if (!manager) {
      return res.json({
        success: false,
        message: "Manager not found for this theatre",
      });
    }

    if (theatre.approval_status !== "pending") {
      return res.json({
        success: false,
        message: "Theatre has already been processed",
      });
    }

    if (action === "approve") {
      // Update theatre status
      theatre.approval_status = "approved";
      theatre.approval_date = new Date();
      await theatre.save();

      // Generate login credentials email
      try {
        const subject = "Theatre Registration Approved - Login Credentials";
        const body = `
          <h2>Theatre Registration Approved!</h2>
          <p>Dear ${manager.name},</p>
          <p>Your theatre registration has been approved by the admin.</p>
          <p><strong>Theatre Details:</strong></p>
          <ul>
            <li><strong>Theatre Name:</strong> ${theatre.name}</li>
            <li><strong>Location:</strong> ${theatre.location}</li>
            <li><strong>Contact:</strong> ${theatre.contact_no}</li>
          </ul>
          <p><strong>Login Credentials:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${manager.email}</li>
            <li><strong>Password:</strong> Use the password you set during registration</li>
          </ul>
          <p>You can now log in to your theatre management dashboard.</p>
          <p>Thank you for choosing our platform!</p>
        `;

        await sendEmail({
          to: manager.email,
          subject,
          body,
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }

      res.json({
        success: true,
        message:
          "Theatre approved successfully and login credentials sent to manager",
      });
    } else {
      // Decline the theatre
      theatre.approval_status = "declined";
      await theatre.save();

      // Send decline email
      try {
        const subject = "Theatre Registration Declined";
        const body = `
          <h2>Theatre Registration Update</h2>
          <p>Dear ${manager.name},</p>
          <p>We regret to inform you that your theatre registration has been declined by the admin.</p>
          <p><strong>Theatre Name:</strong> ${theatre.name}</p>
          <p>If you believe this was an error, please contact our support team.</p>
          <p>Thank you for your interest in our platform.</p>
        `;

        await sendEmail({
          to: manager.email,
          subject,
          body,
        });
      } catch (emailError) {
        console.error("Error sending decline email:", emailError);
      }

      res.json({
        success: true,
        message:
          "Theatre declined successfully and notification sent to manager",
      });
    }
  } catch (error) {
    console.error("[approveTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all shows
export const fetchAllShows = async (req, res) => {
  try {
    const shows = await ShowNew.find({ show_date: { $gte: new Date() }, isActive: true })
      .populate("movie_id")
      .populate("theater_id")
      .populate("screen_id")
      .sort({ show_date: 1 });

    res.json({ success: true, shows });
  } catch (error) {
    console.error("[fetchAllShows]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all bookings
export const fetchAllBookings = async (req, res) => {
  try {
    const bookings = await BookingNew.find({})
      .populate({
        path: "show_id",
        populate: [
          { path: "movie_id" },
          { path: "theater_id" },
          { path: "screen_id" },
        ],
      })
      .populate("user_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[fetchAllBookings]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all screens from approved theatres only
export const fetchAllScreens = async (req, res) => {
  try {
    const screens = await ScreenNew.find({ isDeleted: false })
      .populate({
        path: "Tid",
        match: { approval_status: "approved", disabled: false, isDeleted: false },
        select: "name location manager_id",
      })
      .sort({ createdAt: -1 });

    const screensData = screens
      .filter((screen) => screen.Tid)
      .map((screen) => ({
        _id: screen._id,
        theatre: {
          _id: screen.Tid._id,
          name: screen.Tid.name,
          location: screen.Tid.location,
          city: screen.Tid.location,
          manager: screen.Tid.manager_id,
        },
        screen: {
          name: screen.name,
          capacity: screen.capacity,
          isActive: !screen.isDeleted,
        },
      }));

    res.json({ success: true, screens: screensData });
  } catch (error) {
    console.error("[fetchAllScreens]", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin Dashboard Data - New
export const dashboardAdminData = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const totalTheatres = await TheaterNew.countDocuments();
    const activeUsers = await UserNew.countDocuments({ role: "customer" });
    const paidBookings = await BookingNew.find({ isPaid: true });
    const totalRevenue = paidBookings.reduce(
      (sum, b) => sum + (b.total_amount || 0),
      0,
    );

    res.json({
      success: true,
      data: {
        totalTheaterNews,
        activeUsers,
        totalRevenue,
        totalBookings: paidBookings.length,
      },
    });
  } catch (error) {
    console.error("[dashboardAdminData]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get All Theatres - Only approved theatres (strict: must have approval_status exactly 'approved')
export const getAllTheatres = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    // Debug: First check all theatres without filter
    const allTheatres = await TheaterNew.find({});
    console.log("[DEBUG] Total theatres in DB:", allTheatres.length);
    console.log("[DEBUG] All theatres:", allTheatres.map(t => ({ 
      _id: t._id, 
      name: t.name, 
      approval_status: t.approval_status,
      disabled: t.disabled 
    })));

    const activeTheatresRaw = await TheaterNew.find({ approval_status: "approved", disabled: false })
      .populate("manager_id", "name email phone")
      .sort({ name: 1 });

    console.log("[DEBUG] Active approved theatres found:", activeTheatresRaw.length);

    const disabledTheatresRaw = await TheaterNew.find({ approval_status: "approved", disabled: true })
      .populate("manager_id", "name email phone")
      .sort({ name: 1 });

    console.log("[DEBUG] Disabled approved theatres found:", disabledTheatresRaw.length);

    const addScreenCounts = async (theatresList) => {
      return Promise.all(
        theatresList.map(async (theatre) => {
          const screenCount = await ScreenNew.countDocuments({
            Tid: theatre._id,
            isDeleted: false,
          });
          const theatreObj = theatre.toObject();
          return {
            ...theatreObj,
            screenCount,
          };
        }),
      );
    };

    const theatres = await addScreenCounts(activeTheatresRaw);
    const disabledTheatres = await addScreenCounts(disabledTheatresRaw);

    res.json({ success: true, theatres, disabledTheatres });
  } catch (error) {
    console.error("[getAllTheatres]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get Theatre Details - New
export const getTheatreDetails = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;

    const theatre = await TheaterNew.findById(theatreId).populate(
      "manager_id",
      "name email phone",
    );

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({ success: true, theatre });
  } catch (error) {
    console.error("[getTheatreDetails]", error);
    res.json({ success: false, message: error.message });
  }
};

// Create Theatre - New
export const createTheatre = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { name, location, contact_no, managerId } = req.body;

    if (!name || !location || !contact_no) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Check if manager exists and has manager role
    if (!managerId) {
      return res.json({ success: false, message: "Manager is required" });
    }

    const manager = await UserNew.findById(managerId);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Invalid manager" });
    }

    const theatre = await TheaterNew.create({
      name,
      location,
      contact_no,
      manager_id: managerId,
      approval_status: "approved",
      disabled: false,
    });

    const populatedTheatre = await theatre.populate("manager_id", "name email phone");

    res.json({
      success: true,
      message: "Theatre created successfully",
      theatre: populatedTheatre,
    });
  } catch (error) {
    console.error("[createTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update Theatre - New
export const updateTheatre = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;
    const {
      name,
      location,
      contact_no,
      email,
      address,
      city,
      state,
      zipCode,
      managerId,
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (contact_no) updateData.contact_no = contact_no;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;

    if (managerId) {
      const manager = await UserNew.findById(managerId);
      if (!manager || manager.role !== "manager") {
        return res.json({ success: false, message: "Invalid manager" });
      }
      updateData.manager_id = managerId;
    }

    const theatre = await TheaterNew.findByIdAndUpdate(theatreId, updateData, {
      new: true,
    }).populate("manager_id", "name email phone");

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({
      success: true,
      message: "Theatre updated successfully",
      theatre,
    });
  } catch (error) {
    console.error("[updateTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Disable Theatre - New
export const disableTheatre = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;

    const theatre = await TheaterNew.findByIdAndUpdate(
      theatreId,
      {
        disabled: true,
      },
      { new: true },
    ).populate("manager_id", "name email phone");

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({
      success: true,
      message: "Theatre disabled successfully",
      theatre,
    });
  } catch (error) {
    console.error("[disableTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Enable Theatre - New
export const enableTheatre = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;

    const theatre = await TheaterNew.findByIdAndUpdate(
      theatreId,
      {
        disabled: false,
      },
      { new: true },
    ).populate("manager_id", "name email phone");

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({
      success: true,
      message: "Theatre enabled successfully",
      theatre,
    });
  } catch (error) {
    console.error("[enableTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Theatre - New
export const deleteTheatre = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;

    const theatre = await TheaterNew.findByIdAndDelete(theatreId);

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({ success: true, message: "Theatre deleted successfully" });
  } catch (error) {
    console.error("[deleteTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get Theatre Payments/Bookings - New
export const getTheatrePayments = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;

    const bookings = await BookingNew.find({
      theatre: theatreId,
      isPaid: true,
    })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Safely attach user info (bookings store user as string IDs)
    const userIds = bookings
      .map((b) => (mongoose.isValidObjectId(b.user) ? b.user : null))
      .filter(Boolean);
    const usersMap = userIds.length
      ? (
          await UserNew.find({ _id: { $in: userIds } })
            .select("name email")
            .lean()
        ).reduce((acc, u) => {
          acc[u._id.toString()] = u;
          return acc;
        }, {})
      : {};

    const bookingsWithUser = bookings.map((b) => {
      const userInfo = usersMap[b.user]?.name
        ? usersMap[b.user]
        : { name: b.user || "User", email: b.user || "" };
      return { ...b, user: userInfo };
    });

    const totalRevenue = bookingsWithUser.reduce(
      (sum, b) => sum + (b.amount || 0),
      0,
    );

    res.json({
      success: true,
      bookings: bookingsWithUser,
      totalRevenue,
      count: bookingsWithUser.length,
    });
  } catch (error) {
    console.error("[getTheatrePayments]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all shows for admin - organized by theatre
export const getAllShows = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const shows = await ShowNew.find({})
      .populate("movie_id", "title poster_path overview genres")
      .populate("theater_id", "name location")
      .sort({ showDate: -1 });

    console.log("Found shows for admin:", shows.length);

    res.json({ success: true, shows });
  } catch (error) {
    console.error("[getAllShows]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get screens for a specific theatre
export const getTheatreScreens = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.json({
        success: false,
        message: "Unauthorized - Admin access required",
      });
    }

    const { theatreId } = req.params;

    const screens = await ScreenNew.find({ Tid: theatreId })
      .populate("theatre", "name location")
      .sort({ name: 1 });

    console.log("Found screens for theatre:", theatreId, screens.length);

    res.json({ success: true, screens });
  } catch (error) {
    console.error("[getTheatreScreens]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete a show - Admin only
export const deleteShow = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if show has bookings
    const bookings = await BookingNew.findOne({ show: id });
    if (bookings) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete show that has existing bookings",
      });
    }

    const show = await ShowNew.findByIdAndDelete(id);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error("[deleteShow]", error);
    res.status(500).json({
      success: false,
      message: "Error deleting show",
      error: error.message,
    });
  }
};

// Toggle show active status - Admin only
export const toggleShowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const show = await ShowNew.findById(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    show.isActive = !show.isActive;
    await show.save();

    res.status(200).json({
      success: true,
      message: `Show ${show.isActive ? "activated" : "deactivated"} successfully`,
      show,
    });
  } catch (error) {
    console.error("[toggleShowStatus]", error);
    res.status(500).json({
      success: false,
      message: "Error toggling show status",
      error: error.message,
    });
  }
};
