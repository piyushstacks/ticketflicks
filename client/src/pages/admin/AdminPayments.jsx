import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { ArrowLeft, Calendar, User, Ticket } from "lucide-react";
import Loading from "../../components/Loading";

const AdminPayments = () => {
  const { theatreId } = useParams();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const { axios, getAuthHeaders, imageBaseURL } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/admin/payments/${theatreId}`,
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        setBookings(data.bookings || []);
        setTotalRevenue(data.totalRevenue || 0);
      } else {
        toast.error(data.message || "Failed to load payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [theatreId]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold">Theatre Payments & Bookings</h1>
      </div>

      {/* Revenue Summary */}
      <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-4xl font-bold mt-2">
              {currency}
              {totalRevenue.toFixed(2)}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              From {bookings.length} bookings
            </p>
          </div>
          <div className="text-6xl opacity-10">💰</div>
        </div>
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
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Seats
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Amount
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
                      <div>
                        <p className="font-medium">{booking.user?.name}</p>
                        <p className="text-xs text-gray-400">
                          {booking.user?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.show?.movie?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.show?.showDateTime
                        ? new Date(
                            booking.show.showDateTime
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                        {booking.selectedSeats?.length || 0} seats
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {currency}
                      {booking.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
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

export default AdminPayments;
