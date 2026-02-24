import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Plus, Edit2, Power, Tv, Eye } from "lucide-react";
import Loading from "../../components/Loading";
import ScreenConfiguration from "../../components/ScreenConfiguration";

const ManagerScreens = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [configurationScreens, setConfigurationScreens] = useState([]);
  const [viewingScreen, setViewingScreen] = useState(null);

  const fetchScreens = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/theatre/screens", {
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

  const handleSaveScreen = async () => {
    try {
      const screenData = configurationScreens[0];
      
      if (!screenData) {
        toast.error("No screen data to save");
        return;
      }

      // Derive screen number: try to extract from name, otherwise use existing number (if editing) or next available
      let derivedNumber = screenData.name.replace(/\D/g, '');
      if (!derivedNumber) {
        if (editingId) {
           const originalScreen = screens.find(s => s._id === editingId);
           derivedNumber = originalScreen ? originalScreen.screenNumber : (screens.length + 1).toString();
        } else {
           derivedNumber = (screens.length + 1).toString();
        }
      }

      // Calculate layout metadata
      let layoutData = screenData.layout;
      if (layoutData && layoutData.layout) {
        const rows = layoutData.layout.length;
        const seatsPerRow = rows > 0 ? layoutData.layout[0].length : 0;
        const totalSeats = layoutData.layout.flat().filter(seat => seat && seat !== '').length;
        
        layoutData = {
          ...layoutData,
          rows,
          seatsPerRow,
          totalSeats
        };
      }

      const payload = {
        name: screenData.name,
        screenNumber: derivedNumber,
        seatLayout: layoutData,
        pricing: screenData.pricing
      };

      let response;
      if (editingId) {
        response = await axios.put(
          `/api/theatre/screens/${editingId}`,
          payload,
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post(
          "/api/theatre/screens",
          { ...payload, status: 'active' },
          { headers: getAuthHeaders() }
        );
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setShowAdvancedForm(false);
        setEditingId(null);
        setConfigurationScreens([]);
        fetchScreens();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error saving screen:", error);
      toast.error(error.response?.data?.message || "Failed to save screen");
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setConfigurationScreens([{
      name: `Screen ${screens.length + 1}`,
      layout: null,
      pricing: { unified: 150 }
    }]);
    setShowAdvancedForm(true);
  };

  const handleEditScreen = (screen) => {
    setEditingId(screen._id);
    
    let pricingForConfig = {};
    if (screen.seatTiers && screen.seatTiers.length > 0) {
      if (screen.seatTiers.length === 1) {
         pricingForConfig = { unified: screen.seatTiers[0].price };
      } else {
         const nameToCode = { 'Standard': 'S', 'Deluxe': 'D', 'Premium': 'P', 'Recliner': 'R', 'Couple': 'C' };
         screen.seatTiers.forEach(tier => {
           const code = nameToCode[tier.tierName];
           if (code) {
             pricingForConfig[code] = { price: tier.price };
           }
         });
      }
    } else {
      pricingForConfig = { unified: 0 };
    }

    setConfigurationScreens([{
      name: screen.name,
      layout: screen.seatLayout,
      pricing: pricingForConfig
    }]);
    setShowAdvancedForm(true);
  };

  const handleToggleStatus = async (screen) => {
    const action = screen.isActive ? 'disable' : 'enable';
    
    if (!window.confirm(`Are you sure you want to ${action} this screen?`)) return;

    try {
      const { data } = await axios.patch(
        `/api/theatre/screens/${screen._id}/status`,
        { status: action === 'disable' ? 'inactive' : 'active' },
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        toast.success(`Screen ${action}d successfully`);
        fetchScreens();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error toggling screen:", error);
      toast.error(`Failed to ${action} screen`);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Screens</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Screen
        </button>
      </div>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screens.map((screen) => (
          <div
            key={screen._id}
            className={`bg-gray-900/30 border rounded-lg p-6 transition ${
              screen.isActive ? 'border-gray-700 hover:border-primary/50' : 'border-red-500/30 hover:border-red-500/50 opacity-75'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{screen.name}</h3>
                  <div className="text-sm text-gray-400 mt-1">
                    Screen #{screen.screenNumber}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  screen.isActive 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-red-600/20 text-red-400'
                }`}>
                  {screen.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Total Seats:</span>
                  <span className="text-gray-200">{screen.seatLayout?.totalSeats || 0}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Layout:</span>
                  <span className="text-gray-200">
                    {screen.seatLayout?.rows || 0} rows × {screen.seatLayout?.seatsPerRow || 0} cols
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Pricing Type:</span>
                  <span className="text-gray-200">
                    {screen.seatTiers?.length === 1 
                      ? 'Unified' 
                      : screen.seatTiers?.length > 1 
                        ? screen.seatTiers.map(t => t.tierName).join(', ')
                        : 'Not Set'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-700/50">
                <button
                  onClick={() => setViewingScreen(screen)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm font-medium"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleEditScreen(screen)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                  title="Edit Configuration"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleToggleStatus(screen)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                    screen.isActive 
                      ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400' 
                      : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                  }`}
                  title={screen.isActive ? 'Disable Screen' : 'Enable Screen'}
                >
                  <Power className="w-4 h-4" />
                  <span>{screen.isActive ? 'Disable' : 'Enable'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {screens.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-900/20 rounded-lg border border-gray-800 border-dashed">
            <Tv className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No screens added yet</p>
            <button
              onClick={handleAddNew}
              className="mt-4 text-primary hover:text-primary-dull transition font-medium"
            >
              Add your first screen
            </button>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showAdvancedForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingId ? "Edit Screen Configuration" : "Add New Screen"}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Configure seat layout, pricing tiers, and screen details
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAdvancedForm(false);
                    setEditingId(null);
                    setConfigurationScreens([]);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <ScreenConfiguration
                screens={configurationScreens}
                setScreens={setConfigurationScreens}
                onNext={handleSaveScreen}
                onPrevious={() => setShowAdvancedForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Screen Details Modal */}
      {viewingScreen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{viewingScreen.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-400">Screen #{viewingScreen.screenNumber}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      viewingScreen.isActive 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-red-600/20 text-red-400'
                    }`}>
                      {viewingScreen.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingScreen(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Layout Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Seats:</span>
                      <span className="text-white font-medium">{viewingScreen.seatLayout?.totalSeats || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="text-white font-medium">
                        {viewingScreen.seatLayout?.rows?.length || 0} × {viewingScreen.seatLayout?.seatsPerRow || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Pricing</h3>
                  <div className="space-y-2 text-sm">
                    {viewingScreen.seatTiers?.map((tier, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-400">{tier.tierName}:</span>
                        <span className="text-white font-medium">${tier.price}</span>
                      </div>
                    ))}
                    {(!viewingScreen.seatTiers || viewingScreen.seatTiers.length === 0) && (
                      <div className="text-gray-500 italic">No pricing configured</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Seat Map Preview */}
              <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 text-center">Seat Layout Preview</h3>
                <div className="flex justify-center overflow-x-auto pb-4">
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-gray-700 mb-8 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] mx-auto max-w-[80%]"></div>
                    {viewingScreen.seatLayout?.layout?.map((row, rIdx) => (
                      <div key={rIdx} className="flex justify-center gap-1">
                        {row.map((seat, cIdx) => (
                          <div
                            key={cIdx}
                            className={`w-3 h-3 rounded-[2px] ${
                              seat === '' 
                                ? 'invisible' 
                                : 'bg-gray-600'
                            }`}
                            title={seat}
                          />
                        ))}
                      </div>
                    )) || (
                      <div className="text-gray-500 text-center py-8">
                        No layout preview available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setViewingScreen(null);
                    handleEditScreen(viewingScreen);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                >
                  Edit Configuration
                </button>
                <button
                  onClick={() => setViewingScreen(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerScreens;
