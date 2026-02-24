import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { User, Calendar, Ticket, TrendingUp } from "lucide-react";
import Loading from "../../components/Loading";

const ManagerBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const { axios, getAuthHeaders } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/booking/bookings", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setBookings(data.bookings || []);
        const revenue = (data.bookings || []).reduce(
          (sum, b) => sum + (b.amount || 0),
          0
        );
        setTotalRevenue(revenue);
      } else {
        toast.error(data.message || "Failed to load bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: Ticket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Revenue",
      value: `${currency}${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Paid Bookings",
      value: bookings.filter((b) => b.isPaid).length,
      icon: Ticket,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Theatre Bookings</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-gray-900/30 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-4 rounded-lg`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Booking ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Movie
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Show Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Seats
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-gray-800/30 transition"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-300">
                      {booking._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{booking.user?.name}</p>
                          <p className="text-xs text-gray-400">
                            {booking.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.show?.movie?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {booking.show?.showDateTime
                            ? new Date(
                                booking.show.showDateTime
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                        {booking.selectedSeats?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {currency}
                      {booking.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.isPaid
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {booking.isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-gray-400">No bookings found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerBookings;
