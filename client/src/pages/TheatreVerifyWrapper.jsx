import React, { useEffect, useState } from "react";
import TheatreVerifyEmail from "./TheatreVerifyEmail.jsx";

const TheatreVerifyWrapper = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedData = urlParams.get('data');
      
      if (encodedData) {
        const decodedData = JSON.parse(decodeURIComponent(encodedData));
        setData(decodedData);
      } else {
        // Fallback to location.state if available
        const location = window.location;
        if (location.state) {
          setData(location.state);
        }
      }
    } catch (error) {
      console.error("Error parsing verification data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-red-400">Invalid verification data</div>
      </div>
    );
  }

  return <TheatreVerifyEmail {...data} />;
};

export default TheatreVerifyWrapper;
