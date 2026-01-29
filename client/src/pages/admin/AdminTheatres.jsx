import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Edit2, Ban, MapPin, Users, Phone, CheckCircle, XCircle, Clock, Monitor } from "lucide-react";

const AdminTheatres = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [theatres, setTheatres] = useState([]);
  const [pendingTheatres, setPendingTheatres] = useState([]);
  const [disabledTheatres, setDisabledTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "approved"
  const [viewingScreens, setViewingScreens] = useState(null);
  const [screens, setScreens] = useState([]);
  const [screensLoading, setScreensLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    contact_no: "",
    email: "",
  });

  const fetchScreens = async (theatreId) => {
    try {
      setScreensLoading(true);
      const { data } = await axios.get(`/api/admin/theatres/${theatreId}/screens`, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setScreens(data.screens || []);
      } else {
        toast.error(data.message || "Failed to load screens");
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
      toast.error("Failed to load screens");
    } finally {
      setScreensLoading(false);
    }
  };

  const handleViewScreens = (theatre) => {
    setViewingScreens(theatre);
    fetchScreens(theatre._id);
  };

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      
      // Fetch pending theatres
      const pendingResponse = await axios.get("/api/admin/theatres/pending", {
        headers: getAuthHeaders(),
      });

      // Fetch approved and disabled theatres
      const approvedResponse = await axios.get("/api/admin/theatres", {
        headers: getAuthHeaders(),
      });

      if (pendingResponse.data.success) {
        setPendingTheatres(pendingResponse.data.theatres);
      } else {
        toast.error(pendingResponse.data.message || "Failed to load pending theatres");
      }

      if (approvedResponse.data.success) {
        setTheatres(approvedResponse.data.theatres);
        setDisabledTheatres(approvedResponse.data.disabledTheatres);
      } else {
        toast.error(approvedResponse.data.message || "Failed to load theatres");
      }
    } catch (error) {
      console.error("Error fetching theatres:", error);
      toast.error("Failed to load theatres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.city || !formData.state) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      // Only handle editing existing theatres, not adding new ones
      if (!editingId) {
        toast.error("No theatre selected for editing");
        return;
      }

      const response = await axios.put(
        `/api/admin/theatres/${editingId}`,
        formData,
        { headers: getAuthHeaders() }
      );

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setFormData({
          name: "",
          location: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          contact_no: "",
          email: "",
        });
        setEditingId(null);
        setShowForm(false);
        fetchTheatres();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save theatre");
    }
  };

  const handleEdit = (theatre) => {
    setFormData({
      name: theatre.name,
      location: theatre.location,
      address: theatre.address,
      city: theatre.city,
      state: theatre.state,
      zipCode: theatre.zipCode || "",
      contact_no: theatre.contact_no || "",
      email: theatre.email || "",
    });
    setEditingId(theatre._id);
    setShowForm(true);
  };

  const handleDisable = async (theatreId) => {
    if (!window.confirm("Are you sure you want to disable this theatre?")) return;

    try {
      const { data } = await axios.put(
        `/api/admin/theatres/${theatreId}/disable`,
        {},
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        toast.success("Theatre disabled successfully");
        fetchTheatres();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to disable theatre");
    }
  };

  const handleEnable = async (theatreId) => {
    if (!window.confirm("Are you sure you want to enable this theatre?")) return;

    try {
      const { data } = await axios.put(
        `/api/admin/theatres/${theatreId}/enable`,
        {},
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        toast.success("Theatre enabled successfully");
        fetchTheatres();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to enable theatre");
    }
  };

  const handleApproveTheatre = async (theatreId, action) => {
    try {
      const { data } = await axios.put(
        `/api/admin/theatres/${theatreId}/approve`,
        { action },
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        toast.success(data.message);
        fetchTheatres();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error processing theatre:", error);
      toast.error("Failed to process theatre request");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      location: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      contact_no: "",
      email: "",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[100vw] overflow-x-hidden px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold truncate">Theatres Management</h1>
      </div>

      {/* Approval Status Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-gray-700 pb-px -mx-1 px-1">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-2 sm:px-4 font-medium transition rounded-t-lg whitespace-nowrap ${
            activeTab === "pending"
              ? "text-primary border-b-2 border-primary bg-gray-800/50"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Pending </span>({pendingTheatres.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-3 py-2 sm:px-4 font-medium transition rounded-t-lg whitespace-nowrap ${
            activeTab === "approved"
              ? "text-primary border-b-2 border-primary bg-gray-800/50"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Approved </span>({theatres.filter(t => t.approval_status === "approved" && !t.disabled).length})
          </span>
        </button>
      </div>



      {/* Edit Form - Only for existing theatres */}
      {showForm && editingId && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4 sm:p-6 w-full overflow-hidden">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Edit Theatre</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                type="text"
                name="name"
                placeholder="Theatre Name *"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="state"
                placeholder="State *"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="zipCode"
                placeholder="Zip Code"
                value={formData.zipCode}
                onChange={handleInputChange}
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="tel"
                name="contact_no"
                placeholder="Contact / Phone"
                value={formData.contact_no}
                onChange={handleInputChange}
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full min-w-0 px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 sm:px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium text-sm sm:text-base"
              >
                Update Theatre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Theatres Grid */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
          {pendingTheatres.map((theatre) => (
            <div
              key={theatre._id}
              className="bg-gray-900/30 border border-yellow-500/30 rounded-xl p-4 sm:p-5 hover:border-yellow-500/50 transition min-w-0 overflow-hidden flex flex-col"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-lg sm:text-xl font-bold truncate">{theatre.name}</h3>
                  <span className="shrink-0 px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-400 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 shrink-0 text-primary" />
                    <span className="truncate">{theatre.location || "N/A"}</span>
                  </div>

                  {theatre.manager_id && (
                    <>
                      <div className="text-xs truncate">
                        <span className="text-gray-500">Manager: </span>
                        <span>{theatre.manager_id.name}</span>
                      </div>
                      <div className="text-xs truncate">
                        <span className="text-gray-500">Email: </span>
                        <span>{theatre.manager_id.email}</span>
                      </div>
                      {theatre.manager_id.phone && (
                        <div className="text-xs">
                          <span className="text-gray-500">Phone: </span>
                          <span>{theatre.manager_id.phone}</span>
                        </div>
                      )}
                    </>
                  )}

                  {(theatre.screenCount !== undefined || (theatre.screens && theatre.screens.length > 0)) && (
                    <div className="text-xs flex items-center gap-1">
                      <span className="text-gray-500">Screens: </span>
                      <span className="text-primary font-bold">
                        {theatre.screenCount !== undefined ? theatre.screenCount : theatre.screens.length}
                      </span>
                    </div>
                  )}

                  <div className="text-xs">
                    <span className="text-gray-500">Submitted: </span>
                    <span>{new Date(theatre.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 sm:pt-4 mt-auto">
                  <button
                    onClick={() => handleApproveTheatre(theatre._id, "approve")}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition text-xs sm:text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproveTheatre(theatre._id, "decline")}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-xs sm:text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pendingTheatres.length === 0 && (
            <div className="col-span-full text-center py-12 px-4">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No pending theatre approvals</p>
            </div>
          )}
        </div>
      )}

      {/* Approved Theatres Grid */}
      {activeTab === "approved" && (
        <div className="space-y-6 sm:space-y-8 min-w-0">
          {/* Active Theatres Subsection */}
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              Active Theatres ({theatres.filter(t => t.approval_status === "approved" && !t.disabled).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
              {theatres.filter(t => t.approval_status === "approved" && !t.disabled).map((theatre) => (
                <div
                  key={theatre._id}
                  className="bg-gray-900/30 border border-gray-700 rounded-xl p-4 sm:p-5 hover:border-primary/50 transition min-w-0 overflow-hidden flex flex-col"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg sm:text-xl font-bold truncate">{theatre.name}</h3>
                    </div>

                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 text-gray-300 text-sm min-w-0">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{theatre.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm min-w-0">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{theatre.address || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm min-w-0">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{theatre.contact_no || "No phone"}</span>
                      </div>
                      <div className="text-gray-300 text-sm truncate">
                        {theatre.city}, {theatre.state}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 sm:pt-4 mt-auto">
                      <button
                        onClick={() => handleViewScreens(theatre)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition text-xs sm:text-sm font-medium"
                      >
                        <Monitor className="w-4 h-4 shrink-0" />
                        Screens
                      </button>
                      <button
                        onClick={() => handleEdit(theatre)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-xs sm:text-sm font-medium"
                      >
                        <Edit2 className="w-4 h-4 shrink-0" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDisable(theatre._id)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg transition text-xs sm:text-sm font-medium"
                      >
                        <Ban className="w-4 h-4 shrink-0" />
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {theatres.filter(t => t.approval_status === "approved" && !t.disabled).length === 0 && (
                <div className="col-span-full text-center py-12 px-4">
                  <p className="text-gray-400 text-lg">No active theatres found</p>
                </div>
              )}
            </div>
          </div>

          {/* Disabled Theatres Subsection */}
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              Disabled Theatres ({disabledTheatres.filter(t => t.approval_status === "approved").length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
              {disabledTheatres.filter(t => t.approval_status === "approved").map((theatre) => (
                <div
                  key={theatre._id}
                  className="bg-gray-900/30 border border-red-500/30 rounded-xl p-4 sm:p-5 hover:border-red-500/50 transition opacity-90 min-w-0 overflow-hidden flex flex-col"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg sm:text-xl font-bold truncate">{theatre.name}</h3>
                      <span className="shrink-0 px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                        Disabled
                      </span>
                    </div>

                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 text-gray-300 text-sm min-w-0">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{theatre.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm min-w-0">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{theatre.address || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm min-w-0">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{theatre.contact_no || "No phone"}</span>
                      </div>
                      <div className="text-gray-300 text-sm truncate">
                        {theatre.city}, {theatre.state}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 sm:pt-4 mt-auto">
                      <button
                        onClick={() => handleEdit(theatre)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-xs sm:text-sm font-medium"
                      >
                        <Edit2 className="w-4 h-4 shrink-0" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleEnable(theatre._id)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition text-xs sm:text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {disabledTheatres.filter(t => t.approval_status === "approved").length === 0 && (
                <div className="col-span-full text-center py-12 px-4">
                  <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No disabled theatres found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screens Modal */}
      {viewingScreens && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4 shadow-xl">
            <div className="flex justify-between items-start gap-3 mb-4 sm:mb-6 sticky top-0 bg-gray-900 pb-2 z-10">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold truncate">Screens — {viewingScreens.name}</h2>
                <p className="text-gray-400 mt-1 text-sm truncate">{viewingScreens.location}, {viewingScreens.city}</p>
              </div>
              <button
                onClick={() => setViewingScreens(null)}
                className="shrink-0 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {screensLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : screens.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">
                {screens.map((screen) => (
                  <div key={screen._id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-5 min-w-0 overflow-hidden">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">{screen.name || `Screen ${screen.screenNumber}`}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          screen.isActive 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {screen.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Screen Layout Preview */}
                      {screen.seatLayout?.layout && (
                        <div className="bg-gray-900/50 rounded-lg p-4">
                          <h4 className="font-semibold text-primary mb-3">Seat Layout Preview</h4>
                          <div className="flex justify-center">
                            <div className="inline-block">
                              {screen.seatLayout.layout.slice(0, 6).map((row, rIdx) => (
                                <div key={rIdx} className="flex justify-center gap-1 mb-1">
                                  {row.slice(0, 8).map((seat, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className={`w-2 h-2 rounded-sm ${
                                        seat === '' 
                                          ? 'invisible' 
                                          : 'bg-gray-600'
                                      }`}
                                      title={seat}
                                    />
                                  ))}
                                </div>
                              ))}
                              {screen.seatLayout.layout.length > 6 && (
                                <div className="text-center text-gray-500 text-xs mt-1">...and more rows</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Screen Details */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Screen Number:</span>
                            <span className="ml-2 text-gray-300">{screen.screenNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <span className={`ml-2 ${screen.isActive ? 'text-green-400' : 'text-red-400'}`}>
                              {screen.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {screen.seatLayout && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Total Seats:</span>
                              <span className="ml-2 text-gray-300">{screen.seatLayout.totalSeats}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Layout:</span>
                              <span className="ml-2 text-gray-300">
                                {screen.seatLayout.rows} rows × {screen.seatLayout.seatsPerRow} seats
                              </span>
                            </div>
                          </div>
                        )}

                        {screen.seatTiers && screen.seatTiers.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-primary mb-2">Seat Tiers</h5>
                            <div className="space-y-1">
                              {screen.seatTiers.map((tier, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-400">{tier.tierName}:</span>
                                  <span className="text-gray-300">₹{tier.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No screens found for this theatre</p>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminTheatres;
