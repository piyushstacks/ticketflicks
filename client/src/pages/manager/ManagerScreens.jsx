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
            className={`bg-[var(--bg-primary)]/30 border rounded-lg p-6 transition ${
              screen.isActive ? 'border-[var(--border)] hover:border-primary/50' : 'border-red-500/30 hover:border-red-500/50 opacity-75'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{screen.name}</h3>
                  <div className="text-sm text-[var(--text-muted)] mt-1">
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

              {(() => {
                const layoutArray = Array.isArray(screen.seatLayout) ? screen.seatLayout : (screen.seatLayout?.layout || []);
                const rowsCount = layoutArray.length;
                const colsCount = rowsCount > 0 ? layoutArray[0].length : 0;
                const totalSeatsCount = layoutArray.flat().filter(s => s && s.seatNumber).length;
                
                let uniqueTiers = [];
                if (screen.seatTiers && screen.seatTiers.length > 0) {
                   uniqueTiers = screen.seatTiers.map(t => t.tierName || t.name);
                } else if (rowsCount > 0) {
                   uniqueTiers = Array.from(new Set(layoutArray.flat().filter(s => s && s.tier).map(s => s.tier)));
                }

                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Total Seats:</span>
                      <span className="text-[var(--text-primary)]">{totalSeatsCount}</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Layout:</span>
                      <span className="text-[var(--text-primary)]">
                        {rowsCount} rows × {colsCount} cols
                      </span>
                    </div>
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Pricing Tiers:</span>
                      <span className="text-[var(--text-primary)]">
                        {uniqueTiers.length === 0 ? 'Not Set' : uniqueTiers.join(', ')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-4 border-t border-[var(--border)]/50">
                <button
                  onClick={() => setViewingScreen(screen)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-hover)] rounded-lg transition text-sm font-medium"
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
          <div className="col-span-full text-center py-12 bg-[var(--bg-primary)]/20 rounded-lg border border-gray-800 border-dashed">
            <Tv className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)] text-lg">No screens added yet</p>
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
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingId ? "Edit Screen Configuration" : "Add New Screen"}
                  </h2>
                  <p className="text-[var(--text-muted)] text-sm mt-1">
                    Configure seat layout, pricing tiers, and screen details
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAdvancedForm(false);
                    setEditingId(null);
                    setConfigurationScreens([]);
                  }}
                  className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{viewingScreen.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-[var(--text-muted)]">Screen #{viewingScreen.screenNumber}</span>
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
                  className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>
              
              {(() => {
                const layoutArray = Array.isArray(viewingScreen.seatLayout) ? viewingScreen.seatLayout : (viewingScreen.seatLayout?.layout || []);
                const rowsCount = layoutArray.length;
                const colsCount = rowsCount > 0 ? layoutArray[0].length : 0;
                const totalSeatsCount = layoutArray.flat().filter(s => s && s.seatNumber).length;
                
                let tiersData = [];
                if (viewingScreen.seatTiers && viewingScreen.seatTiers.length > 0) {
                   tiersData = viewingScreen.seatTiers;
                } else if (rowsCount > 0) {
                   const uniqueTiers = Array.from(new Set(layoutArray.flat().filter(s => s && s.tier).map(s => s.tier)));
                   tiersData = uniqueTiers.map(name => ({ tierName: name, price: "Default Setting" }));
                }

                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Layout Stats</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Total Seats:</span>
                          <span className="text-[var(--text-primary)] font-medium">{totalSeatsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Dimensions:</span>
                          <span className="text-[var(--text-primary)] font-medium">
                            {rowsCount} × {colsCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Pricing</h3>
                      <div className="space-y-2 text-sm">
                        {tiersData.map((tier, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-[var(--text-muted)]">{tier.tierName || tier.name}:</span>
                            <span className="text-[var(--text-primary)] font-medium">{tier.price === "Default Setting" ? tier.price : `₹${tier.price}`}</span>
                          </div>
                        ))}
                        {tiersData.length === 0 && (
                          <div className="text-[var(--text-muted)] italic">No pricing configured</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Visual Seat Map Preview */}
              <div className="bg-[var(--bg-secondary)]/30 rounded-lg p-6 border border-[var(--border)]/50">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 text-center">Seat Layout Preview</h3>
                <div className="flex justify-center overflow-x-auto pb-4">
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-[var(--bg-elevated)] mb-8 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] mx-auto max-w-[80%]"></div>
                    {(Array.isArray(viewingScreen.seatLayout) ? viewingScreen.seatLayout : (viewingScreen.seatLayout?.layout || [])).map((row, rIdx) => (
                      <div key={rIdx} className="flex justify-center gap-1">
                        {row.map((seat, cIdx) => (
                          <div
                            key={cIdx}
                            className={`w-3 h-3 rounded-[2px] ${
                              !seat || seat === '' 
                                ? 'invisible' 
                                : 'bg-[var(--border-hover)]'
                            }`}
                            title={seat.seatNumber || seat}
                          />
                        ))}
                      </div>
                    )) || (
                      <div className="text-[var(--text-muted)] text-center py-8">
                        No layout preview available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
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
                  className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-hover)] text-[var(--text-primary)] rounded-lg transition text-sm font-medium"
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
