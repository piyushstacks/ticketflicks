import React, { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Loading = () => {
  const { nextUrl } = useParams(); // nextUrl = "my-bookings"
  const navigate = useNavigate();
  const location = useLocation();
  const { axios } = useAppContext();

  useEffect(() => {
    let timeoutId;

    const verifyAndRedirect = async () => {
      if (nextUrl !== "my-bookings") return;

      const sessionId = new URLSearchParams(location.search).get("session_id");

      if (sessionId) {
        try {
          await axios.get(
            `/api/booking/verify?session_id=${encodeURIComponent(sessionId)}`
          );
        } catch (error) {
          console.log(error);
        }
      }

      timeoutId = setTimeout(() => {
        navigate("/my-bookings");
      }, 1200);
    };

    verifyAndRedirect();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [nextUrl, navigate, location.search, axios]);

  return (
    <div className="flex justify-center items-center h-[90vh]">
      <div className="animate-spin rounded-full h-14 w-14 border-2 border-t-primary"></div>
    </div>
  );
};

export default Loading;
