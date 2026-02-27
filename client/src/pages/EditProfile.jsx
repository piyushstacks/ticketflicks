import React, { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { AlertCircle, ArrowLeft, MailIcon, PhoneIcon, Save, UserIcon } from "lucide-react";
import axios from "axios";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { composeValidators, errorId, optionalPhone10, required } from "../lib/validation.js";

const minName = (value) => {
  const v = (value || "").toString().trim();
  if (v.length < 2) return "Full name must be at least 2 characters";
  return "";
};

const EditProfile = () => {
  const { user, getAuthHeaders, saveAuth, token } = useAuthContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);

  const formId = "edit-profile";
  const schema = useMemo(
    () => ({
      name: composeValidators(required("Full name"), minName),
      phone: optionalPhone10("Phone number"),
    }),
    []
  );

  const { values, errors, touched, getInputProps, validateForm, reset } = useFormValidation({
    formId,
    initialValues: { name: "", email: "", phone: "" },
    schema,
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [reset, user]);

  const isDirty = useMemo(() => {
    return (
      (values.name || "").trim() !== (user?.name || "") || 
      (values.phone || "").trim() !== (user?.phone || "")
    );
  }, [user, values.name, values.phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty) return;
    const { isValid } = validateForm();
    if (!isValid) return;
    
    setLoading(true);
    try {
      const updateData = {
        name: values.name.trim(),
        phone: values.phone.trim(),
      };

      const response = await axios.put(`/api/user/users/${user._id}`, updateData, { 
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
              <label className="text-xs font-bold uppercase tracking-widest" htmlFor={`${formId}-name`} style={{ color: "var(--text-secondary)" }}>Full Name</label>
              <div className="relative flex items-center">
                {/* Fixed Icon Container */}
                <div className="absolute left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="text"
                  {...getInputProps("name")}
                  className="input-field w-full py-3 pr-4 transition-all"
                  style={{ paddingLeft: "3.5rem" }} // Force padding regardless of global CSS
                  placeholder="Enter name"
                  required
                />
                {touched.name && errors.name && (
                  <div className="absolute right-4">
                    <AlertCircle className="w-5 h-5" style={{ color: "#ef4444" }} />
                  </div>
                )}
              </div>
              {touched.name && errors.name && (
                <p id={errorId(formId, "name")} className="field-error-text" role="alert">
                  {errors.name}
                </p>
              )}
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
                  value={values.email}
                  readOnly
                  className="input-field w-full py-3 pr-4 cursor-not-allowed"
                  style={{ paddingLeft: "3.5rem" }}
                />
              </div>
            </div>

            {/* PHONE FIELD */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest" htmlFor={`${formId}-phone`} style={{ color: "var(--text-secondary)" }}>Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-0 pl-4 flex items-center pointer-events-none">
                  <PhoneIcon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="tel"
                  {...getInputProps("phone")}
                  inputMode="numeric"
                  className="input-field w-full py-3 pr-4 transition-all"
                  style={{ paddingLeft: "3.5rem" }}
                  placeholder="Phone number"
                />
                {touched.phone && errors.phone && (
                  <div className="absolute right-4">
                    <AlertCircle className="w-5 h-5" style={{ color: "#ef4444" }} />
                  </div>
                )}
              </div>
              {touched.phone && errors.phone && (
                <p id={errorId(formId, "phone")} className="field-error-text" role="alert">
                  {errors.phone}
                </p>
              )}
              {!errors.phone && <p className="field-help-text">Optional, but must be 10 digits if provided</p>}
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
