import React from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserIcon, MailIcon, PhoneIcon, Edit2Icon, ArrowLeft, ShieldCheck } from "lucide-react";

const Profile = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div
        className="flex items-center justify-center min-h-screen p-4"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="card p-8 text-center max-w-sm w-full">
          <UserIcon className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
            Please log in to view your profile.
          </p>
          <button onClick={() => navigate("/login")} className="btn-primary mt-4 w-full py-3">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 pt-24"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost mb-6 text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="card overflow-hidden">
          {/* Profile Header */}
          <div
            className="px-6 sm:px-8 py-8 text-center"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--color-accent-soft)" }}
            >
              <span className="text-3xl font-bold text-accent">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-2 truncate px-4"
              style={{ color: "var(--text-primary)" }}
            >
              {user.name || "User Profile"}
            </h2>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "var(--color-accent-soft)" }}
            >
              <ShieldCheck className="w-3 h-3 text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-widest">
                {user.role}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col gap-3">
            <ProfileField
              icon={<MailIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Email Address"
              value={user.email}
            />
            <ProfileField
              icon={<PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Phone Number"
              value={user.phone || "Not linked"}
            />
          </div>

          {/* Actions */}
          <div
            className="px-6 sm:px-8 pb-6 sm:pb-8 flex flex-col gap-3"
          >
            <button
              onClick={() => navigate("/edit-profile")}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Edit2Icon className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={() => navigate("/")}
              className="btn-secondary w-full py-3 text-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ icon, label, value }) => (
  <div
    className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl transition-colors duration-200"
    style={{ backgroundColor: "var(--bg-elevated)" }}
  >
    <div
      className="p-2 rounded-lg flex-shrink-0"
      style={{ backgroundColor: "var(--bg-input)" }}
    >
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-sm sm:text-base font-medium break-all leading-relaxed"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  </div>
);

export default Profile;
