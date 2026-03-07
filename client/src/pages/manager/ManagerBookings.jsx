import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { User, Calendar, Ticket, TrendingUp, XCircle } from "lucide-react";
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
      const { data } = await axios.get("/api/manager/bookings", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setBookings(data.bookings || []);
        const revenue = (data.bookings || []).reduce(
          (sum, b) => (b.paymentStatus === "completed" && b.status === "confirmed") ? sum + (b.totalAmount || 0) : sum,
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
      title: "Completed Payments",
      value: bookings.filter((b) => b.paymentStatus === "completed").length,
      icon: Ticket,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Failed Payments",
      value: bookings.filter((b) => b.paymentStatus === "failed").length,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Theatre Bookings</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-[var(--bg-primary)]/30 border border-[var(--border)] rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-sm">{stat.title}</p>
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
      <div className="bg-[var(--bg-primary)]/30 border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  Booking ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  Movie
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  Show Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  Seats
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">
                  Payment Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-[var(--bg-secondary)]/30 transition"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-[var(--text-secondary)]">
                      {booking.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                        <div>
                          <p className="font-medium">{booking.user?.name || "N/A"}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {booking.user?.email || "No Email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.show?.movie || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                        <span>
                          {booking.show?.dateTime
                            ? new Date(booking.show.dateTime).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                        {booking.seats?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {currency}
                      {booking.totalAmount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-green-500/20 text-green-400"
                            : booking.status === "cancelled"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.paymentStatus === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {booking.paymentStatus === "completed" ? "Paid" : "Pending"}
                        </span>
                        {booking.paymentId && (
                           <p className="text-[10px] text-gray-500 font-mono mt-1 w-24 truncate" title={booking.paymentId}>
                             {booking.paymentId}
                           </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-[var(--text-muted)]">No bookings found</p>
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
