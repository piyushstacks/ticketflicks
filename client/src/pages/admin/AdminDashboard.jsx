import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  TrendingUp,
  Bookmark,
  Film,
  Monitor,
  Download,
  BarChart3,
  CheckSquare,
  Square
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { axios, getAuthHeaders, user } = useAppContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  
  const reportOptions = [
    { id: "bookings", label: "Bookings", desc: "Detailed breakdown of all reservations" },
    { id: "payments", label: "Payments", desc: "Revenue collections and refund analysis" },
    { id: "movies",   label: "Movies",   desc: "Catalogue analytics and ratings performance" },
    { id: "shows",    label: "Shows",    desc: "Show scheduling insights and distribution" },
    { id: "theatres", label: "Theatres", desc: "Partnership growth and geographic data" },
    { id: "users",    label: "Users",    desc: "Customer acquisition and role splits" }
  ];

  const [selectedReports, setSelectedReports] = useState(
    reportOptions.map(o => o.id)
  );

  const toggleReport = (id) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleDownloadTargeted = async () => {
    if (selectedReports.length === 0) {
      toast.error("Please select at least one report type.");
      return;
    }

    setDownloadingReport(true);
    const isZip = selectedReports.length > 1;
    const toastMsg = isZip ? "Generating zip archive... This may take a minute." : "Generating PDF report...";
    const toastId = toast.loading(toastMsg);
    
    try {
      const typesStr = selectedReports.join(",");
      const response = await axios.get(`/api/admin/analytics/download-targeted?types=${typesStr}`, {
        headers: getAuthHeaders(),
        responseType: "blob",
        timeout: 180000, // 3 minutes
      });

      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || "Report generation failed");
      }

      if (!response.data || response.data.size === 0) {
        throw new Error("Empty report received from server");
      }

      const blobType = isZip ? "application/zip" : "application/pdf";
      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = isZip 
        ? `ticketflicks_reports_${dateStr}.zip` 
        : `ticketflicks_${selectedReports[0]}_report_${dateStr}.pdf`;

      const url = window.URL.createObjectURL(new Blob([response.data], { type: blobType }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Reports downloaded successfully!");
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
        <p className="text-[var(--text-muted)] mt-2">Welcome, {user?.name || "Admin"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-[var(--bg-primary)]/30 border border-[var(--border)] rounded-lg p-6 hover:border-[var(--border-hover)] transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-sm font-medium">
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
        <div 
          onClick={() => navigate('/admin/theatres')}
          className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-lg p-8 hover:border-blue-500/50 hover:-translate-y-1 transition cursor-pointer">
          <Building2 className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Theatres</h3>
          <p className="text-[var(--text-muted)] text-sm">
            Add, edit, or disable theatre locations and assign managers
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/movies')}
          className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-lg p-8 hover:border-purple-500/50 hover:-translate-y-1 transition cursor-pointer">
          <Film className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Movies</h3>
          <p className="text-[var(--text-muted)] text-sm">
            Add, edit, or disable movie details, cast, and other information
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/shows')}
          className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-lg p-8 hover:border-green-500/50 hover:-translate-y-1 transition cursor-pointer">
          <Monitor className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Shows &amp; Screens</h3>
          <p className="text-[var(--text-muted)] text-sm">
            View show schedules, screen details, and occupancy information
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/bookings')}
          className="bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-500/30 rounded-lg p-8 hover:border-orange-500/50 hover:-translate-y-1 transition cursor-pointer">
          <Bookmark className="w-12 h-12 text-orange-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">View Bookings</h3>
          <p className="text-[var(--text-muted)] text-sm">
            Track all bookings and manage user reservations across theatres
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/payments-list')}
          className="bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-500/30 rounded-lg p-8 hover:border-pink-500/50 hover:-translate-y-1 transition cursor-pointer">
          <TrendingUp className="w-12 h-12 text-pink-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Payment Info</h3>
          <p className="text-[var(--text-muted)] text-sm">
            View payment details, revenue analytics, and transaction history
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin')}
          className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/30 rounded-lg p-8 hover:border-indigo-500/50 hover:-translate-y-1 transition cursor-pointer">
          <Users className="w-12 h-12 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">System Overview</h3>
          <p className="text-[var(--text-muted)] text-sm">
             Monitor system performance and user activity statistics
          </p>
        </div>
      </div>

      {/* Analytics Report Section */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-primary)] p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <BarChart3 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Analytics &amp; Custom Reports</h2>
              <p className="text-[var(--text-muted)] text-sm mt-0.5">Select targeted domains to generate PDF reports and data tables.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Select Report Modules</h3>
            <button
              onClick={() => setSelectedReports(
                selectedReports.length === reportOptions.length ? [] : reportOptions.map(o => o.id)
              )}
              className="text-sm font-medium text-red-500 hover:text-red-400 transition underline underline-offset-2"
            >
              {selectedReports.length === reportOptions.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {reportOptions.map((opt) => {
              const checked = selectedReports.includes(opt.id);
              return (
                <div 
                  key={opt.id}
                  onClick={() => toggleReport(opt.id)}
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${checked ? 'border-red-500 bg-red-500/5' : 'border-[var(--border)] hover:border-gray-400 bg-[var(--bg-elevated)]/30'}`}
                >
                  <div className={`mt-0.5 ${checked ? 'text-red-500' : 'text-gray-400'}`}>
                    {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${checked ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{opt.label}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-[var(--border)]">
            <div className="text-sm text-[var(--text-muted)] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Reports are generated live using current database data.
            </div>
            
            <button
              onClick={handleDownloadTargeted}
              disabled={downloadingReport || selectedReports.length === 0}
              className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white px-8 py-3 rounded-lg transition-all font-semibold w-full sm:w-auto justify-center shadow-lg shadow-red-500/20"
            >
              {downloadingReport ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating {selectedReports.length > 1 ? "ZIP" : "PDF"}...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Selected ({selectedReports.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
