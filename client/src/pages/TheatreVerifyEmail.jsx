import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { X, Mail, ArrowLeft, RefreshCw } from "lucide-react";

const TheatreVerifyEmail = ({ theatreData, managerData, screens }) => {
  const navigate = useNavigate();
  const { requestTheatreRegistrationOtp, completeTheatreRegistration } = useAuthContext();
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  if (!theatreData || !managerData || !screens) {
    navigate("/theatre-register");
    return null;
  }

  // Countdown timer
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const data = await completeTheatreRegistration({
        manager: managerData,
        theatre: theatreData,
        screens: screens,
        otp: otp
      });
      
      if (data.success) {
        toast.success("Theatre registered successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const data = await requestTheatreRegistrationOtp({ email: managerData.email });
      if (data.success) {
        toast.success("OTP resent successfully");
        setTimeLeft(120); // Reset timer
        setOtp(""); // Clear OTP input
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    navigate("/theatre-register", { 
      state: { theatreData, managerData, screens } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
            <p className="text-gray-400">
              We've sent a 6-digit OTP to<br />
              <span className="text-purple-400 font-medium">{managerData.email}</span>
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Enter OTP
              </label>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={otp[index] || ""}
                    onChange={(e) => {
                      const newOtp = otp.split('');
                      newOtp[index] = e.target.value;
                      setOtp(newOtp.join(''));
                      
                      // Auto-focus next input
                      if (e.target.value && index < 5) {
                        const nextInput = e.target.parentElement.children[index + 1];
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace
                      if (e.key === 'Backspace' && !otp[index] && index > 0) {
                        const prevInput = e.target.parentElement.children[index - 1];
                        prevInput?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-lg font-semibold bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-400">
                  OTP expires in <span className="text-purple-400 font-medium">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-400">OTP expired</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || timeLeft === 0}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                "Verify & Register"
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resending || timeLeft > 0}
              className="text-purple-400 hover:text-purple-300 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {resending ? "Resending..." : timeLeft > 0 ? "Resend OTP" : "Resend OTP"}
            </button>
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <button
              onClick={handleBack}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheatreVerifyEmail;
