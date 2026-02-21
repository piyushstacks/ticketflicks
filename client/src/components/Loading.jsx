import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Loading = () => {
  const { nextUrl } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (nextUrl === "my-bookings") {
      setTimeout(() => {
        navigate("/my-bookings");
      }, 5000);
    }
  }, [nextUrl, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4 animate-fadeIn">
      <Loader2
        className="w-10 h-10 animate-spin"
        style={{ color: "var(--color-accent)" }}
      />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Loading...
      </p>
    </div>
  );
};

export default Loading;
