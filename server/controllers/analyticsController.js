/**
 * Analytics Controller
 * Handles analytics report generation and export
 */

import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import Show from "../models/show_tbls.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_TYPES = ["bookings", "payments", "movies", "shows", "users", "theatres"];

/**
 * Get analytics data for dashboard
 */
export const getAnalyticsData = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Fetch all data
  const bookings = await Booking.find(Object.keys(dateFilter).length > 0 ? dateFilter : {})
    .populate("user_id", "name email")
    .populate({
      path: "show_id",
      populate: [
        { path: "movie", select: "title genres" },
        { path: "theatre", select: "name city" },
      ],
    });

  const movies = await Movie.find({ isActive: true, isDeleted: { $ne: true } });
  const theatres = await Theatre.find();
  const shows = await Show.find().populate("movie", "title").populate("theatre", "name city");
  const users = await User.find();

  // Calculate analytics
  const totalRevenue = bookings
    .filter((b) => b.payment_status === "completed")
    .reduce((acc, b) => acc + (b.total_amount || 0), 0);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  // Revenue by movie
  const revenueByMovie = {};
  bookings.forEach((b) => {
    if (b.payment_status === "completed" && b.show_id?.movie?.title) {
      const title = b.show_id.movie.title;
      revenueByMovie[title] = (revenueByMovie[title] || 0) + (b.total_amount || 0);
    }
  });

  // Revenue by theatre
  const revenueByTheatre = {};
  bookings.forEach((b) => {
    if (b.payment_status === "completed" && b.show_id?.theatre?.name) {
      const name = b.show_id.theatre.name;
      revenueByTheatre[name] = (revenueByTheatre[name] || 0) + (b.total_amount || 0);
    }
  });

  // Bookings by day of week
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const bookingsByDay = {};
  dayNames.forEach((day) => (bookingsByDay[day] = 0));
  bookings.forEach((b) => {
    if (b.createdAt) {
      const day = dayNames[new Date(b.createdAt).getDay()];
      bookingsByDay[day]++;
    }
  });

  // Bookings by hour
  const bookingsByHour = {};
  for (let i = 0; i < 24; i++) bookingsByHour[i] = 0;
  bookings.forEach((b) => {
    if (b.createdAt) {
      const hour = new Date(b.createdAt).getHours();
      bookingsByHour[hour]++;
    }
  });

  // User role distribution
  const usersByRole = { customer: 0, manager: 0, admin: 0 };
  users.forEach((u) => {
    if (usersByRole.hasOwnProperty(u.role)) usersByRole[u.role]++;
  });

  // Theatre by city
  const theatresByCity = {};
  theatres.forEach((t) => {
    if (t.city) theatresByCity[t.city] = (theatresByCity[t.city] || 0) + 1;
  });

  // Genre distribution
  const genreDistribution = {};
  movies.forEach((m) => {
    if (m.genres && Array.isArray(m.genres)) {
      m.genres.forEach((g) => {
        const name = typeof g === "object" ? g.name : g;
        if (name) genreDistribution[name] = (genreDistribution[name] || 0) + 1;
      });
    }
  });

  // Rating distribution
  const ratingDistribution = { "9-10": 0, "8-9": 0, "7-8": 0, "6-7": 0, "Below 6": 0 };
  movies.forEach((m) => {
    const rating = m.imdbRating || m.vote_average;
    if (rating) {
      if (rating >= 9) ratingDistribution["9-10"]++;
      else if (rating >= 8) ratingDistribution["8-9"]++;
      else if (rating >= 7) ratingDistribution["7-8"]++;
      else if (rating >= 6) ratingDistribution["6-7"]++;
      else ratingDistribution["Below 6"]++;
    }
  });

  // Top customers
  const customerSpending = {};
  bookings.forEach((b) => {
    if (b.payment_status === "completed" && b.user_id) {
      const userId = b.user_id._id?.toString() || b.user_id.toString();
      const name = b.user_id.name || "Unknown";
      if (!customerSpending[userId]) {
        customerSpending[userId] = { name, total: 0, bookings: 0 };
      }
      customerSpending[userId].total += b.total_amount || 0;
      customerSpending[userId].bookings++;
    }
  });

  const topCustomers = Object.entries(customerSpending)
    .map(([id, data]) => ({ userId: id, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Daily trends (last 30 days)
  const dailyTrends = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dailyTrends[dateStr] = { bookings: 0, revenue: 0 };
  }

  bookings.forEach((b) => {
    if (b.createdAt) {
      const dateStr = new Date(b.createdAt).toISOString().split("T")[0];
      if (dailyTrends[dateStr]) {
        dailyTrends[dateStr].bookings++;
        if (b.payment_status === "completed") {
          dailyTrends[dateStr].revenue += b.total_amount || 0;
        }
      }
    }
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalRevenue,
        totalMovies: movies.length,
        totalTheatres: theatres.length,
        totalUsers: users.length,
        averageBookingValue: bookings.length > 0 ? totalRevenue / confirmedBookings.length : 0,
      },
      bookingsByStatus: {
        confirmed: confirmedBookings.length,
        pending: pendingBookings.length,
        cancelled: cancelledBookings.length,
      },
      paymentStatus: {
        completed: bookings.filter((b) => b.payment_status === "completed").length,
        pending: bookings.filter((b) => b.payment_status === "pending").length,
        failed: bookings.filter((b) => b.payment_status === "failed").length,
        refunded: bookings.filter((b) => b.payment_status === "refunded").length,
      },
      revenueByMovie: Object.entries(revenueByMovie)
        .map(([movie, revenue]) => ({ movie, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15),
      revenueByTheatre: Object.entries(revenueByTheatre)
        .map(([theatre, revenue]) => ({ theatre, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15),
      bookingsByDay,
      bookingsByHour,
      usersByRole,
      theatresByCity,
      genreDistribution: Object.entries(genreDistribution)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      ratingDistribution,
      topCustomers,
      dailyTrends: Object.entries(dailyTrends).map(([date, data]) => ({
        date,
        ...data,
      })),
    },
  });
});

/**
 * Generate and download comprehensive analytics PDF report
 */
export const downloadComprehensive = asyncHandler(async (req, res) => {
  const projectRoot = path.resolve(__dirname, "../..");
  const analyticsDir = path.join(projectRoot, "analytics");
  const reportsDir = path.join(analyticsDir, "reports");

  console.log("[Analytics] Project root:", projectRoot);

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const pythonScript = path.join(analyticsDir, "analytics_report.py");

  if (!fs.existsSync(pythonScript)) {
    return res.status(500).json({
      success: false,
      message: "Analytics script not found at: " + pythonScript,
    });
  }

  console.log("[Analytics] Running Python script:", pythonScript);

  const env = { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY || "dummy" };

  exec(`python3 "${pythonScript}"`, { cwd: analyticsDir, timeout: 180000, env }, (error, stdout, stderr) => {
    if (error) {
      console.error("[Analytics] Script error:", error);
      console.error("[Analytics] stderr:", stderr);
      return res.status(500).json({
        success: false,
        message: "Failed to generate report",
        error: stderr || error.message,
      });
    }

    const pdfPath = path.join(reportsDir, "comprehensive_report.pdf");

    if (!fs.existsSync(pdfPath)) {
      console.error("[Analytics] PDF not found after script run:", pdfPath);
      return res.status(500).json({ success: false, message: "PDF generation succeeded but file not found." });
    }

    const filename = `ticketflicks_report_${new Date().toISOString().split("T")[0]}.pdf`;
    console.log("[Analytics] Sending PDF:", pdfPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fs.statSync(pdfPath).size);

    const stream = fs.createReadStream(pdfPath);
    stream.on("error", (err) => {
      console.error("[Analytics] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error streaming PDF" });
      }
    });
    stream.pipe(res);
    console.log("[Analytics] PDF sent successfully!");
  });
});


