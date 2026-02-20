import React from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserIcon, MailIcon, PhoneIcon, Edit2Icon } from "lucide-react";

const Profile = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <p className="text-lg font-medium">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-6 md:p-8 pt-24 pb-12">
      <div className="w-full max-w-lg bg-gray-800/50 backdrop-blur-sm rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
        {/* Content Area */}
        <div className="pt-10 pb-10 px-6 sm:px-10 text-center">
          {/* Profile Header without top background */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-gray-700/50 rounded-3xl flex items-center justify-center border-2 border-white/10 shadow-lg mb-4">
              <UserIcon size={48} className="text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 truncate px-4">
              {user.name || "User Profile"}
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {user.role}
              </span>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4 text-left max-w-sm mx-auto">
            <div className="group p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-gray-700/50 rounded-xl group-hover:text-primary transition-colors">
                  <MailIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                    Email Address
                  </p>
                  <p className="text-sm sm:text-base text-gray-200 font-medium break-all leading-relaxed">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="group p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-gray-700/50 rounded-xl group-hover:text-primary transition-colors">
                  <PhoneIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                    Phone Number
                  </p>
                  <p className="text-sm sm:text-base text-gray-200 font-medium">
                    {user.phone || "Not linked"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col gap-3 max-w-sm mx-auto">
            <button
              onClick={() => navigate("/edit-profile")}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
            >
              <Edit2Icon size={18} />
              Edit Profile
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full text-gray-400 hover:text-white py-3 px-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-all duration-300 text-sm font-medium"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
