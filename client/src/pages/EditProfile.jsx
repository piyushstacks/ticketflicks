import React, { useState, useEffect, useMemo } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { UserIcon, MailIcon, PhoneIcon, ArrowLeft, Save } from "lucide-react";
import axios from "axios";

const EditProfile = () => {
  const { user, getAuthHeaders, saveAuth, token } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const isDirty = useMemo(() => {
    return (
      formData.name.trim() !== (user?.name || "") || 
      formData.phone.trim() !== (user?.phone || "")
    );
  }, [formData, user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty) return;
    
    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      };

      const response = await axios.put("/api/user/profile", updateData, { 
        headers: getAuthHeaders() 
      });

      if (response.data.success) {
        toast.success("Profile updated!");
        
        // This will now work because we added it to AuthContext value
        const updatedUser = response.data.user || { ...user, ...updateData };
        saveAuth(updatedUser, token, true);
        
        navigate("/profile");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Loading />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-md">
        
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-sm opacity-80 hover:opacity-100 transition-all" 
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="card p-6 sm:p-8 shadow-2xl border border-[var(--border-color)]">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: "var(--text-primary)" }}>Edit Profile</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* NAME FIELD */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Full Name</label>
              <div className="relative flex items-center">
                {/* Fixed Icon Container */}
                <div className="absolute left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field w-full py-3 pr-4 transition-all"
                  style={{ paddingLeft: "3.5rem" }} // Force padding regardless of global CSS
                  placeholder="Enter name"
                  required
                />
              </div>
            </div>

            {/* EMAIL FIELD */}
            <div className="flex flex-col gap-2 opacity-60">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Email (Read-only)</label>
              <div className="relative flex items-center">
                <div className="absolute left-0 pl-4 flex items-center">
                  <MailIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="input-field w-full py-3 pr-4 cursor-not-allowed"
                  style={{ paddingLeft: "3.5rem" }}
                />
              </div>
            </div>

            {/* PHONE FIELD */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-0 pl-4 flex items-center pointer-events-none">
                  <PhoneIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field w-full py-3 pr-4 transition-all"
                  style={{ paddingLeft: "3.5rem" }}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isDirty}
              className={`btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${(!isDirty || loading) ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'}`}
            >
              {loading ? "Updating..." : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;