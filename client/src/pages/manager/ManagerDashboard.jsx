import React, { useEffect, useState } from "react";
import { Film, Users, TrendingUp, Tv } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";

const ManagerDashboard = () => {
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const { axios, getAuthHeaders, user } = useAppContext();
  const { getTheatresByManager } = useAuthContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [theatre, setTheatre] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTheatreData = async () => {
    const managerId = user?.id || user?._id;
    if (managerId) {
      console.log("Dashboard fetching theatre for manager:", managerId);
      try {
        const response = await getTheatresByManager(managerId);
        console.log("Dashboard theatre API response:", response);
        if (response.success && response.theatres && response.theatres.length > 0) {
          console.log("Dashboard setting theatre:", response.theatres[0]);
          setTheatre(response.theatres[0]); // Get first theatre from theatres array
        } else {
          console.log("Dashboard: No theatres found or API failed:", response);
        }
      } catch (error) {
        console.error("Dashboard error fetching theatre:", error);
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Dashboard endpoint not implemented in new schema yet
      // For now, return empty data
      setDashboardData({
        activeShows: 0,
        todayBookings: 0,
        monthRevenue: 0,
        screens: 0
      });
      
      // TODO: Implement dashboard aggregation from shows/bookings
      // const { data } = await axios.get("/api/show/shows", {
      //   headers: getAuthHeaders(),
      // });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await Promise.all([
          fetchDashboardData(),
          fetchTheatreData()
        ]);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) return <Loading />;

  const cards = [
    {
      title: "Active Shows",
      value: dashboardData?.activeShows || 0,
      icon: Film,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Today's Bookings",
      value: dashboardData?.todayBookings || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "This Month Revenue",
      value: `${currency}${dashboardData?.monthRevenue?.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Screens",
      value: dashboardData?.screens || 0,
      icon: Tv,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Theatre Manager Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Welcome, <span className="text-primary font-semibold">{user?.name}</span>
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Managing: <span className="font-semibold">
            {theatre?.name || "No Theatre Assigned"}
          </span>
        </p>
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
        <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 rounded-lg p-8 hover:border-red-500/50 transition cursor-pointer">
          <Film className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Shows</h3>
          <p className="text-gray-400 text-sm">
            Add, edit, or delete movie shows and manage showtimes
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-lg p-8 hover:border-purple-500/50 transition cursor-pointer">
          <Tv className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Screens</h3>
          <p className="text-gray-400 text-sm">
            Configure screens, seat layouts, and screen settings
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Theatre Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Currently Active Shows</p>
            <p className="text-2xl font-bold mt-2">{dashboardData?.activeShows || 0}</p>
          </div>
          <div>
            <p className="text-gray-400">Total Screens</p>
            <p className="text-2xl font-bold mt-2">{dashboardData?.screens || 0}</p>
          </div>
          <div>
            <p className="text-gray-400">Monthly Revenue</p>
            <p className="text-2xl font-bold mt-2">
              {currency}
              {dashboardData?.monthRevenue?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