/**
 * Generate targeted report(s) by type and download as PDF (single) or ZIP (multiple)
 * Query: ?types=bookings,payments,movies  OR  ?types=all
 */
export const downloadTargetedReport = asyncHandler(async (req, res) => {
  const rawTypes = req.query.types || "";
  const requested = rawTypes.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

  const types =
    requested.includes("all")
      ? VALID_TYPES
      : requested.filter((t) => VALID_TYPES.includes(t));

  if (types.length === 0) {
    return res.status(400).json({
      success: false,
      message: `No valid types provided. Valid: ${VALID_TYPES.join(", ")}`,
    });
  }

  // ── Advanced filter params ───────────────────────────────────────────────
  const startDate   = req.query.startDate   || "";
  const endDate     = req.query.endDate     || "";
  const sortBy      = req.query.sortBy      || "date";
  const sortOrder   = req.query.sortOrder   || "desc";
  const topN        = req.query.topN        || "0";
  const movieFilter = req.query.movieFilter || "";

  const projectRoot = path.resolve(__dirname, "../..");
  const analyticsDir = path.join(projectRoot, "analytics");
  const reportsDir = path.join(analyticsDir, "reports");
  const script = path.join(analyticsDir, "generate_targeted_report.py");

  if (!fs.existsSync(script)) {
    return res.status(500).json({ success: false, message: "Targeted report script not found." });
  }

  fs.mkdirSync(reportsDir, { recursive: true });

  const typesArg = types.join(" ");

  // Build filter flags (only include non-empty values to keep the command clean)
  const filterFlags = [
    startDate   ? `--start_date "${startDate}"`     : "",
    endDate     ? `--end_date "${endDate}"`         : "",
    sortBy      ? `--sort_by "${sortBy}"`           : "",
    sortOrder   ? `--sort_order "${sortOrder}"`     : "",
    topN && topN !== "0" ? `--top_n "${topN}"`      : "",
    movieFilter ? `--movie_filter "${movieFilter}"` : "",
  ].filter(Boolean).join(" ");

  const cmd = `python3 "${script}" --types ${typesArg} ${filterFlags}`.trim();

  console.log("[Analytics] Running targeted report:", cmd);

  exec(cmd, { cwd: analyticsDir, timeout: 300000 }, (error, stdout, stderr) => {
    if (error) {
      console.error("[Analytics] Script error:", error);
      console.error("[Analytics] stderr:", stderr);
      return res.status(500).json({
        success: false,
        message: "Report generation failed",
        error: stderr || error.message,
      });
    }

    console.log("[Analytics] stdout:", stdout);

    // Parse output path from stdout
    let filePath = null;
    let isZip = false;

    const zipMatch = stdout.match(/ZIP_PATH:(.+)/);
    const pdfMatch = stdout.match(/PDF_PATH:(.+)/);

    if (zipMatch) {
      filePath = zipMatch[1].trim();
      isZip = true;
    } else if (pdfMatch) {
      filePath = pdfMatch[1].trim();
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(500).json({ success: false, message: "Output file not found after generation." });
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = isZip
      ? `ticketflicks_reports_${types.join("_")}_${dateStr}.zip`
      : `ticketflicks_${types[0]}_report_${dateStr}.pdf`;

    const contentType = isZip ? "application/zip" : "application/pdf";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fs.statSync(filePath).size);

    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("[Analytics] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error streaming file" });
      }
    });
    stream.pipe(res);
  });
});


export default {
  getAnalyticsData,
  downloadComprehensive,
  downloadTargetedReport,
};
