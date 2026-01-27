import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Edit2, Ban, Plus, MapPin, Users, Phone, CheckCircle, XCircle, Clock } from "lucide-react";

const AdminTheatres = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [theatres, setTheatres] = useState([]);
  const [pendingTheatres, setPendingTheatres] = useState([]);
  const [disabledTheatres, setDisabledTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "approved"
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
  });

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
          phone: "",
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
      phone: theatre.phone || "",
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
      phone: "",
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Theatres Management</h1>
      </div>

      {/* Approval Status Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "pending"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Approvals ({pendingTheatres.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "approved"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved Theatres ({theatres.filter(theatre => !theatre.disabled).length})
          </div>
        </button>
      </div>



      {/* Edit Form - Only for existing theatres */}
      {showForm && editingId && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Edit Theatre</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Theatre Name *"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="state"
                placeholder="State *"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="zipCode"
                placeholder="Zip Code"
                value={formData.zipCode}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
              >
                Update Theatre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Theatres Grid */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingTheatres.map((theatre) => (
            <div
              key={theatre._id}
              className="bg-gray-900/30 border border-yellow-500/30 rounded-lg p-6 hover:border-yellow-500/50 transition"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold">{theatre.name}</h3>
                  <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Pending
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{theatre.location || "N/A"}</span>
                  </div>

                  {theatre.manager_id && (
                    <>
                      <div className="text-xs">
                        <span className="text-gray-500">Manager: </span>
                        <span>{theatre.manager_id.name}</span>
                      </div>
                      <div className="text-xs">
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

                  {theatre.screens && (
                    <div className="text-xs">
                      <span className="text-gray-500">Screens: </span>
                      <span>{theatre.screens.length}</span>
                    </div>
                  )}

                  <div className="text-xs">
                    <span className="text-gray-500">Submitted: </span>
                    <span>{new Date(theatre.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleApproveTheatre(theatre._id, "approve")}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproveTheatre(theatre._id, "decline")}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pendingTheatres.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No pending theatre approvals</p>
            </div>
          )}
        </div>
      )}

      {/* Approved Theatres Grid */}
      {activeTab === "approved" && (
        <div className="space-y-8">
          {/* Active Theatres Subsection */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Active Theatres ({theatres.filter(theatre => !theatre.disabled).length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {theatres.filter(theatre => !theatre.disabled).map((theatre) => (
                <div
                  key={theatre._id}
                  className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 hover:border-primary/50 transition"
                >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">{theatre.name}</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{theatre.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{theatre.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{theatre.contact_no || "No phone"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-sm">{theatre.city}, {theatre.state}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleEdit(theatre)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDisable(theatre._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg transition text-sm font-medium"
                    >
                      <Ban className="w-4 h-4" />
                      Disable
                    </button>
                  </div>
                </div>
              </div>
              ))}

            {theatres.filter(theatre => !theatre.disabled).length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">No active theatres found</p>
              </div>
            )}
          </div>
          </div>

          {/* Disabled Theatres Subsection */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Disabled Theatres ({disabledTheatres.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {disabledTheatres.map((theatre) => (
                <div
                  key={theatre._id}
                  className="bg-gray-900/30 border border-red-500/30 rounded-lg p-6 hover:border-red-500/50 transition opacity-60"
                >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">{theatre.name}</h3>
                    <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                      Disabled
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{theatre.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{theatre.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{theatre.contact_no || "No phone"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-sm">{theatre.city}, {theatre.state}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleEdit(theatre)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleEnable(theatre._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Enable
                    </button>
                  </div>
                </div>
              </div>
              ))}

            {disabledTheatres.length === 0 && (
              <div className="col-span-full text-center py-12">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No disabled theatres found</p>
              </div>
            )}
          </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminTheatres;
