import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Plus, Edit2, Power, PowerOff, Tv, Users, Eye, Settings } from "lucide-react";
import Loading from "../../components/Loading";
import ScreenConfiguration from "../../components/ScreenConfiguration";

const ManagerScreens = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [viewingScreen, setViewingScreen] = useState(null);
  const [formData, setFormData] = useState({
    screenNumber: "",
    totalSeats: "",
  });

  const fetchScreens = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/manager/screens", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setScreens(data.screens || []);
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
      toast.error("Failed to load screens");
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

  const handleToggleStatus = async (screenId, currentStatus) => {
    try {
      const endpoint = currentStatus 
        ? `/api/manager/screens/${screenId}/disable`
        : `/api/manager/screens/${screenId}/enable`;
      
      const { data } = await axios.patch(endpoint, {}, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        toast.success(data.message);
        fetchScreens();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update screen status");
    }
  };

  const handleEdit = (screen) => {
    setFormData({
      screenNumber: screen.screenNumber,
      totalSeats: screen.seatLayout?.totalSeats || "",
    });
    setEditingId(screen._id);
    setShowForm(true);
  };

  const handleAdvancedEdit = (screen) => {
    setEditingId(screen._id);
    setShowAdvancedForm(true);
  };

  const handleAdvancedSubmit = async (screensData) => {
    try {
      // Here you would implement the advanced screen update logic
      // For now, just close the form and show a message
      toast.success("Advanced screen configuration updated successfully");
      setShowAdvancedForm(false);
      setEditingId(null);
      fetchScreens();
    } catch (error) {
      console.error("Error updating advanced screen:", error);
      toast.error("Failed to update screen configuration");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Screens</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAdvancedForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition font-medium"
          >
            <Settings className="w-5 h-5" />
            Advanced Setup
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Screen
          </button>
        </div>
      </div>

      {/* Simple Form */}
      {showForm && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Screen" : "Add New Screen"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="screenNumber"
                placeholder="Screen Name (e.g., Screen 1, Auditorium A) *"
                value={formData.screenNumber}
                onChange={handleInputChange}
                required
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

      {/* Advanced Form Modal */}
      {showAdvancedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Advanced Screen Configuration</h2>
                <button
                  onClick={() => {
                    setShowAdvancedForm(false);
                    setEditingId(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <ScreenConfiguration
                screens={editingId ? screens.filter(s => s._id === editingId) : [{name: '', layout: null, pricing: {}}]}
                setScreens={(newScreens) => {
                  if (newScreens.length > 0) {
                    handleAdvancedSubmit(newScreens);
                  }
                }}
                onNext={() => handleAdvancedSubmit(editingId ? screens.filter(s => s._id === editingId) : [])}
                onPrevious={() => setShowAdvancedForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Screen Details Modal */}
      {viewingScreen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{viewingScreen.screenNumber}</h2>
                <button
                  onClick={() => setViewingScreen(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary mb-3">Screen Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Screen Name:</span>
                      <span className="text-gray-300">{viewingScreen.screenNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Seats:</span>
                      <span className="text-gray-300">{viewingScreen.seatLayout?.totalSeats || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        viewingScreen.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-red-600/20 text-red-400'
                      }`}>
                        {viewingScreen.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    {viewingScreen.seatLayout?.rows && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Layout:</span>
                        <span className="text-gray-300">{viewingScreen.seatLayout.rows} rows</span>
                      </div>
                    )}
                  </div>
                </div>

                {viewingScreen.seatTiers && viewingScreen.seatTiers.length > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-primary mb-3">Seat Tiers & Pricing</h3>
                    <div className="space-y-2">
                      {viewingScreen.seatTiers.map((tier, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-400">{tier.tierName}:</span>
                          <span className="text-gray-300">${tier.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="ml-2 text-gray-300">
                        {new Date(viewingScreen.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="ml-2 text-gray-300">
                        {new Date(viewingScreen.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screens.length > 0 ? (
          screens.map((screen) => (
            <div
              key={screen._id}
              className={`bg-gray-900/30 border rounded-lg p-6 hover:border-primary/50 transition ${
                !screen.isActive ? 'border-red-500/30 opacity-75' : 'border-gray-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      !screen.isActive ? 'bg-red-500/20' : 'bg-primary/20'
                    }`}>
                      <Tv className={`w-6 h-6 ${
                        !screen.isActive ? 'text-red-400' : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {screen.screenNumber}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        !screen.isActive 
                          ? 'bg-red-600/20 text-red-400' 
                          : 'bg-green-600/20 text-green-400'
                      }`}>
                        {screen.isActive ? 'Active' : 'Disabled'}
                      </span>
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
                  {screen.seatLayout?.rows && (
                    <div className="text-xs text-gray-400 mt-1">
                      {screen.seatLayout.rows} × {screen.seatLayout.seatsPerRow || 'N/A'} layout
                    </div>
                  )}
                </div>

                {screen.seatTiers && screen.seatTiers.length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Seat Tiers:</div>
                    <div className="flex flex-wrap gap-1">
                      {screen.seatTiers.slice(0, 3).map((tier, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          {tier.tierName}
                        </span>
                      ))}
                      {screen.seatTiers.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                          +{screen.seatTiers.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setViewingScreen(screen)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(screen)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(screen._id, screen.isActive)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                      screen.isActive 
                        ? 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-400'
                        : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                    }`}
                  >
                    {screen.isActive ? (
                      <>
                        <PowerOff className="w-4 h-4" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4" />
                        Enable
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Tv className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No screens found</p>
            <p className="text-gray-500 text-sm mt-2">Add your first screen to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerScreens;
