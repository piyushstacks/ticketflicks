import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { assets } from "../../assets/assets";
import { LogOut, Settings } from "lucide-react";
import toast from "react-hot-toast";

const ManagerNavbar = () => {
  const navigate = useNavigate();
  const { logout, user, getTheatresByManager } = useAuthContext();
  const [theatre, setTheatre] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheatre = async () => {
      const managerId = user?.id || user?._id;
      if (managerId) {
        console.log("=== MANAGER NAVBAR THEATRE FETCH ===");
        console.log("Fetching theatre for manager:", managerId);
        console.log("User object:", user);
        console.log("User role:", user?.role);
        console.log("Manager ID type:", typeof managerId);
        try { console.log("Manager ID value:", String(managerId)); } catch {}
        
        try {
          const response = await getTheatresByManager(managerId);
          console.log("Theatre API response:", response);
          console.log("Response success:", response.success);
          console.log("Response theatres:", response.theatres);
          console.log("Response theatres length:", response.theatres?.length);
          
          if (response.success && response.theatres && response.theatres.length > 0) {
            console.log("Setting theatre:", response.theatres[0]);
            setTheatre(response.theatres[0]); // Get first theatre from theatres array
          } else {
            console.log("No theatres found or API failed:", response);
            console.log("Success:", response.success);
            console.log("Theatres array:", response.theatres);
          }
        } catch (error) {
          console.error("Error fetching theatre:", error);
          console.error("Error response:", error.response);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("=== NO MANAGER ID AVAILABLE ===");
        console.log("User object:", user);
        setLoading(false);
      }
    };

    fetchTheatre();
  }, [user, getTheatresByManager]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="hover:opacity-80 transition"
          >
            <img src={assets.logo} alt="TicketFlicks" className="w-36 h-auto" />
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
              Manager
            </span>
            {!loading && (
              <span className="text-lg font-bold text-white">
                {theatre ? `${theatre.name.toUpperCase()} Dashboard` : "No Theatre Assigned"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ManagerNavbar;
