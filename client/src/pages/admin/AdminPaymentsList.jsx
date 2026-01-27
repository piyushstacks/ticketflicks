import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Eye, Search, Filter, Calendar, CreditCard, TrendingUp, DollarSign, Activity } from "lucide-react";
import { dummyBookingData } from "../../assets/assets";

const AdminPaymentsList = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewingPayment, setViewingPayment] = useState(null);
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/payments", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setPayments(data.payments || []);
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
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.movie?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "success" && payment.status === "success") ||
      (statusFilter === "pending" && payment.status === "pending") ||
      (statusFilter === "failed" && payment.status === "failed");

    let matchesDate = true;
    if (dateFilter !== "all") {
      const paymentDate = new Date(payment.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case "today":
          matchesDate = paymentDate.toDateString() === today.toDateString();
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const todayRevenue = payments
    .filter((p) => {
      const paymentDate = new Date(p.createdAt);
      const today = new Date();
      return p.status === "success" && paymentDate.toDateString() === today.toDateString();
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

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
        <h1 className="text-3xl font-bold">Payment Information & Details</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
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
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">
                {currency}
                {totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Revenue</p>
              <p className="text-2xl font-bold mt-1">
                {currency}
                {todayRevenue.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Successful Payments</p>
              <p className="text-2xl font-bold mt-1">
                {payments.filter((p) => p.status === "success").length}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Payments</p>
              <p className="text-2xl font-bold mt-1">
                {payments.filter((p) => p.status === "pending").length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Average Transaction</p>
            <p className="text-xl font-bold mt-1">
              {currency}
              {payments.length > 0
                ? (totalRevenue / payments.filter((p) => p.status === "success").length).toFixed(2)
                : "0.00"}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Success Rate</p>
            <p className="text-xl font-bold mt-1">
              {payments.length > 0
                ? `${(
                    (payments.filter((p) => p.status === "success").length / payments.length) *
                    100
                  ).toFixed(1)}%`
                : "0%"}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Failed Transactions</p>
            <p className="text-xl font-bold mt-1">
              {payments.filter((p) => p.status === "failed").length}
            </p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Movie
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-gray-800/30 transition"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-300">
                      {payment.transactionId?.slice(-12).toUpperCase() || payment._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium">{payment.user?.name}</p>
                        <p className="text-xs text-gray-400">
                          {payment.user?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium">{payment.movie?.title || "N/A"}</p>
                        {payment.theatre?.name && (
                          <p className="text-xs text-gray-400">
                            {payment.theatre.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {currency}
                      {payment.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                        {payment.method || "Online"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.status === "success"
                            ? "bg-green-600/20 text-green-400"
                            : payment.status === "pending"
                            ? "bg-orange-600/20 text-orange-400"
                            : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        {payment.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setViewingPayment(payment)}
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
                    <p className="text-gray-400">No payments found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Payment Details</h2>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Transaction Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="ml-2 text-gray-300 font-mono">
                      {viewingPayment.transactionId || viewingPayment._id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        viewingPayment.status === "success"
                          ? "bg-green-600/20 text-green-400"
                          : viewingPayment.status === "pending"
                          ? "bg-orange-600/20 text-orange-400"
                          : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {viewingPayment.status || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="ml-2 text-gray-300 font-bold">
                      {currency}{viewingPayment.amount?.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingPayment.method || "Online Payment"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Payment Date:</span>
                    <span className="ml-2 text-gray-300">
                      {new Date(viewingPayment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {viewingPayment.paidAt && (
                    <div>
                      <span className="text-gray-400">Paid At:</span>
                      <span className="ml-2 text-gray-300">
                        {new Date(viewingPayment.paidAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="ml-2 text-gray-300">{viewingPayment.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2 text-gray-300">{viewingPayment.user?.email}</span>
                  </div>
                  {viewingPayment.user?.phone && (
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <span className="ml-2 text-gray-300">{viewingPayment.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Booking Information</h3>
                <div className="flex gap-4 mb-4">
                  {viewingPayment.movie?.poster_path && (
                    <img
                      src={
                        viewingPayment.movie.poster_path.startsWith("http")
                          ? viewingPayment.movie.poster_path
                          : `https://image.tmdb.org/t/p/w100${viewingPayment.movie.poster_path}`
                      }
                      alt={viewingPayment.movie.title}
                      className="w-16 h-20 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{viewingPayment.movie?.title}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {viewingPayment.theatre?.name} • {viewingPayment.screenNumber ? `Screen ${viewingPayment.screenNumber}` : ""}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Show Date & Time:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingPayment.showDateTime
                        ? new Date(viewingPayment.showDateTime).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Seats:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingPayment.seats?.length || 0} seats
                    </span>
                  </div>
                  {viewingPayment.seats && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Booked Seats:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {viewingPayment.seats.map((seat, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/20 text-primary text-xs rounded"
                          >
                            {typeof seat === 'string' ? seat : seat.seatNumber || seat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Gateway Details */}
              {viewingPayment.gatewayResponse && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-3">Gateway Response</h3>
                  <div className="text-xs text-gray-400 font-mono bg-gray-900 p-3 rounded overflow-x-auto">
                    {JSON.stringify(viewingPayment.gatewayResponse, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsList;
