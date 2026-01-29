import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { SEAT_LAYOUTS, SEAT_TIERS, getLayoutByKey, calculateTotalSeats, getSeatCountByTier, validatePricing } from './SeatLayoutTemplates.js';

const ScreenConfiguration = ({ screens, setScreens, onNext, onPrevious }) => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState('');
  const [customLayout, setCustomLayout] = useState(null);
  const [pricingMode, setPricingMode] = useState('tier'); // 'tier' or 'unified'
  const [tierPricing, setTierPricing] = useState({});
  const [unifiedPrice, setUnifiedPrice] = useState('');
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentScreen = screens[currentScreenIndex] || {
    name: '',
    layout: null,
    pricing: {}
  };

  // Initialize tier pricing with default values
  const initializeTierPricing = (layout) => {
    if (!layout) return;
    
    const tiersInLayout = new Set();
    layout.layout?.flat().forEach(seat => {
      if (seat && seat !== '') tiersInLayout.add(seat);
    });

    const isSingleTier = tiersInLayout.size === 1;
    
    if (isSingleTier) {
      // For single-tier layouts, set unified pricing mode
      const singleTier = Array.from(tiersInLayout)[0];
      setPricingMode('unified');
      setTierPricing({ [singleTier]: { price: SEAT_TIERS[singleTier]?.basePrice || 150 } });
      setUnifiedPrice(String(SEAT_TIERS[singleTier]?.basePrice || 150));
    } else {
      // For multi-tier layouts, use tier-based pricing
      setPricingMode('tier');
      const pricing = {};
      tiersInLayout.forEach(tier => {
        pricing[tier] = {
          price: SEAT_TIERS[tier]?.basePrice || 150,
          enabled: true
        };
      });
      setTierPricing(pricing);
    }
  };

  // Sync states when switching between screens
  useEffect(() => {
    const screen = screens[currentScreenIndex] || {
      name: '',
      layout: null,
      pricing: {}
    };

    // Find the layout key for the current screen's layout
    if (screen.layout) {
      const layoutKey = Object.keys(SEAT_LAYOUTS).find(key => 
        SEAT_LAYOUTS[key].key === screen.layout.key
      );
      setSelectedLayout(layoutKey || '');
      setCustomLayout(null);
      
      // Initialize pricing for the current screen
      initializeTierPricing(screen.layout);
      
      // Set pricing mode based on current screen's pricing
      if (screen.pricing.unified) {
        setPricingMode('unified');
        setUnifiedPrice(String(screen.pricing.unified));
      } else {
        setPricingMode('tier');
        setTierPricing(screen.pricing || {});
      }
    } else {
      // Reset states when screen has no layout
      setSelectedLayout('');
      setCustomLayout(null);
      setPricingMode('tier');
      setTierPricing({});
      setUnifiedPrice('');
    }
    
    setErrors({});
  }, [currentScreenIndex, screens]);

  const handleLayoutSelect = (layoutKey) => {
    const layout = getLayoutByKey(layoutKey);
    if (layout) {
      setSelectedLayout(layoutKey);
      setCustomLayout(null);
      
      // Initialize pricing first
      const tiersInLayout = new Set();
      layout.layout?.flat().forEach(seat => {
        if (seat && seat !== '') tiersInLayout.add(seat);
      });

      const isSingleTier = tiersInLayout.size === 1;
      let newPricing = {};
      
      if (isSingleTier) {
        // For single-tier layouts, set unified pricing mode
        const singleTier = Array.from(tiersInLayout)[0];
        setPricingMode('unified');
        const price = SEAT_TIERS[singleTier]?.basePrice || 150;
        setUnifiedPrice(String(price));
        newPricing = { unified: price };
      } else {
        // For multi-tier layouts, use tier-based pricing
        setPricingMode('tier');
        const pricing = {};
        tiersInLayout.forEach(tier => {
          pricing[tier] = {
            price: SEAT_TIERS[tier]?.basePrice || 150,
            enabled: true
          };
        });
        setTierPricing(pricing);
        newPricing = pricing;
      }
      
      // Update current screen with the new pricing
      const updatedScreens = [...screens];
      updatedScreens[currentScreenIndex] = {
        ...currentScreen,
        name: currentScreen.name || `Screen ${currentScreenIndex + 1}`,
        layout: layout,
        pricing: newPricing
      };
      setScreens(updatedScreens);
      setErrors({});
    }
  };

  const handleScreenNameChange = (name) => {
    const updatedScreens = [...screens];
    updatedScreens[currentScreenIndex] = {
      ...currentScreen,
      name
    };
    setScreens(updatedScreens);
  };

  const handleTierPriceChange = (tier, price) => {
    const newPricing = { ...tierPricing };
    newPricing[tier] = { ...newPricing[tier], price: parseFloat(price) || 0 };
    setTierPricing(newPricing);
    
    // Update screen pricing
    const updatedScreens = [...screens];
    updatedScreens[currentScreenIndex] = {
      ...currentScreen,
      pricing: newPricing
    };
    setScreens(updatedScreens);
  };

  const handleUnifiedPriceChange = (price) => {
    setUnifiedPrice(price);
    
    // Update screen pricing
    const updatedScreens = [...screens];
    updatedScreens[currentScreenIndex] = {
      ...currentScreen,
      pricing: { unified: parseFloat(price) || 0 }
    };
    setScreens(updatedScreens);
  };

  const addNewScreen = () => {
    const newScreen = {
      name: `Screen ${screens.length + 1}`,
      layout: null,
      pricing: { unified: 150 } // Default unified pricing
    };
    setScreens([...screens, newScreen]);
    setCurrentScreenIndex(screens.length);
    setSelectedLayout('');
    setCustomLayout(null);
    setTierPricing({});
    setUnifiedPrice('');
  };

  const removeScreen = (index) => {
    if (screens.length <= 1) {
      setErrors({ screens: 'At least one screen is required' });
      return;
    }
    
    const updatedScreens = screens.filter((_, i) => i !== index);
    setScreens(updatedScreens);
    
    if (currentScreenIndex >= updatedScreens.length) {
      setCurrentScreenIndex(updatedScreens.length - 1);
    }
  };

  const validateCurrentScreen = () => {
    const newErrors = {};
    
    if (!currentScreen.name?.trim()) {
      newErrors.name = 'Screen name is required';
    }
    
    if (!currentScreen.layout) {
      newErrors.layout = 'Please select a layout';
    }
    
    if (pricingMode === 'tier') {
      const pricingErrors = validatePricing(tierPricing);
      if (pricingErrors.length > 0) {
        newErrors.pricing = pricingErrors[0];
      }
    } else {
      if (!unifiedPrice || unifiedPrice <= 0) {
        newErrors.pricing = 'Please enter a valid price';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllScreens = () => {
    let allValid = true;
    
    screens.forEach((screen, index) => {
      if (!screen.name?.trim() || !screen.layout) {
        allValid = false;
        setCurrentScreenIndex(index);
        return;
      }
      
      if (screen.pricing.unified) {
        if (!screen.pricing.unified || screen.pricing.unified <= 0) {
          allValid = false;
          setCurrentScreenIndex(index);
          return;
        }
      } else {
        const pricingErrors = validatePricing(screen.pricing);
        if (pricingErrors.length > 0) {
          allValid = false;
          setCurrentScreenIndex(index);
          return;
        }
      }
    });
    
    if (!allValid) {
      setErrors({ general: 'Please complete all screen configurations before proceeding' });
    }
    
    return allValid;
  };

  const handleNext = () => {
    if (validateAllScreens()) {
      onNext();
    }
  };

  const handleAddScreen = () => {
    const newScreen = {
      name: '',
      layout: null,
      pricing: { unified: 150 } // Default unified pricing
    };
    
    setScreens([...screens, newScreen]);
    setCurrentScreenIndex(screens.length);
    setSelectedLayout('');
    setCustomLayout(null);
    setPricingMode('tier');
    setTierPricing({});
    setUnifiedPrice('150');
    setErrors({});
  };

  const renderSeatPreview = (layout) => {
    if (!layout || !layout.layout) return null;
    
    return (
      <div className="bg-gray-900 p-6 rounded-lg overflow-x-auto">
        <div className="text-center text-white text-sm font-bold mb-3">SCREEN</div>
        <div className="inline-block min-w-full">
          {layout.layout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1 mb-1">
              {row.map((seat, seatIndex) => (
                <div
                  key={seatIndex}
                  className={`w-3 h-3 rounded-sm text-xs flex items-center justify-center ${
                    seat === '' ? 'invisible' : ''
                  }`}
                  style={{
                    backgroundColor: seat ? SEAT_TIERS[seat]?.color || '#6b7280' : 'transparent',
                    border: seat ? '1px solid rgba(255,255,255,0.2)' : 'none'
                  }}
                  title={seat ? SEAT_TIERS[seat]?.name || 'Standard' : ''}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-4 text-xs">
          {Object.entries(getSeatCountByTier(layout)).map(([tier, count]) => (
            <div key={tier} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: SEAT_TIERS[tier]?.color }}
              />
              <span className="text-gray-400">{SEAT_TIERS[tier]?.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLayoutOptions = () => {
    const categories = {
      'Small Screens': ['SMALL_1', 'SMALL_2'],
      'Medium Screens': ['MEDIUM_1', 'MEDIUM_2'],
      'Large Screens': ['LARGE_1', 'LARGE_2'],
      'Special Layouts': ['COUPLE_FRIENDLY', 'VIP']
    };

    return (
      <div className="space-y-4">
        {Object.entries(categories).map(([category, keys]) => (
          <div key={category}>
            <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
            <div className="grid grid-cols-2 gap-3">
              {keys.map(key => {
                const layout = SEAT_LAYOUTS[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleLayoutSelect(key)}
                    className={`p-3 border rounded-lg text-left transition ${
                      selectedLayout === key
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-medium text-sm ${selectedLayout === key ? 'text-white' : 'text-gray-900'}`}>
                      {layout.name}
                    </div>
                    <div className={`text-xs ${selectedLayout === key ? 'text-blue-100' : 'text-gray-600'}`}>
                      {layout.rows}×{layout.seatsPerRow} • {layout.totalSeats} seats
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPricingConfiguration = () => {
    if (!currentScreen.layout) return null;

    const tiersInLayout = new Set();
    currentScreen.layout.layout?.flat().forEach(seat => {
      if (seat && seat !== '') tiersInLayout.add(seat);
    });

    // Check if this is a single-tier layout (Special layouts)
    const isSingleTier = tiersInLayout.size === 1;
    const singleTier = isSingleTier ? Array.from(tiersInLayout)[0] : null;

    return (
      <div className="space-y-4">
        {isSingleTier ? (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Single Tier Layout:</strong> This layout uses only {SEAT_TIERS[singleTier]?.name} seats
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="tier"
                checked={pricingMode === 'tier'}
                onChange={(e) => setPricingMode(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Tier-based Pricing</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="unified"
                checked={pricingMode === 'unified'}
                onChange={(e) => setPricingMode(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Unified Pricing</span>
            </label>
          </div>
        )}

        {isSingleTier ? (
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: SEAT_TIERS[singleTier]?.color }}
            />
            <span className="text-sm w-24 font-medium">{SEAT_TIERS[singleTier]?.name}</span>
            <input
              type="number"
              value={tierPricing[singleTier]?.price || unifiedPrice || ''}
              onChange={(e) => {
                const price = e.target.value;
                setTierPricing({ [singleTier]: { price: parseFloat(price) || 0 } });
                setUnifiedPrice(price);
              }}
              placeholder="Price"
              className="px-3 py-2 border rounded w-32 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400 border-gray-600"
              min="0"
            />
            <span className="text-sm text-gray-400">per seat</span>
          </div>
        ) : pricingMode === 'tier' ? (
          <div className="space-y-3">
            {Array.from(tiersInLayout).map(tier => (
              <div key={tier} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: SEAT_TIERS[tier]?.color }}
                />
                <span className="text-sm w-24 text-gray-200">{SEAT_TIERS[tier]?.name}</span>
                <input
                  type="number"
                  value={tierPricing[tier]?.price || ''}
                  onChange={(e) => handleTierPriceChange(tier, e.target.value)}
                  placeholder="Price"
                  className="px-3 py-1 border rounded w-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400 border-gray-600"
                  min="0"
                />
                <span className="text-sm text-gray-400">per seat</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={unifiedPrice}
              onChange={(e) => handleUnifiedPriceChange(e.target.value)}
              placeholder="Price"
              className="px-3 py-2 border rounded w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400 border-gray-600"
              min="0"
            />
            <span className="text-sm text-gray-400">per seat (all tiers)</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Screen & Seat Layout Configuration</h2>
        <p className="text-gray-400">Configure screens and seat layouts for your theatre</p>
      </div>

      {/* Screen Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Screens</h3>
          <button
            onClick={handleAddScreen}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Screen
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {screens.map((screen, index) => (
            <div key={index} className="flex items-center gap-1">
              <button
                onClick={() => setCurrentScreenIndex(index)}
                className={`px-4 py-2 rounded-lg transition ${
                  currentScreenIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {screen.name || `Screen ${index + 1}`}
              </button>
              {screens.length > 1 && (
                <button
                  onClick={() => removeScreen(index)}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm"
                  title="Remove Screen"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg text-red-400 text-sm">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Screen Name */}
          <div>
            <label htmlFor="screenName" className="block text-sm font-medium mb-2 text-gray-200">Screen Name</label>
            <input
              id="screenName"
              type="text"
              value={currentScreen.name || ''}
              onChange={(e) => handleScreenNameChange(e.target.value)}
              placeholder="e.g., Screen 1, Auditorium A"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400 ${
                errors.name ? 'border-red-500 bg-red-900/20' : 'border-gray-600'
              }`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Layout Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">Select Layout Template</label>
            {renderLayoutOptions()}
            {errors.layout && <p className="text-red-400 text-xs mt-1">{errors.layout}</p>}
          </div>

          {/* Pricing Configuration */}
          {currentScreen.layout && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Pricing Configuration</label>
              {renderPricingConfiguration()}
              {errors.pricing && <p className="text-red-400 text-xs mt-1">{errors.pricing}</p>}
            </div>
          )}

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
            {showAdvanced && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Custom layout editing and advanced configuration options will be available in the Theatre Manager Dashboard.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {currentScreen.layout && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Layout Preview</h3>
                {renderSeatPreview(currentScreen.layout)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Layout Statistics</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-semibold text-gray-700">Total Seats:</span>
                      <span className="ml-2 text-gray-900">{calculateTotalSeats(currentScreen.layout)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Dimensions:</span>
                      <span className="ml-2 text-gray-900">{currentScreen.layout.rows}×{currentScreen.layout.seatsPerRow}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-sm text-gray-700 block mb-2">Seats by Tier:</span>
                    <div className="space-y-2">
                      {Object.entries(getSeatCountByTier(currentScreen.layout)).map(([tier, count]) => (
                        <div key={tier} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-sm border border-gray-300"
                              style={{ backgroundColor: SEAT_TIERS[tier]?.color }}
                            />
                            <span className="text-sm text-gray-700">{SEAT_TIERS[tier]?.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">{count} seats</span>
                            {pricingMode === 'tier' && tierPricing[tier] && (
                              <span className="text-sm text-gray-600">₹{tierPricing[tier].price}</span>
                            )}
                            {pricingMode === 'unified' && unifiedPrice && (
                              <span className="text-sm text-gray-600">₹{unifiedPrice}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Next: Review & Submit
        </button>
      </div>
    </div>
  );
};

export default ScreenConfiguration;
