import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { assets } from "../../assets/assets";
import { LogOut } from "lucide-react";
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
        try {
          const response = await getTheatresByManager(managerId);
          if (response.success && response.theatres && response.theatres.length > 0) {
            setTheatre(response.theatres[0]);
          }
        } catch (error) {
          console.error("Error fetching theatre:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchTheatre();
  }, [user, getTheatresByManager]);

  const handleLogout = async () => {
    try {
      toast.success("Logged out successfully");
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="hover:opacity-80 transition">
            <img
              src={assets.logo}
              alt="TicketFlicks"
              className="w-36 h-auto"
              style={{ filter: "var(--logo-filter, none)" }}
            />
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
              Manager
            </span>
            {!loading && (
              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {theatre ? `${theatre.name.toUpperCase()} Dashboard` : "No Theatre Assigned"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center gap-2 text-sm"
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
