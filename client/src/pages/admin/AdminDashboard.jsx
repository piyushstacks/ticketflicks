import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  TrendingUp,
  Bookmark,
  Film,
  Monitor,
  Download,
  BarChart3,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";

const AdminDashboard = () => {
  const { axios, getAuthHeaders, user } = useAppContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingCharts, setDownloadingCharts] = useState(false);

  const handleDownloadComprehensive = async () => {
    setDownloadingReport(true);
    const toastId = toast.loading("Generating report... This may take up to 2 minutes.");
    try {
      const response = await axios.get("/api/admin/analytics/download-comprehensive", {
        headers: getAuthHeaders(),
        responseType: "blob",
        timeout: 180000, // 3 minutes — Python script needs time to run
      });

      // Validate we got a real ZIP blob (not a JSON error response)
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        // Server returned a JSON error inside a blob
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || "Report generation failed");
      }

      if (!response.data || response.data.size === 0) {
        throw new Error("Empty report received from server");
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticketflicks_report_${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Download error:", error);
      const msg = error.code === "ECONNABORTED"
        ? "Request timed out. The report is very large — please try again."
        : error.message || "Failed to download report. Please try again.";
      toast.error(msg, { duration: 6000 });
    } finally {
      setDownloadingReport(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setDashboardData(data.data);
      } else {
        toast.error(data.message || "Failed to load dashboard");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) return <Loading />;

  const cards = [
    {
      title: "Total Theatres",
      value: dashboardData?.totalTheatres || 0,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Users",
      value: dashboardData?.activeUsers || 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Total Revenue",
      value: `₹${dashboardData?.totalRevenue?.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Bookings",
      value: dashboardData?.totalBookings || 0,
      icon: Bookmark,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome, {user?.name || "Admin"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  {card.title}
                </p>
                <p className="text-3xl font-bold mt-3">{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-4 rounded-lg`}>
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-lg p-8 hover:border-blue-500/50 transition cursor-pointer">
          <Building2 className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Theatres</h3>
          <p className="text-gray-400 text-sm">
            Add, edit, or disable theatre locations and assign managers
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-lg p-8 hover:border-purple-500/50 transition cursor-pointer">
          <Film className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Movies</h3>
          <p className="text-gray-400 text-sm">
            Add, edit, or disable movie details, cast, and other information
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-lg p-8 hover:border-green-500/50 transition cursor-pointer">
          <Monitor className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Shows & Screens</h3>
          <p className="text-gray-400 text-sm">
            View show schedules, screen details, and occupancy information
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-500/30 rounded-lg p-8 hover:border-orange-500/50 transition cursor-pointer">
          <Bookmark className="w-12 h-12 text-orange-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">View Bookings</h3>
          <p className="text-gray-400 text-sm">
            Track all bookings and manage user reservations across theatres
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-500/30 rounded-lg p-8 hover:border-pink-500/50 transition cursor-pointer">
          <TrendingUp className="w-12 h-12 text-pink-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Payment Info</h3>
          <p className="text-gray-400 text-sm">
            View payment details, revenue analytics, and transaction history
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/30 rounded-lg p-8 hover:border-indigo-500/50 transition cursor-pointer">
          <Users className="w-12 h-12 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">System Overview</h3>
          <p className="text-gray-400 text-sm">
            Monitor system performance and user activity statistics
          </p>
        </div>
      </div>

      {/* Analytics Report Section */}
      <div className="bg-gradient-to-br from-red-600/15 to-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-red-400" />
            <div>
              <h2 className="text-xl font-bold">Analytics &amp; Reports</h2>
              <p className="text-gray-400 text-sm">Generate comprehensive analytics reports</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Download Comprehensive PDF Report */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-5 hover:border-red-500/50 transition">
            <div className="flex items-center gap-4">
              <div className="bg-red-500/15 p-3 rounded-lg flex gap-2 shrink-0">
                {/* PDF file icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8M8 17h5" />
                </svg>
                <BarChart3 className="w-6 h-6 text-red-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">Comprehensive Analytics Report <span className="text-xs text-red-400 font-normal ml-1 bg-red-500/10 px-2 py-0.5 rounded">PDF</span></h3>
                <p className="text-gray-400 text-sm mt-0.5">
                  Full analytics with charts, data tables, KPIs &amp; AI-generated strategic insights
                </p>
              </div>
              <button
                onClick={handleDownloadComprehensive}
                disabled={downloadingReport}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition font-medium w-52 justify-center shrink-0"
              >
                {downloadingReport ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-xs mt-4">
          Note: Report is generated live from MongoDB. Generation takes 60-90 seconds &mdash; please wait.
        </p>
      </div>

      {/* Info Section */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">System Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Total Theatres Registered</p>
            <p className="text-2xl font-bold mt-2">
              {dashboardData?.totalTheatres || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Registered Users</p>
            <p className="text-2xl font-bold mt-2">
              {dashboardData?.activeUsers || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
