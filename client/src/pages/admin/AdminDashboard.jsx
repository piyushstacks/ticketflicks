import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  TrendingUp,
  Bookmark,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";

const AdminDashboard = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const { axios, getAuthHeaders, user } = useAppContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard-admin", {
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
      value: `${currency}${dashboardData?.totalRevenue?.toFixed(2) || "0.00"}`,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-lg p-8 hover:border-blue-500/50 transition cursor-pointer">
          <Building2 className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Theatres</h3>
          <p className="text-gray-400 text-sm">
            Add, edit, or delete theatre locations and assign managers
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-lg p-8 hover:border-purple-500/50 transition cursor-pointer">
          <Users className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">View Bookings</h3>
          <p className="text-gray-400 text-sm">
            Track all bookings and manage user reservations across theatres
          </p>
        </div>
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
