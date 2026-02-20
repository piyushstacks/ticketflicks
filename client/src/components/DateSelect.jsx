import React, { useState } from "react";
import BlurCircle from "./BlurCircle";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    return date < today;
  };

  const onBookHandler = () => {
    if (!selected) {
      return toast("Please select a date first");
    }

    // Validate that selected date is not in the past
    if (isDateInPast(new Date(selected))) {
      return toast.error("Cannot book shows for past dates");
    }

    navigate(`/movies/${id}/${selected}`);
    scrollTo(0, 0);
  };

  return (
    <div id="dateSelect" className="pt-30">
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-10 relative p-8
       bg-primary/10 border border-primary/20 rounded-lg"
      >
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" right="0" />
        <div>
          <p className="text-lg font-semibold">Choose Date</p>
          <div className="flex items-center gap-6 text-sm mt-5">
            <ChevronLeftIcon width={28} />
            <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4">
              {dateTime && Object.keys(dateTime).map((date) => {
                const isPast = isDateInPast(new Date(date));
                const isSelected = selected === date;
                
                return (
                  <button
                    onClick={() => !isPast && setSelected(date)}
                    key={date}
                    disabled={isPast}
                    title={isPast ? "Past date - not available" : ""}
                    className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer 
                    ${
                      isSelected
                        ? "bg-primary"
                        : isPast
                        ? "border border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50"
                        : "border border-primary/70"
                    }`}
                  >
                  <span>{new Date(date).getDate()}</span>
                  <span>
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                  </button>
                );
              })}
            </span>
            <ChevronRightIcon width={28} />
          </div>
        </div>
        <button
          onClick={onBookHandler}
          className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer active:scale-90"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;
