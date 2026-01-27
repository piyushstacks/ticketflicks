import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Mail, Home } from "lucide-react";

const RegistrationPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            Registration Pending Approval
          </h2>

          {/* Message */}
          <div className="text-gray-300 space-y-4 mb-8">
            <p>
              Thank you for registering your theatre! Your application has been
              submitted successfully and is now under review by our admin team.
            </p>
            <p>
              You will receive an email with your login credentials once your
              registration has been approved. This process typically takes
              24-48 hours.
            </p>
          </div>

          {/* Features */}
          <div className="bg-gray-700/30 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Mail className="w-4 h-4" />
              <span>Check your email for updates</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
            
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition"
            >
              Go to Login
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-xs text-gray-500">
            <p>
              If you don't receive an email within 48 hours, please contact our
              support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPending;