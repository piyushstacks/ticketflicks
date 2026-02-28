import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { 
  Plus, Edit2, Trash2, Power, PowerOff, Eye, Calendar, Clock, Film, 
  Monitor, Copy, Filter, ChevronDown, X, Repeat, Globe
} from "lucide-react";
import Loading from "../../components/Loading";
import { composeValidators, dateAfterOrEqual, dateNotPast, errorId, numberMin, required } from "../../lib/validation.js";

const ManagerShows = () => {
  const { axios, getAuthHeaders, imageBaseURL } = useAppContext();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingShow, setViewingShow] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filterWeek, setFilterWeek] = useState('all'); // Default to ALL so shows are visible immediately
  const [filterMovie, setFilterMovie] = useState('');
  const [filterScreen, setFilterScreen] = useState('');
  const [showPricingCustomization, setShowPricingCustomization] = useState(false);
  
  const [formData, setFormData] = useState({
    movie: "",
    screen: "",
    showTime: "",
    language: "English",
    startDate: "",
    endDate: "",
    tierPrices: {},  // Will store individual tier prices: { "Standard": "150", "Deluxe": "200", ... }
    isActive: true
  });

  const formId = "manager-show";
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const validators = useMemo(
    () => ({
      movie: required("Movie"),
      screen: required("Screen"),
      showTime: required("Show time"),
      language: required("Language"),
      startDate: composeValidators(required("Start date"), dateNotPast("Start date")),
      endDate: composeValidators(
        required("End date"),
        dateNotPast("End date"),
        dateAfterOrEqual("startDate", "End date", "Start date")
      ),
    }),
    []
  );

  const validateField = (name, nextValues) => {
    if (name.startsWith("tierPrice_")) {
      const tierName = name.replace("tierPrice_", "");
      const v = nextValues.tierPrices?.[tierName];
      if (v === undefined || v === null || v === "") return `Price for ${tierName} is required`;
      const n = Number(v);
      if (Number.isNaN(n)) return `Price for ${tierName} must be a number`;
      if (n <= 0) return `Price for ${tierName} must be greater than 0`;
      return "";
    }
    const validator = validators[name];
    if (!validator) return "";
    return validator(nextValues[name], nextValues) || "";
  };

  const touchAndValidate = (name, nextValues) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
    const error = validateField(name, nextValues);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
    return error;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (!name) return;
    touchAndValidate(name, formData);
  };

  const languages = [
    "English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", 
    "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu", "Others"
  ];

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sun, 1=Mon...
    // Calculate Monday as start of week
    const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const getNextWeekDates = () => {
    const currentWeek = getCurrentWeekDates();
    const nextMonday = new Date(currentWeek.start);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const nextSunday = new Date(currentWeek.end);
    nextSunday.setDate(nextSunday.getDate() + 7);
    
    return {
      start: nextMonday.toISOString().split('T')[0],
      end: nextSunday.toISOString().split('T')[0]
    };
  };

  const fetchShows = async () => {
    try {
      setLoading(true);
      console.log("[ManagerShows] Fetching shows...");
      
      // Check if user is authenticated and has proper role
      const authHeaders = getAuthHeaders();
      console.log("[ManagerShows] Auth headers:", authHeaders);
      
      if (!authHeaders.Authorization) {
        console.error("[ManagerShows] No authentication token found");
        toast.error("Authentication required. Please log in.");
        setLoading(false);
        return;
      }
      
      const { data } = await axios.get("/api/manager/shows/list", {
        headers: authHeaders,
      });

      console.log("[ManagerShows] Shows response:", data);
      console.log("[ManagerShows] Response success:", data.success);
      console.log("[ManagerShows] Shows count:", data.shows?.length);
      
      if (data.success) {
        // Validate and sanitize show data
        const validShows = (data.shows || []).filter(show => {
          const isValid = show && show._id && show.movie && show.screen;
          if (!isValid) {
            console.warn("[ManagerShows] Filtering out invalid show:", show);
          }
          return isValid;
        });
        
        console.log("[ManagerShows] Setting validated shows:", validShows.length);
        if (validShows.length > 0) {
          console.log("[ManagerShows] First validated show sample:", JSON.stringify(validShows[0], null, 2));
          console.log("[ManagerShows] First show movie:", validShows[0].movie);
          console.log("[ManagerShows] First show screen:", validShows[0].screen);
        }
        setShows(validShows);
      } else {
        console.error("[ManagerShows] API error:", data.message);
        toast.error(data.message || "Failed to fetch shows");
      }
    } catch (error) {
      console.error("[ManagerShows] Error fetching shows:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Manager privileges required.");
      } else {
        toast.error("Failed to fetch shows");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) {
        console.warn("[ManagerShows] No auth token for movies fetch");
        return;
      }
      
      const { data } = await axios.get("/api/show/movies/all", {
        headers: authHeaders,
      });

      if (data.success) {
        // Validate movie data
        const validMovies = (data.movies || []).filter(movie => movie && movie._id && movie.title);
        setMovies(validMovies);
      } else {
        console.error("Movies API error:", data.message);
        toast.error(data.message || "Failed to fetch movies");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required for movies");
      } else {
        toast.error("Failed to fetch movies");
      }
    }
  };

  const fetchScreens = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) {
        console.warn("[ManagerShows] No auth token for screens fetch");
        return;
      }
      
      const { data } = await axios.get("/api/theatre/screens", {
        headers: authHeaders,
      });

      if (data.success) {
        console.log("Screens fetched:", data.screens);
        console.log("First screen seatTiers:", data.screens?.[0]?.seatTiers);
        // Validate screen data
        const validScreens = (data.screens || []).filter(screen => screen && screen._id);
        setScreens(validScreens);
      } else {
        console.error("Screens API error:", data.message);
        toast.error(data.message || "Failed to fetch screens");
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required for screens");
      } else {
        toast.error("Failed to fetch screens");
      }
    }
  };

  useEffect(() => {
    fetchShows();
    fetchMovies();
    fetchScreens();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = "${value}"`);
    
    // Handle tier price inputs separately
    if (name.startsWith('tierPrice_')) {
      const tierName = name.replace('tierPrice_', '');
      setFormData(prev => {
        const next = {
          ...prev,
          tierPrices: {
            ...prev.tierPrices,
            [tierName]: value
          }
        };
        if (touched[name]) {
          touchAndValidate(name, next);
        }
        return next;
      });
      console.log(`Updated ${tierName} tier price to: ${value}`);
      return;
    }
    
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      console.log("Updated formData:", newData);
      if (touched[name]) {
        touchAndValidate(name, newData);
      }
      return newData;
    });

    // If screen is selected, find its details and set default tier prices
    if (name === 'screen' && value) {
      console.log("Screen selected, finding details for:", value);
      console.log("Available screens:", screens);
      const selectedScreen = screens.find(screen => screen._id === value);
      console.log("Selected screen:", selectedScreen);
      console.log("Screen seatTiers:", selectedScreen?.seatTiers);
      
      if (selectedScreen && selectedScreen.seatTiers && selectedScreen.seatTiers.length > 0) {
        // Set default prices for each tier
        const defaultTierPrices = {};
        selectedScreen.seatTiers.forEach(tier => {
          defaultTierPrices[tier.tierName] = tier.price.toString();
        });
        
        console.log("Screen seat tiers:", selectedScreen.seatTiers);
        console.log("Setting default tier prices:", defaultTierPrices);
        
        setFormData(prev => ({
          ...prev,
          tierPrices: defaultTierPrices
        }));
        
        const tierCount = selectedScreen.seatTiers.length;
        toast.success(`Pricing set for ${tierCount} tiers based on screen configuration`);
      } else {
        // Fallback to empty prices if no tiers found
        console.log("No seat tiers found, using empty tier prices");
        setFormData(prev => ({
          ...prev,
          tierPrices: {}
        }));
      }
    }
  };

  const getTodayString = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextTouched = {};
    const nextErrors = {};

    for (const name of Object.keys(validators)) {
      nextTouched[name] = true;
      const error = validateField(name, formData);
      if (error) nextErrors[name] = error;
    }

    if (formData.screen) {
      const selectedScreen = screens.find((s) => s._id === formData.screen);
      if (selectedScreen?.seatTiers?.length) {
        for (const tier of selectedScreen.seatTiers) {
          const key = `tierPrice_${tier.tierName}`;
          nextTouched[key] = true;
          const error = validateField(key, formData);
          if (error) nextErrors[key] = error;
        }
      }
    }

    setTouched((prev) => ({ ...nextTouched, ...prev }));
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    // Debug: Log formData to see what values are actually present
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form Data on Submit:", formData);
    console.log("Validation checks:", {
      movie: !!formData.movie,
      screen: !!formData.screen,
      showTime: !!formData.showTime,
      startDate: !!formData.startDate,
      endDate: !!formData.endDate,
      movieValue: formData.movie,
      screenValue: formData.screen,
      showTimeValue: formData.showTime,
      startDateValue: formData.startDate,
      endDateValue: formData.endDate
    });

    console.log("Basic validation passed, proceeding with date validation...");

    // Validate dates
    console.log("Starting date validation...");
    if (formData.startDate && formData.endDate) {
      // Parse as local noon to avoid UTC timezone issues (IST = UTC+5:30)
      const start = new Date(`${formData.startDate}T12:00:00`);
      const end   = new Date(`${formData.endDate}T12:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (end < start) {
        toast.error("End date cannot be before start date");
        return;
      }
      // Only block dates that are clearly yesterday or earlier
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (end < yesterday) {
        toast.error("Show end date cannot be in the past");
        return;
      }
    }
    console.log("Date validation passed");

    try {
      console.log("Starting API call...");
      let response;
      if (editingId) {
        console.log("Editing existing show:", editingId);
        response = await axios.put(
          `/api/show/shows/${editingId}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        console.log("Creating new show...");
        // Set default dates for new shows (current week)
        const weekDates = getCurrentWeekDates();
        // Use customized tier prices if available, otherwise use screen defaults
        const selectedScreen = screens.find(screen => screen._id === formData.screen);
        const seatTiers = Object.keys(formData.tierPrices).length > 0 
          ? Object.entries(formData.tierPrices).map(([tierName, price]) => ({
              tierName,
              price: parseFloat(price)
            }))
          : (selectedScreen?.seatTiers || []).map(tier => ({
              tierName: tier.tierName,
              price: tier.price
            }));

        const showData = {
          movieId: formData.movie,
          screenId: formData.screen,
          showDateTime: `${formData.startDate}T${formData.showTime}:00`, // Combine date and time
          startDate: formData.startDate || weekDates.start,
          endDate: formData.endDate || weekDates.end,
          language: formData.language,
          seatTiers: seatTiers
        };
        
        console.log("Sending showData to API:", showData);
        console.log("API endpoint:", "/api/manager/shows/add");
        
        response = await axios.post(
          "/api/manager/shows/add",
          showData,
          { headers: getAuthHeaders() }
        );
        
        console.log("API response received:", response);
      }

      const { data } = response;
      console.log("=== RESPONSE DATA DEBUG ===");
      console.log("Response data:", data);
      console.log("Data.success:", data.success);
      console.log("Data.message:", data.message);
      console.log("============================");
      
      if (data.success) {
        console.log("Success case - processing successful response");
        toast.success(data.message);
        setFormData({
          movie: "",
          screen: "",
          showTime: "",
          language: "English",
          startDate: "",
          endDate: "",
          tierPrices: {},
          isActive: true
        });
        setEditingId(null);
        setShowForm(false);
        setShowPricingCustomization(false);
        fetchShows();
      } else {
        console.log("Error case - server returned success: false");
        toast.error(data.message);
      }
    } catch (error) {
      console.error("=== API ERROR DEBUG ===");
      console.error("Full error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error response status text:", error.response?.statusText);
      
      if (error.response?.data?.message) {
        toast.error(`Server error: ${error.response.data.message}`);
      } else if (error.response?.status) {
        toast.error(`Server error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.message) {
        toast.error(`Network error: ${error.message}`);
      } else {
        toast.error("Failed to save show - unknown error");
      }
    }
  };

  const handleEdit = (show) => {
    // Convert seatTiers to tierPrices object for form
    const tierPrices = {};
    if (show.seatTiers && Array.isArray(show.seatTiers)) {
      show.seatTiers.forEach(tier => {
        tierPrices[tier.tierName] = tier.price.toString();
      });
    }

    setFormData({
      movie: show.movie._id,
      screen: show.screen._id,
      showTime: show.showTime,
      language: show.language || "English",
      startDate: show.startDate,
      endDate: show.endDate,
      tierPrices: tierPrices,
      isActive: show.isActive
    });
    setEditingId(show._id);
    setShowPricingCustomization(false);
    setShowForm(true);
  };

  const handleToggleStatus = async (showId, currentStatus) => {
    const action = currentStatus ? 'disable' : 'enable';
    const confirmMessage = `Are you sure you want to ${action} this show?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const { data } = await axios.patch(`/api/show/shows/${showId}/status`, {
        isActive: !currentStatus
      }, {
        headers: getAuthHeaders()
      });

      if (data.success) {
        toast.success(`Show ${action}d successfully`);
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Failed to ${action} show`);
    }
  };

  const handleDelete = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show?")) return;

    try {
      const { data } = await axios.delete(`/api/show/shows/${showId}`, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        toast.success("Show deleted successfully");
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete show");
    }
  };

  const handleExtendShow = async (showId) => {
    if (!window.confirm("Are you sure you want to extend this show by 7 days?")) return;

    try {
      const show = shows.find(s => s._id === showId);
      if (!show) {
        toast.error("Show not found");
        return;
      }

      const currentEndDate = new Date(show.endDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + 7);

      const { data } = await axios.put(
        `/api/show/shows/${showId}`,
        { endDate: newEndDate.toISOString().split('T')[0] },
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        toast.success("Show extended by 7 days successfully");
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error extending show:", error);
      toast.error("Failed to extend show");
    }
  };

  const handleRepeatForNextWeek = async () => {
    const confirmMessage = "Are you sure you want to repeat all current shows for next week?";
    if (!window.confirm(confirmMessage)) return;

    try {
      const currentWeek = getCurrentWeekDates();
      const nextWeek = getNextWeekDates();
      
      const { data } = await axios.post("/api/show/shows/repeat-week", {
        currentWeekStart: currentWeek.start,
        currentWeekEnd: currentWeek.end,
        nextWeekStart: nextWeek.start,
        nextWeekEnd: nextWeek.end
      }, {
        headers: getAuthHeaders()
      });

      if (data.success) {
        toast.success(`Successfully repeated ${data.count} shows for next week`);
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to repeat shows for next week");
    }
  };

  const getFilteredShows = () => {
    console.log("[ManagerShows] getFilteredShows called, raw shows:", shows.length);
    let filtered = [...shows];
    
    // Filter by week
    const currentWeek = getCurrentWeekDates();
    const nextWeek = getNextWeekDates();
    
    console.log("[ManagerShows] Filter week:", filterWeek);
    console.log("[ManagerShows] Current week:", currentWeek);
    console.log("[ManagerShows] Next week:", nextWeek);
    
    if (filterWeek === 'current') {
      const currentWeek = getCurrentWeekDates();
      filtered = filtered.filter(show => {
        const dateField = show.showDateTime || show.startDate;
        if (!dateField) return false;
        // Parse as local noon to avoid UTC timezone offset causing wrong week
        const dateStr = typeof dateField === 'string' ? dateField.split('T')[0] : new Date(dateField).toISOString().split('T')[0];
        const showDate = new Date(`${dateStr}T12:00:00`);
        const start = new Date(`${currentWeek.start}T00:00:00`);
        const end = new Date(`${currentWeek.end}T23:59:59`);
        return showDate >= start && showDate <= end;
      });
    } else if (filterWeek === 'next') {
      const nextWeek = getNextWeekDates();
      filtered = filtered.filter(show => {
        const dateField = show.showDateTime || show.startDate;
        if (!dateField) return false;
        const dateStr = typeof dateField === 'string' ? dateField.split('T')[0] : new Date(dateField).toISOString().split('T')[0];
        const showDate = new Date(`${dateStr}T12:00:00`);
        const start = new Date(`${nextWeek.start}T00:00:00`);
        const end = new Date(`${nextWeek.end}T23:59:59`);
        return showDate >= start && showDate <= end;
      });
    }
    // filterWeek === 'all': no date filter, show everything
    
    console.log("[ManagerShows] After week filter:", filtered.length);
    
    // Filter by movie
    if (filterMovie) {
      filtered = filtered.filter(show => {
        const hasMovie = show.movie?._id === filterMovie;
        if (!hasMovie) {
          console.log(`[ManagerShows] Filtering out show ${show._id} - movie mismatch`);
        }
        return hasMovie;
      });
      console.log("[ManagerShows] After movie filter:", filtered.length);
    }
    
    // Filter by screen
    if (filterScreen) {
      filtered = filtered.filter(show => {
        const hasScreen = show.screen?._id === filterScreen;
        if (!hasScreen) {
          console.log(`[ManagerShows] Filtering out show ${show._id} - screen mismatch`);
        }
        return hasScreen;
      });
      console.log("[ManagerShows] After screen filter:", filtered.length);
    }
    
    console.log("[ManagerShows] Final filtered count:", filtered.length);
    return filtered;
  };

  const formatShowTime = (time) => {
    if (!time) return 'Not set';
    // If time looks like "HH:MM" or "HH:MM:SS" use it directly
    const match = time.toString().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const hour = parseInt(match[1]);
      const minutes = match[2];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  // Derive showTime from stored showTime or from showDateTime field
  const getShowTime = (show) => {
    if (show.showTime) return show.showTime;
    if (show.showDateTime) {
      // showDateTime is UTC – extract local time string
      const d = new Date(show.showDateTime);
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }
    return null;
  };

  // Derive startDate from stored startDate or from showDateTime
  const getShowStartDate = (show) => {
    if (show.startDate) return show.startDate;
    if (show.showDateTime) {
      return new Date(show.showDateTime).toISOString().split('T')[0];
    }
    return null;
  };

  // Derive endDate — if missing, same as startDate (single-day show)
  const getShowEndDate = (show) => {
    if (show.endDate) return show.endDate;
    return getShowStartDate(show);
  };

  if (loading) {
    return <Loading />;
  }

  const filteredShows = getFilteredShows();
  console.log("[ManagerShows] RENDER - filteredShows.length:", filteredShows.length);
  console.log("[ManagerShows] RENDER - filteredShows:", filteredShows);
  if (filteredShows.length > 0) {
    console.log("[ManagerShows] RENDER - First show movie:", filteredShows[0].movie);
    console.log("[ManagerShows] RENDER - First show screen:", filteredShows[0].screen);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <Calendar className="w-10 h-10 text-primary" />
            Show Schedule
          </h1>
          <p className="text-gray-400 mt-2 font-medium flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            Manage and schedule movie shows for your theatre screens
          </p>
        </div>
        
        <button
          onClick={() => {
            const today = getTodayString();
            const initialFormData = {
              movie: "",
              screen: "",
              showTime: "",
              language: "English",
              startDate: today,
              endDate: today,
              tierPrices: {},
              isActive: true
            };
            console.log("Opening new show form with initial data:", initialFormData);
            setFormData(initialFormData);
            setShowPricingCustomization(false);
            setShowForm(true);
          }}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dull text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Schedule New Show</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 md:p-6 mb-6 md:mb-10 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3 text-primary" />
              Time Period
            </label>
            <div className="relative group">
              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
              >
                <option value="all">All Shows</option>
                <option value="current">Current Week</option>
                <option value="next">Next Week</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-primary transition-colors" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Film className="w-3 h-3 text-primary" />
              Filter Movie
            </label>
            <div className="relative group">
              <select
                value={filterMovie}
                onChange={(e) => setFilterMovie(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
              >
                <option value="">All Movies</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-primary transition-colors" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Monitor className="w-3 h-3 text-primary" />
              Filter Screen
            </label>
            <div className="relative group">
              <select
                value={filterScreen}
                onChange={(e) => setFilterScreen(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
              >
                <option value="">All Screens</option>
                {screens.map((screen) => (
                  <option key={screen._id} value={screen._id}>
                    {screen.name || `Screen ${screen.screenNumber}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-primary transition-colors" />
            </div>
          </div>
          
          <div className="flex items-end pb-1">
            <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl w-full">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-bold text-gray-300">
                {filteredShows.length} {filteredShows.length === 1 ? 'Show' : 'Shows'} Found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-start md:items-center justify-center z-50 p-2 md:p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl md:rounded-3xl w-full max-w-2xl my-4 md:my-0 overflow-hidden shadow-2xl shadow-primary/20 ring-1 ring-white/10">
            <div className="p-4 md:p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-primary/20">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black text-white tracking-tight">
                    {editingId ? "Update Schedule" : "Schedule New Show"}
                  </h2>
                  <p className="text-gray-400 text-xs md:text-sm font-medium mt-1">
                    Configure show timings and duration for your screen
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  const today = getTodayString();
                  setFormData({
                    movie: "",
                    screen: "",
                    showTime: "",
                    language: "English",
                    startDate: today,
                    endDate: today,
                    isActive: true
                  });
                }}
                className="p-3 hover:bg-gray-800 rounded-2xl transition-all border border-transparent hover:border-gray-700 group"
              >
                <X className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-10 space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Movie Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    Target Movie <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      name="movie"
                      value={formData.movie}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      aria-invalid={touched.movie && fieldErrors.movie ? "true" : undefined}
                      aria-describedby={touched.movie && fieldErrors.movie ? errorId(formId, "movie") : undefined}
                      required
                      className="w-full pl-4 pr-10 py-4 bg-gray-800/40 border border-gray-700 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                    >
                      <option value="">Select a movie...</option>
                      {movies.map((movie) => (
                        <option key={movie._id} value={movie._id}>
                          {movie.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-primary transition-colors" />
                  </div>
                  {touched.movie && fieldErrors.movie && (
                    <p id={errorId(formId, "movie")} className="field-error-text" role="alert">
                      {fieldErrors.movie}
                    </p>
                  )}
                </div>

                {/* Screen Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    Select Screen <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      name="screen"
                      value={formData.screen}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      aria-invalid={touched.screen && fieldErrors.screen ? "true" : undefined}
                      aria-describedby={touched.screen && fieldErrors.screen ? errorId(formId, "screen") : undefined}
                      required
                      className="w-full pl-4 pr-10 py-4 bg-gray-800/40 border border-gray-700 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                    >
                      <option value="">Select a screen...</option>
                      {screens.map((screen) => (
                        <option key={screen._id} value={screen._id}>
                          {screen.name || `Screen ${screen.screenNumber}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-primary transition-colors" />
                  </div>
                  {touched.screen && fieldErrors.screen && (
                    <p id={errorId(formId, "screen")} className="field-error-text" role="alert">
                      {fieldErrors.screen}
                    </p>
                  )}
                </div>

                {/* Show Time */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Daily Time <span className="text-primary">*</span>
                  </label>
                  <input
                    type="time"
                    name="showTime"
                    value={formData.showTime}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.showTime && fieldErrors.showTime ? "true" : undefined}
                    aria-describedby={touched.showTime && fieldErrors.showTime ? errorId(formId, "showTime") : undefined}
                    required
                    className="w-full px-5 py-4 bg-gray-800/40 border border-gray-700 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm"
                  />
                  {touched.showTime && fieldErrors.showTime && (
                    <p id={errorId(formId, "showTime")} className="field-error-text" role="alert">
                      {fieldErrors.showTime}
                    </p>
                  )}
                </div>

                {/* Language Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Language <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      aria-invalid={touched.language && fieldErrors.language ? "true" : undefined}
                      aria-describedby={touched.language && fieldErrors.language ? errorId(formId, "language") : undefined}
                      required
                      className="w-full pl-4 pr-10 py-4 bg-gray-800/40 border border-gray-700 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-primary transition-colors" />
                  </div>
                  {touched.language && fieldErrors.language && (
                    <p id={errorId(formId, "language")} className="field-error-text" role="alert">
                      {fieldErrors.language}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Start Date <span className="text-primary">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.startDate && fieldErrors.startDate ? "true" : undefined}
                    aria-describedby={touched.startDate && fieldErrors.startDate ? errorId(formId, "startDate") : undefined}
                    min={getTodayString()}
                    required
                    className="w-full px-5 py-4 bg-gray-800/40 border border-gray-700 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm"
                  />
                  {touched.startDate && fieldErrors.startDate && (
                    <p id={errorId(formId, "startDate")} className="field-error-text" role="alert">
                      {fieldErrors.startDate}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    End Date <span className="text-primary">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.endDate && fieldErrors.endDate ? "true" : undefined}
                    aria-describedby={touched.endDate && fieldErrors.endDate ? errorId(formId, "endDate") : undefined}
                    min={getTodayString()}
                    required
                    className="w-full px-5 py-4 bg-gray-800/40 border border-gray-700 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm"
                  />
                  {touched.endDate && fieldErrors.endDate && (
                    <p id={errorId(formId, "endDate")} className="field-error-text" role="alert">
                      {fieldErrors.endDate}
                    </p>
                  )}
                </div>

                {/* Tier Pricing */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-primary">₹</span>
                    Tier Pricing
                  </label>
                  
                  {formData.screen && (() => {
                    const selectedScreen = screens.find(screen => screen._id === formData.screen);
                    if (selectedScreen && selectedScreen.seatTiers && selectedScreen.seatTiers.length > 0) {
                      return (
                        <div className="space-y-4">
                          {/* Default Pricing Display */}
                          <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-300">Default Screen Pricing</span>
                              <button
                                type="button"
                                onClick={() => setShowPricingCustomization(!showPricingCustomization)}
                                className="text-xs px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium transition-all border border-primary/30"
                              >
                                {showPricingCustomization ? 'Use Defaults' : 'Customize Pricing'}
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              {selectedScreen.seatTiers.map((tier, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                                  <span className="text-xs text-gray-400">{tier.tierName}</span>
                                  <span className="text-sm font-bold text-primary">₹{formData.tierPrices[tier.tierName] || tier.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Customization Inputs - Only shown when toggled */}
                          {showPricingCustomization && (
                            <div className="space-y-3 animate-fadeIn">
                              <div className="text-xs text-gray-400 text-center border-t border-gray-700/50 pt-3">
                                Set custom prices for this show
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {selectedScreen.seatTiers.map((tier, index) => (
                                  <div key={index} className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                                      {tier.tierName}
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">₹</span>
                                      <input
                                        type="number"
                                        name={`tierPrice_${tier.tierName}`}
                                        value={formData.tierPrices[tier.tierName] || ''}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        aria-invalid={
                                          touched[`tierPrice_${tier.tierName}`] && fieldErrors[`tierPrice_${tier.tierName}`]
                                            ? "true"
                                            : undefined
                                        }
                                        aria-describedby={
                                          touched[`tierPrice_${tier.tierName}`] && fieldErrors[`tierPrice_${tier.tierName}`]
                                            ? `${formId}-${`tierPrice_${tier.tierName}`.replace(/[^a-zA-Z0-9_-]/g, "_")}-error`
                                            : undefined
                                        }
                                        min="0"
                                        step="10"
                                        placeholder={tier.price.toString()}
                                        className="w-full pl-8 pr-3 py-3 bg-gray-800/40 border border-gray-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm"
                                      />
                                    </div>
                                    {touched[`tierPrice_${tier.tierName}`] && fieldErrors[`tierPrice_${tier.tierName}`] && (
                                      <p
                                        id={`${formId}-${`tierPrice_${tier.tierName}`.replace(/[^a-zA-Z0-9_-]/g, "_")}-error`}
                                        className="field-error-text"
                                        role="alert"
                                      >
                                        {fieldErrors[`tierPrice_${tier.tierName}`]}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700/50">
                          <div className="text-gray-400 text-sm">
                            Please select a screen to configure tier pricing
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setShowPricingCustomization(false);
                  }}
                  className="flex-1 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-bold transition-all border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-8 py-4 bg-primary hover:bg-primary-dull text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {editingId ? "Update Show Schedule" : "Confirm Show Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-6">
        {filteredShows.length > 0 ? (
          filteredShows.map((show) => (
            <div
              key={show._id}
              className={`bg-gray-900/40 border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 ${
                show.isActive ? 'border-gray-800 hover:border-primary/40' : 'border-red-900/30 opacity-80'
              }`}
            >
              {/* Show Card Header - Movie Poster & Basic Info */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={show.movie?.poster_path ? (show.movie.poster_path.startsWith('http') ? show.movie.poster_path : `${imageBaseURL}${show.movie.poster_path}`) : '/placeholder-movie.jpg'}
                  alt={show.movie?.title || 'Movie Poster'}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    e.target.src = '/placeholder-movie.jpg';
                    e.target.onerror = null;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white line-clamp-1">
                    {show.movie?.title || 'Unknown Movie'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-300">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-semibold">
                      {show.language || "English"}
                    </span>
                    {show.screen && (
                      <>
                        <span>•</span>
                        <span>{show.screen.name || `Screen ${show.screen.screenNumber}`}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full shadow-lg ${
                    show.isActive ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                  }`}>
                    {show.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </div>

              {/* Show Card Content */}
              <div className="p-3 md:p-5 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3 text-gray-300 bg-gray-800/50 p-2 md:p-3 rounded-lg border border-gray-700/50">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Show Time</p>
                      <p className="text-xs md:text-sm font-semibold truncate">{formatShowTime(getShowTime(show))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 text-gray-300 bg-gray-800/50 p-2 md:p-3 rounded-lg border border-gray-700/50">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Start Date</p>
                      <p className="text-xs md:text-sm font-semibold truncate">
                        {getShowStartDate(show) ? new Date(`${getShowStartDate(show)}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm py-1 md:py-2 px-1">
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Date Range</span>
                    <span className="text-gray-300 text-xs md:text-sm truncate">
                      {(getShowStartDate(show) || getShowEndDate(show))
                        ? `${new Date(`${getShowStartDate(show)}T12:00:00`).toLocaleDateString()} - ${new Date(`${getShowEndDate(show)}T12:00:00`).toLocaleDateString()}`
                        : 'Date range not set'
                      }
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Actions</span>
                    <button 
                      onClick={() => setViewingShow(show)}
                      className="text-primary hover:underline text-xs font-bold uppercase"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
                  <button
                    onClick={() => handleEdit(show)}
                    className="flex-1 min-w-[70px] flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-all text-xs md:text-sm font-bold border border-blue-500/20"
                    title="Edit Show"
                  >
                    <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleStatus(show._id, show.isActive)}
                    className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg transition-all text-xs md:text-sm font-bold border ${
                      show.isActive 
                        ? 'bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border-orange-500/20' 
                        : 'bg-green-600/10 hover:bg-green-600/20 text-green-400 border-green-500/20'
                    }`}
                    title={show.isActive ? 'Disable Show' : 'Enable Show'}
                  >
                    {show.isActive ? <PowerOff className="w-3 h-3 md:w-4 md:h-4" /> : <Power className="w-3 h-3 md:w-4 md:h-4" />}
                    <span className="hidden sm:inline">{show.isActive ? 'Disable' : 'Enable'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(show._id)}
                    className="flex items-center justify-center p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-all border border-red-500/20"
                    title="Delete Show"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => handleExtendShow(show._id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all text-xs font-bold border border-primary/20"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  Extend by 7 Days
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 md:py-20 bg-gray-900/20 rounded-2xl border-2 border-gray-800 border-dashed mx-2 md:mx-0">
            <Film className="w-12 h-12 md:w-16 md:h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-gray-400">No shows found</h3>
            <p className="text-gray-500 mt-2 text-sm md:text-base px-4">
              {filterWeek === 'current' 
                ? "No shows scheduled for this week. Create your first show to get started."
                : "No shows found for the selected filters."}
            </p>
            <button
              onClick={() => {
                const today = getTodayString();
                setFormData({
                  movie: "",
                  screen: "",
                  showTime: "",
                  language: "English",
                  startDate: today,
                  endDate: today,
                  tierPrices: {},
                  isActive: true
                });
                setShowPricingCustomization(false);
                setShowForm(true);
              }}
              className="mt-6 px-6 py-2 bg-primary hover:bg-primary-dull text-white rounded-lg transition font-bold"
            >
              Schedule First Show
            </button>
          </div>
        )}
      </div>

      {/* Show Details Modal */}
      {viewingShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{viewingShow.movie.title}</h2>
                  <p className="text-gray-400 mt-1">Show Details</p>
                </div>
                <button
                  onClick={() => setViewingShow(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {viewingShow.movie.poster_path ? (
                    <img
                      src={
                        viewingShow.movie.poster_path.startsWith("http")
                          ? viewingShow.movie.poster_path
                          : `${imageBaseURL}${viewingShow.movie.poster_path}`
                      }
                      alt={viewingShow.movie.title}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-800 flex items-center justify-center rounded-lg">
                      <Film className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-primary mb-3">Show Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Screen:</span>
                        <span className="text-gray-300">{viewingShow.screen.name || `Screen ${viewingShow.screen.screenNumber}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Show Time:</span>
                        <span className="text-gray-300">{formatShowTime(getShowTime(viewingShow))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Language:</span>
                        <span className="text-gray-300">{viewingShow.language || "English"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Start Date:</span>
                        <span className="text-gray-300">
                          {getShowStartDate(viewingShow)
                            ? new Date(`${getShowStartDate(viewingShow)}T12:00:00`).toLocaleDateString()
                            : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">End Date:</span>
                        <span className="text-gray-300">
                          {getShowEndDate(viewingShow)
                            ? new Date(`${getShowEndDate(viewingShow)}T12:00:00`).toLocaleDateString()
                            : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          viewingShow.isActive 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {viewingShow.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {viewingShow.movie.overview && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-primary mb-3">Movie Overview</h3>
                      <p className="text-gray-300 text-sm">{viewingShow.movie.overview}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerShows;
