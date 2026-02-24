import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Eye, Search, Filter, Calendar, User, Ticket, CreditCard, MapPin } from "lucide-react";


const AdminBookings = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingBooking, setViewingBooking] = useState(null);
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/booking/bookings", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setBookings(data.bookings || []);
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

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.show?.movie?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking._id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "paid" && booking.isPaid) ||
      (statusFilter === "unpaid" && !booking.isPaid);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Booking Details</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bookings</p>
              <p className="text-2xl font-bold mt-1">{bookings.length}</p>
            </div>
            <Ticket className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Paid Bookings</p>
              <p className="text-2xl font-bold mt-1">
                {bookings.filter((b) => b.isPaid).length}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unpaid Bookings</p>
              <p className="text-2xl font-bold mt-1">
                {bookings.filter((b) => !b.isPaid).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">
                {currency}
                {bookings
                  .filter((b) => b.isPaid)
                  .reduce((sum, b) => sum + (b.amount || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-purple-500" />
          </div>
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
                  Show Time
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
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
                      <div>
                        <p className="font-medium">{booking.show?.movie?.title || "N/A"}</p>
                        {booking.show?.theatre?.name && (
                          <p className="text-xs text-gray-400">
                            {booking.show.theatre.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.show?.showDateTime
                        ? new Date(booking.show.showDateTime).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                        {booking.bookedSeats?.length || booking.selectedSeats?.length || 0} seats
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {currency}
                      {booking.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.isPaid
                            ? "bg-green-600/20 text-green-400"
                            : "bg-orange-600/20 text-orange-400"
                        }`}
                      >
                        {booking.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setViewingBooking(booking)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-gray-400">No bookings found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Booking Details</h2>
              <button
                onClick={() => setViewingBooking(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Booking Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Booking Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Booking ID:</span>
                    <span className="ml-2 text-gray-300 font-mono">
                      {viewingBooking._id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        viewingBooking.isPaid
                          ? "bg-green-600/20 text-green-400"
                          : "bg-orange-600/20 text-orange-400"
                      }`}
                    >
                      {viewingBooking.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="ml-2 text-gray-300 font-bold">
                      {currency}{viewingBooking.amount?.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Booking Date:</span>
                    <span className="ml-2 text-gray-300">
                      {new Date(viewingBooking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="ml-2 text-gray-300">{viewingBooking.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2 text-gray-300">{viewingBooking.user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Movie Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Movie Information</h3>
                <div className="flex gap-4">
                  {viewingBooking.show?.movie?.poster_path && (
                    <img
                      src={
                        viewingBooking.show.movie.poster_path.startsWith("http")
                          ? viewingBooking.show.movie.poster_path
                          : `https://image.tmdb.org/t/p/w100${viewingBooking.show.movie.poster_path}`
                      }
                      alt={viewingBooking.show.movie.title}
                      className="w-16 h-20 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{viewingBooking.show?.movie?.title}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {viewingBooking.show?.movie?.overview?.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Show Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Show Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Theatre:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingBooking.show?.theatre?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Screen:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingBooking.show?.screen?.screenNumber
                        ? `Screen ${viewingBooking.show.screen.screenNumber}`
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Show Date & Time:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingBooking.show?.showDateTime
                        ? new Date(viewingBooking.show.showDateTime).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ticket Price:</span>
                    <span className="ml-2 text-gray-300">
                      {currency}{viewingBooking.show?.showPrice || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seat Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Seat Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400">Number of Seats:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingBooking.bookedSeats?.length || viewingBooking.selectedSeats?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Booked Seats:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(viewingBooking.bookedSeats || viewingBooking.selectedSeats || []).map((seat, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full font-semibold"
                        >
                          {typeof seat === 'string' ? seat : seat.seatNumber || seat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
