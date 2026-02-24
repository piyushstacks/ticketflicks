import {
  ChartLineIcon,
  CircleDollarSignIcon,
  PlayCircleIcon,
  StarIcon,
  UsersIcon,
  Building2,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import dateFormat from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const { axios, getAuthHeaders, user, imageBaseURL } = useAppContext();

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0,
    totalTheatres: 0,
    activeUsers: 0,
  });

  const [loading, setLoading] = useState(true);

  const dashboardCards = [
    {
      title: "Total Theatres",
      value: dashboardData.totalTheatres || "0",
      icon: Building2,
      color: "text-blue-500",
    },
    {
      title: "Active Users",
      value: dashboardData.activeUsers || "0",
      icon: UsersIcon,
      color: "text-purple-500",
    },
    {
      title: "Total Revenue",
      value: currency + (dashboardData.totalRevenue || "0"),
      icon: CircleDollarSignIcon,
      color: "text-green-500",
    },
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings || "0",
      icon: ChartLineIcon,
      color: "text-orange-500",
    },
  ];

  const fetchDashboardData = async () => {
    try {
      // Dashboard stats not implemented in new schema yet - using placeholder
      setDashboardData(prev => ({
        ...prev,
        totalTheatres: 0,
        activeUsers: 0,
        totalRevenue: 0,
        totalBookings: 0,
      }));
      
      // Fetch active shows separately
      try {
        const showsResponse = await axios.get("/api/show/shows", {
          headers: getAuthHeaders(),
        });
        if (showsResponse.data.success) {
          setDashboardData(prev => ({
            ...prev,
            activeShows: showsResponse.data.shows || [],
          }));
        }
      } catch (showsError) {
        console.error("Error fetching active shows:", showsError);
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

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />
      <div className="relative flex flex-wrap gap-4 mt-6">
        <BlurCircle top="-100px" left="0" />
        <div className="flex flex-wrap gap-4 w-full">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full"
            >
              <div>
                <h1 className="text-sm">{card.title}</h1>
                <p className="text-xl font-medium mt-1">{card.value}</p>
              </div>
              <card.icon className="w-6 h-6" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-xl font-medium">Active Shows</p>
      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />
        {dashboardData.activeShows.map((show) => (
          <div
            key={show._id}
            className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 
            hover:-translate-y-1 transition duration-300"
          >
            <img
              src={imageBaseURL + show.movie.poster_path}
              alt={show.movie.title}
              className="h-60 w-full object-cover"
            />
            <p className="font-medium p-2 truncate">{show.movie.title}</p>
            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-medium">
                {currency} {show.showPrice}
              </p>
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>
            <p className="px-2 pt-2 text-sm text-gray-500">
              {dateFormat(show.showDateTime)}
            </p>
          </div>
        ))}
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default Dashboard;
