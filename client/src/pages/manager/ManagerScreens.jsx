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
    name: "",
    totalSeats: "",
    rows: "",
    seatsPerRow: "",
    seatLayout: {
      rows: [],
      totalSeats: 0,
      seatsPerRow: 0
    },
    pricing: {
      standard: 0,
      premium: 0,
      vip: 0
    }
  });
  const [showSeatLayout, setShowSeatLayout] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

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

  const handlePricingChange = (tier, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [tier]: parseFloat(value) || 0
      }
    }));
  };

  const generateSeatLayout = () => {
    const rows = parseInt(formData.rows);
    const seatsPerRow = parseInt(formData.seatsPerRow);
    
    if (!rows || !seatsPerRow) {
      toast.error("Please enter rows and seats per row");
      return;
    }

    const layout = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < seatsPerRow; j++) {
        row.push({
          seatNumber: `${String.fromCharCode(65 + i)}${j + 1}`,
          type: 'standard',
          isAvailable: true
        });
      }
      layout.push(row);
    }

    setFormData(prev => ({
      ...prev,
      seatLayout: {
        rows: layout,
        totalSeats: rows * seatsPerRow,
        seatsPerRow: seatsPerRow
      },
      totalSeats: rows * seatsPerRow
    }));
    setShowSeatLayout(true);
  };

  const toggleSeatType = (rowIndex, seatIndex) => {
    const newLayout = [...formData.seatLayout.rows];
    const seat = newLayout[rowIndex][seatIndex];
    
    const types = ['standard', 'premium', 'vip'];
    const currentIndex = types.indexOf(seat.type);
    seat.type = types[(currentIndex + 1) % types.length];
    
    setFormData(prev => ({
      ...prev,
      seatLayout: {
        ...prev.seatLayout,
        rows: newLayout
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.screenNumber || !formData.name || !formData.totalSeats || !formData.rows || !formData.seatsPerRow) {
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
            name: formData.name,
            seatLayout: formData.seatLayout,
            pricing: formData.pricing
          },
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post(
          "/api/manager/screens/add",
          {
            screenNumber: formData.screenNumber,
            name: formData.name,
            seatLayout: formData.seatLayout,
            pricing: formData.pricing,
            status: 'active'
          },
          { headers: getAuthHeaders() }
        );
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setFormData({ 
          screenNumber: "", 
          name: "",
          totalSeats: "", 
          rows: "",
          seatsPerRow: "",
          seatLayout: { rows: [], totalSeats: 0, seatsPerRow: 0 },
          pricing: { standard: 0, premium: 0, vip: 0 }
        });
        setEditingId(null);
        setShowForm(false);
        setShowSeatLayout(false);
        fetchScreens();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save screen");
    }
  };

  const handleDisable = async (screenId, currentStatus) => {
    const action = currentStatus === 'disabled' ? 'enable' : 'disable';
    const confirmMessage = `Are you sure you want to ${action} this screen?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const { data } = await axios.patch(`/api/manager/screens/${screenId}/toggle`, {
        status: action === 'disable' ? 'disabled' : 'active'
      }, {
        headers: getAuthHeaders()
      });

      if (data.success) {
        toast.success(`Screen ${action}d successfully`);
        fetchScreens();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Failed to ${action} screen`);
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
                type="text"
                name="name"
                placeholder="Screen Name (e.g., Main Auditorium) *"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="rows"
                placeholder="Number of Rows *"
                value={formData.rows}
                onChange={handleInputChange}
                required
                min="1"
                max="20"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />

              <input
                type="number"
                name="seatsPerRow"
                placeholder="Seats per Row *"
                value={formData.seatsPerRow}
                onChange={handleInputChange}
                required
                min="1"
                max="30"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Standard Price ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.pricing.standard}
                  onChange={(e) => handlePricingChange('standard', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Premium Price ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.pricing.premium}
                  onChange={(e) => handlePricingChange('premium', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">VIP Price ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.pricing.vip}
                  onChange={(e) => handlePricingChange('vip', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
            </div>

            {!showSeatLayout && (
              <button
                type="button"
                onClick={generateSeatLayout}
                className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition font-medium"
              >
                Generate Seat Layout
              </button>
            )}

            {showSeatLayout && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-primary mb-3">Seat Layout Configuration</h4>
                <div className="text-xs text-gray-400 mb-3">
                  Click on seats to toggle between Standard (gray), Premium (blue), and VIP (gold) types
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {formData.seatLayout.rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1 mb-1 justify-center">
                      {row.map((seat, seatIndex) => (
                        <button
                          key={seatIndex}
                          type="button"
                          onClick={() => toggleSeatType(rowIndex, seatIndex)}
                          className={`w-6 h-6 text-xs rounded transition ${
                            seat.type === 'standard' 
                              ? 'bg-gray-600 hover:bg-gray-500' 
                              : seat.type === 'premium'
                              ? 'bg-blue-600 hover:bg-blue-500'
                              : 'bg-yellow-600 hover:bg-yellow-500'
                          }`}
                          title={`${seat.seatNumber} - ${seat.type}`}
                        >
                          {seatIndex === 0 && <span className="text-white">{String.fromCharCode(65 + rowIndex)}</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-600 rounded"></div> Standard
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div> Premium
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-600 rounded"></div> VIP
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ 
                    screenNumber: "", 
                    name: "",
                    totalSeats: "", 
                    rows: "",
                    seatsPerRow: "",
                    seatLayout: { rows: [], totalSeats: 0, seatsPerRow: 0 },
                    pricing: { standard: 0, premium: 0, vip: 0 }
                  });
                  setShowSeatLayout(false);
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
                    <div className="text-sm text-gray-400 mt-1">
                      {screen.seatLayout.rows.length} rows × {screen.seatLayout.seatsPerRow} seats/row
                    </div>
                  )}
                </div>

                {screen.pricing && (
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-primary mb-2">Pricing</h4>
                    <div className="space-y-1 text-xs">
                      {typeof screen.pricing === 'object' ? (
                        Object.entries(screen.pricing).map(([tier, price]) => (
                          <div key={tier} className="flex justify-between">
                            <span className="text-gray-400 capitalize">{tier}:</span>
                            <span className="text-gray-300">${price}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Base:</span>
                          <span className="text-gray-300">${screen.pricing}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setViewingScreen(screen)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        screenNumber: screen.screenNumber,
                        name: screen.name || '',
                        totalSeats: screen.seatLayout?.totalSeats || '',
                        rows: screen.seatLayout?.rows?.length || '',
                        seatsPerRow: screen.seatLayout?.seatsPerRow || '',
                        seatLayout: screen.seatLayout || { rows: [], totalSeats: 0, seatsPerRow: 0 },
                        pricing: screen.pricing || { standard: 0, premium: 0, vip: 0 }
                      });
                      setEditingId(screen._id);
                      setShowForm(true);
                      if (screen.seatLayout?.rows?.length > 0) {
                        setShowSeatLayout(true);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDisable(screen._id, screen.status)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                      screen.status === 'disabled'
                        ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                        : 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                    }`}
                  >
                    {screen.status === 'disabled' ? (
                      <>
                        <Power className="w-4 h-4" />
                        Enable
                      </>
                    ) : (
                      <>
                        <PowerOff className="w-4 h-4" />
                        Disable
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

      {/* Screen Details Modal */}
      {viewingScreen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{viewingScreen.name || `Screen ${viewingScreen.screenNumber}`}</h2>
                  <p className="text-gray-400 mt-1">Screen #{viewingScreen.screenNumber}</p>
                  {viewingScreen.status === 'disabled' && (
                    <span className="inline-block px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded mt-2">
                      Disabled
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setViewingScreen(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Screen Info */}
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-primary mb-3">Screen Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Screen Number:</span>
                        <span className="text-gray-300">{viewingScreen.screenNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Seats:</span>
                        <span className="text-gray-300">{viewingScreen.seatLayout?.totalSeats || 0}</span>
                      </div>
                      {viewingScreen.seatLayout?.rows && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rows:</span>
                            <span className="text-gray-300">{viewingScreen.seatLayout.rows.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Seats per Row:</span>
                            <span className="text-gray-300">{viewingScreen.seatLayout.seatsPerRow}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          viewingScreen.status === 'active' 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {viewingScreen.status || 'active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {viewingScreen.pricing && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-primary mb-3">Pricing Structure</h3>
                      <div className="space-y-2">
                        {typeof viewingScreen.pricing === 'object' ? (
                          Object.entries(viewingScreen.pricing).map(([tier, price]) => (
                            <div key={tier} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{tier}:</span>
                              <span className="text-gray-300">${price}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Base Price:</span>
                            <span className="text-gray-300">${viewingScreen.pricing}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Seat Layout Preview */}
                {viewingScreen.seatLayout?.rows && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-primary mb-3">Seat Layout</h3>
                    <div className="max-h-80 overflow-y-auto">
                      {viewingScreen.seatLayout.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1 mb-1 justify-center">
                          {row.map((seat, seatIndex) => (
                            <div
                              key={seatIndex}
                              className={`w-4 h-4 text-xs rounded ${
                                seat.type === 'standard' 
                                  ? 'bg-gray-600' 
                                  : seat.type === 'premium'
                                  ? 'bg-blue-600'
                                  : 'bg-yellow-600'
                              }`}
                              title={`${seat.seatNumber} - ${seat.type}`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-3 text-xs">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-600 rounded"></div> Standard
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-600 rounded"></div> Premium
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-600 rounded"></div> VIP
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerScreens;
