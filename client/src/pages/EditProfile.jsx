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
    return formData.name !== (user?.name || "") || formData.phone !== (user?.phone || "");
  }, [formData, user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty) return;
    
    setLoading(true);
    try {
      const { email, ...updateData } = formData;
      const response = await axios.put("/api/user/profile", updateData, { 
        headers: getAuthHeaders() 
      });

      if (response.data.success) {
        toast.success("Profile updated!");
        saveAuth(response.data.user, token, true);
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
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-sm opacity-80 hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>

        <div className="card p-6 sm:p-8 shadow-2xl border border-[var(--border-color)]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Edit Profile</h2>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Update your personal information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* FULL NAME */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Full Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 pointer-events-none">
                  <UserIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  // ADDED: Explicit padding-left (3.5rem) to clear the icon
                  className="input-field w-full py-3 pr-4 outline-none transition-all"
                  style={{ paddingLeft: "3.5rem" }} 
                  placeholder="Enter name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 opacity-50">
                  <MailIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="input-field w-full py-3 pr-4 cursor-not-allowed opacity-60"
                  style={{ paddingLeft: "3.5rem" }}
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 pointer-events-none">
                  <PhoneIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field w-full py-3 pr-4 outline-none transition-all"
                  style={{ paddingLeft: "3.5rem" }}
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={loading || !isDirty}
                className={`btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${(!isDirty || loading) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
              >
                {loading ? "Saving..." : <><Save className="w-5 h-5" /> Save Changes</>}
              </button>
              
              <button type="button" onClick={() => navigate(-1)} className="w-full text-center text-sm font-medium py-2 transition-opacity hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
                Discard changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;