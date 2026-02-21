import React, { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { UserIcon, MailIcon, PhoneIcon, ArrowLeft, Save } from "lucide-react";
import axios from "axios";

const EditProfile = () => {
  const { user, getAuthHeaders, saveAuth, token } = useAuthContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { email, ...updateData } = formData;
      const response = await axios.put("/api/user/profile", updateData, { headers: getAuthHeaders() });
      if (response.data.success) {
        toast.success("Profile updated successfully!");
        saveAuth(response.data.user, token, true);
        navigate("/profile");
      } else {
        toast.error(response.data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 pt-24"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost mb-6 text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="card p-6 sm:p-8">
          <h2
            className="text-xl sm:text-2xl font-bold mb-6 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            Edit Profile
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Name
              </label>
              <div className="relative">
                <UserIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <div className="relative">
                <MailIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="input-field pl-10 cursor-not-allowed opacity-60"
                  placeholder="Your Email"
                  readOnly
                />
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="phone"
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Phone
              </label>
              <div className="relative">
                <PhoneIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Your Phone Number"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 text-sm"
              disabled={loading}
            >
              {loading ? (
                "Updating..."
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Profile
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate(-1)}
            className="btn-secondary w-full mt-3 py-2.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
