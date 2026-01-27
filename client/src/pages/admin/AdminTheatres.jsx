import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Edit2, Ban, Plus, MapPin, Users, Phone } from "lucide-react";

const AdminTheatres = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/theatres", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setTheatres(data.theatres);
      } else {
        toast.error(data.message || "Failed to load theatres");
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
      let response;
      if (editingId) {
        response = await axios.put(
          `/api/admin/theatres/${editingId}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post("/api/admin/theatres", formData, {
          headers: getAuthHeaders(),
        });
      }

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Theatres Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Theatre
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Theatre" : "Add New Theatre"}
          </h2>

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
                name="contact_no"
                placeholder="Phone"
                value={formData.contact_no}
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
                {editingId ? "Update Theatre" : "Add Theatre"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Theatres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {theatres.map((theatre) => (
          <div
            key={theatre._id}
            className={`bg-gray-900/30 border rounded-lg p-6 hover:border-primary/50 transition ${
              theatre.disabled ? "border-red-500/30 opacity-60" : "border-gray-700"
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{theatre.name}</h3>
                {theatre.disabled && (
                  <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                    Disabled
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{theatre.location || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>
                    {theatre.city}, {theatre.state}
                  </span>
                </div>

                {theatre.contact_no && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{theatre.contact_no}</span>
                  </div>
                )}

                {theatre.email && (
                  <div className="text-xs">
                    <span className="text-gray-500">Email: </span>
                    <span>{theatre.email}</span>
                  </div>
                )}

                {theatre.screens && (
                  <div className="text-xs">
                    <span className="text-gray-500">Screens: </span>
                    <span>{theatre.screens.length}</span>
                  </div>
                )}
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
      </div>

      {theatres.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No theatres found</p>
        </div>
      )}
    </div>
  );
};

export default AdminTheatres;
