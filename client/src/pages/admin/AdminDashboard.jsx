import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  TrendingUp,
  Bookmark,
  Film,
  Monitor,
  BarChart3,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { axios, getAuthHeaders, user } = useAppContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (user) fetchDashboardData();
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
                <p className="text-[var(--text-muted)] text-sm font-medium">{card.title}</p>
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
          className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-lg p-8 hover:border-blue-500/50 hover:-translate-y-1 transition cursor-pointer"
        >
          <Building2 className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Theatres</h3>
          <p className="text-[var(--text-muted)] text-sm">
            Add, edit, or disable theatre locations and assign managers
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/movies')}
          className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-lg p-8 hover:border-purple-500/50 hover:-translate-y-1 transition cursor-pointer"
        >
          <Film className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Movies</h3>
          <p className="text-[var(--text-muted)] text-sm">
            Add, edit, or disable movie details, cast, and other information
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/shows')}
          className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-lg p-8 hover:border-green-500/50 hover:-translate-y-1 transition cursor-pointer"
        >
          <Monitor className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Shows &amp; Screens</h3>
          <p className="text-[var(--text-muted)] text-sm">
            View show schedules, screen details, and occupancy information
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/bookings')}
          className="bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-500/30 rounded-lg p-8 hover:border-orange-500/50 hover:-translate-y-1 transition cursor-pointer"
        >
          <Bookmark className="w-12 h-12 text-orange-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">View Bookings</h3>
          <p className="text-[var(--text-muted)] text-sm">
            Track all bookings and manage user reservations across theatres
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/payments-list')}
          className="bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-500/30 rounded-lg p-8 hover:border-pink-500/50 hover:-translate-y-1 transition cursor-pointer"
        >
          <TrendingUp className="w-12 h-12 text-pink-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Payment Info</h3>
          <p className="text-[var(--text-muted)] text-sm">
            View payment details, revenue analytics, and transaction history
          </p>
        </div>

        {/* ── Advanced Reports Card ── */}
        <div
          onClick={() => navigate('/admin/reports')}
          className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 rounded-lg p-8 hover:border-red-500/60 hover:-translate-y-1 transition cursor-pointer group relative overflow-hidden"
        >
          <span className="absolute -top-4 -right-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition" />
          <BarChart3 className="w-12 h-12 text-red-400 mb-4 relative z-10" />
          <h3 className="text-xl font-bold mb-2 relative z-10">Advanced Reports</h3>
          <p className="text-[var(--text-muted)] text-sm relative z-10">
            Generate filtered PDF/ZIP reports by date range, revenue, tickets sold &amp; more
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-red-400 font-semibold relative z-10">
            Open Reports →
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
