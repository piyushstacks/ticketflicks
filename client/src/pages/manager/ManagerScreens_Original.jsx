import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Tv, Users } from "lucide-react";
import Loading from "../../components/Loading";

const ManagerScreens = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    screenNumber: "",
    totalSeats: "",
  });

  const fetchScreens = async () => {
    try {
      setLoading(true);
      // This endpoint needs to be created
      const { data } = await axios.get("/api/manager/screens", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setScreens(data.screens || []);
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
      // Silently fail - API endpoint not created yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreens();
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

    if (!formData.screenNumber || !formData.totalSeats) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      let response;
      if (editingId) {
        response = await axios.put(
          `/api/manager/screens/${editingId}`,
          {
            screenNumber: formData.screenNumber,
            seatLayout: { totalSeats: parseInt(formData.totalSeats) },
          },
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post(
          "/api/manager/screens/add",
          {
            screenNumber: formData.screenNumber,
            seatLayout: { totalSeats: parseInt(formData.totalSeats) },
          },
          { headers: getAuthHeaders() }
        );
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setFormData({ screenNumber: "", totalSeats: "" });
        setEditingId(null);
        setShowForm(false);
        fetchScreens();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save screen");
    }
  };

  const handleDelete = async (screenId) => {
    if (!window.confirm("Are you sure you want to delete this screen?")) return;

    try {
      const { data } = await axios.delete(`/api/manager/screens/${screenId}`, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        toast.success("Screen deleted successfully");
        fetchScreens();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete screen");
    }
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
        <h1 className="text-3xl font-bold">Manage Screens</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Screen
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Screen" : "Add New Screen"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="screenNumber"
                placeholder="Screen Number (e.g., 1, 2, 3) *"
                value={formData.screenNumber}
                onChange={handleInputChange}
                required
                min="1"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />

              <input
                type="number"
                name="totalSeats"
                placeholder="Total Seats *"
                value={formData.totalSeats}
                onChange={handleInputChange}
                required
                min="50"
                max="500"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ screenNumber: "", totalSeats: "" });
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
              >
                {editingId ? "Update Screen" : "Add Screen"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screens.length > 0 ? (
          screens.map((screen) => (
            <div
              key={screen._id}
              className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 hover:border-primary/50 transition"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Tv className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        Screen {screen.screenNumber}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>
                      {screen.seatLayout?.totalSeats || 0} Total Seats
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setFormData({
                        screenNumber: screen.screenNumber,
                        totalSeats: screen.seatLayout?.totalSeats || "",
                      });
                      setEditingId(screen._id);
                      setShowForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(screen._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">No screens found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerScreens;
